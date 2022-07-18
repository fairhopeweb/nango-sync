import {
  NangoConfig,
  NangoConnection,
  NangoIntegrationsConfig,
  NangoMessage,
  NangoMessageAction,
  NangoRegisterConnectionMessage,
  NangoTriggerActionMessage
} from '@nangohq/core';
import * as fs from 'fs';
import * as path from 'path';
import { connect, ConsumeMessage, Channel } from 'amqplib';
import * as yaml from 'js-yaml';
import * as uuid from 'uuid';
import DatabaseConstructor from 'better-sqlite3';
import * as winston from 'winston';

/** -------------------- Server Internal Properties -------------------- */

const inboundSeverQueue = 'server_inbound';
const outboundSeverQueue = 'server_outbound';
let inboundRabbitChannel: Channel | null = null;
let outboundRabbitChannel: Channel | null = null;

// Server owned copies of nango-config.yaml and integrations.yaml for later reference
let nangoConfig: NangoConfig;
let loadedIntegrations: NangoIntegrationsConfig;

// Should be moved to an env variable
const serverIntegrationsRootDir = '/tmp/nango-integrations-server';
const serverNangoIntegrationsDir = path.join(
  serverIntegrationsRootDir,
  'nango-integrations'
);
fs.rmSync(serverIntegrationsRootDir, { recursive: true, force: true });
fs.mkdirSync(serverIntegrationsRootDir);
fs.cpSync(
  'node_modules',
  path.join(serverIntegrationsRootDir, 'node_modules'),
  { recursive: true }
); // yes this is incredibly hacky. Will be fixed with proper packages setup

// Setup logger
let logger: winston.Logger;
function setupMainServerLogger() {
  const nangoServerLogFormat = winston.format.printf((info) => {
    return `${info['timestamp']} ${info['level']} [SERVER-MAIN] ${info['message']}`;
  });

  logger = winston.createLogger({
    level: nangoConfig.main_server_log_level,
    format: winston.format.combine(
      winston.format.timestamp(),
      nangoServerLogFormat
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(serverIntegrationsRootDir, 'nango-server.log')
      })
    ]
  });

  if (process.env['NODE_ENV'] !== 'production') {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          nangoServerLogFormat
        )
      })
    );
  }

  logger.silly(
    'A SQL query goes to a bar, walks up to two tables and asks: "Can I join you?"'
  );
}

// Prepare SQLLite DB
const db = new DatabaseConstructor(
  path.join(serverIntegrationsRootDir, 'sqlite.db')
);
db.exec(`
CREATE TABLE nango_connections (
    uuid VARCHAR(36) NOT NULL,
    integration TEXT NOT NULL,
    user_id TEXT NOT NULL,
    oauth_access_token TEXT NOT NULL,
    additional_config TEXT,
    datecreated DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    lastmodified DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
PRIMARY KEY (uuid),
UNIQUE (integration, user_id)
);

CREATE TRIGGER update_lastmodified_nango_connections
AFTER UPDATE On nango_connections
BEGIN
    UPDATE nango_connections SET lastmodiefied = STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW') WHERE uuid = NEW.uuid;
END;
`);

/** -------------------- Inbound message handling -------------------- */

async function handleInboundMessage(msg: ConsumeMessage | null) {
  if (msg === null) {
    return; // Skipp non-existing messages (honestly no idea why we might get null here but supposedly it can happen)
  }

  const nangoMessage = JSON.parse(msg.content.toString()) as NangoMessage;

  logger.debug(`Server received message:\n${msg.content.toString()}`);

  let result = null;
  switch (nangoMessage.action) {
    case NangoMessageAction.REGISTER_CONNECTION: {
      const registerMessage = nangoMessage as NangoRegisterConnectionMessage;
      handleRegisterConnection(registerMessage);
      break;
    }
    case NangoMessageAction.TRIGGER_ACTION: {
      const triggerMessage = nangoMessage as NangoTriggerActionMessage;
      result = await handleTriggerAction(triggerMessage);

      outboundRabbitChannel?.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(result), 'utf8'),
        {
          correlationId: msg.properties.correlationId
        }
      );

      break;
    }
    default: {
      throw new Error(
        `Received inbound server message with unknown action: ${nangoMessage.action}`
      );
    }
  }

  if (result !== null) {
    // Send response back to client
  }

  inboundRabbitChannel?.ack(msg);
}

function bootstrapServer() {
  if (!process.env['NANGO_INTEGRATIONS_PACKAGE_DIR']) {
    throw new Error(
      `Fatal server error, cannot bootstrap: NANGO_INTEGRATIONS_PACKAGE_DIR is not set.`
    );
  }

  // - Copies nango-integrations folder into a server-owned location
  const nangoIntegrationsPackagePath =
    process.env['NANGO_INTEGRATIONS_PACKAGE_DIR'];

  fs.cpSync(nangoIntegrationsPackagePath, serverIntegrationsRootDir, {
    recursive: true
  }); // TODO: Rework this, it is an experimental feature of node >16.7

  // Read nango-config.yaml
  nangoConfig = yaml.load(
    fs
      .readFileSync(path.join(serverNangoIntegrationsDir, 'nango-config.yaml'))
      .toString()
  ) as NangoConfig;

  // - Reads integrations.yaml and stores it for later reference
  loadedIntegrations = yaml.load(
    fs
      .readFileSync(path.join(serverNangoIntegrationsDir, 'integrations.yaml'))
      .toString()
  ) as NangoIntegrationsConfig;

  // Must happen once config is loaded as it contains the log level
  setupMainServerLogger();

  logger.info('Server ready!');
}

function handleRegisterConnection(nangoMsg: NangoRegisterConnectionMessage) {
  // Check if the connection already exists
  const dbRes = db
    .prepare(
      'SELECT uuid FROM nango_connections WHERE integration = ? AND user_id = ?'
    )
    .all([nangoMsg.integration, nangoMsg.userId]);
  if (dbRes.length > 0) {
    throw new Error(
      `Cannot register connection, connection for itegration '${nangoMsg.integration}' and user_id '${nangoMsg.userId}' already exists`
    );
  }

  db.prepare(
    `
        INSERT INTO nango_connections
        (uuid, integration, user_id, oauth_access_token, additional_config)
        VALUES (?, ?, ?, ?, ?)
    `
  ).run(
    uuid.v4(),
    nangoMsg.integration,
    nangoMsg.userId,
    nangoMsg.oAuthAccessToken,
    JSON.stringify(nangoMsg.additionalConfig)
  );
}

async function handleTriggerAction(nangoMsg: NangoTriggerActionMessage) {
  // Check if the integration exists
  let integrationConfig = null;
  for (const integration of loadedIntegrations.integrations) {
    const integrationName = Object.keys(integration)[0];
    if (integrationName === nangoMsg.integration) {
      integrationConfig = integration[integrationName];
    }
  }

  if (integrationConfig === null) {
    throw new Error(
      `Tried to trigger an action for an integration that does not exist: ${nangoMsg.integration}`
    );
  }

  // Check if the connection exists
  const connection = db
    .prepare(
      'SELECT * FROM nango_connections WHERE integration = ? AND user_id = ?'
    )
    .get(nangoMsg.integration, nangoMsg.userId);
  if (connection === undefined) {
    throw new Error(
      `Tried to trigger action '${nangoMsg.triggeredAction}' for integration '${nangoMsg.integration}' with user_id '${nangoMsg.userId}' but no connection exists for this user_id and integration`
    );
  }
  const connectionObject = {
    uuid: connection.uuid,
    integration: connection.integration,
    userId: connection.user_id,
    oAuthAccessToken: connection.oauth_access_token,
    additionalConfig: JSON.parse(connection.additional_config)
  } as NangoConnection;

  // Check if the action (file) exists
  const actionFilePath = path.join(
    path.join(serverNangoIntegrationsDir, nangoMsg.integration),
    nangoMsg.triggeredAction + '.action.js'
  );
  if (!fs.existsSync(actionFilePath)) {
    throw new Error(
      `Tried to trigger action '${nangoMsg.triggeredAction}' for integration '${nangoMsg.integration}' but the action file at '${actionFilePath}' does not exist`
    );
  }

  const actionLogPath = path.join(
    serverIntegrationsRootDir,
    'nango-server.log'
  );

  // Load the JS file and execute the action
  const actionModule = await import(actionFilePath);
  const key = Object.keys(actionModule)[0] as string;
  const actionInstance = new actionModule[key](
    nangoConfig,
    integrationConfig,
    connectionObject,
    actionLogPath,
    nangoMsg.triggeredAction
  );
  const result = await actionInstance.executeAction(nangoMsg.input);
  actionInstance.markExecutionComplete();
  logger.debug(`Result from action: ${JSON.stringify(result)}`);

  return result;
}

async function connectRabbit() {
  const rabbitConnection = await connect('amqp://localhost');

  inboundRabbitChannel = await rabbitConnection.createChannel();
  await inboundRabbitChannel.assertQueue(inboundSeverQueue);

  inboundRabbitChannel.consume(inboundSeverQueue, handleInboundMessage);

  outboundRabbitChannel = await rabbitConnection.createChannel();
  await outboundRabbitChannel.assertQueue(outboundSeverQueue);
}

// Alright, let's run!
bootstrapServer(); // Must happen before we start to process messages
connectRabbit();