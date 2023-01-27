import { Nango, NangoHttpMethod } from '@nangohq/node-client';

// Test from the 'nango' folder root with command: npm run example syncHubspotContactsWithAuth [NANGO-PROVIDER-CONFIG-KEY] [NANGO-CONNECTION-ID]
// Endpoint docs: https://developers.hubspot.com/docs/api/crm/contacts
export let syncHubspotContactsWithAuth = async (nangoProviderConfigKey: string, nangoConnectionId: string) => {
    let config = {
        friendly_name: 'Hubspot Contacts With Auth', // Give this Sync a name for prettier logs.
        mapped_table: 'hubspot_contacts', // Name of the destination SQL table
        method: NangoHttpMethod.GET, // Required info to query the right endpoint.
        headers: { authorization: 'Bearer ${nangoAccessToken}' }, // For auth, using Nango Oauth (cf. github.com/NangoHQ/nango).
        query_params: { limit: 100 }, // Get 100 records per page (HubSpot API setting)
        paging_cursor_request_path: 'after', // For adding pagination data in requests.
        paging_cursor_metadata_response_path: 'paging.next.after', // For finding pagination data in responses.
        response_path: 'results', // For finding records in the API response.
        unique_key: 'id', // Provide response field path for deduping records.
        max_total: 100, // For fetching limited records while testing.
        frequency: '1 minute', // How often sync jobs run in natural language.
        nango_connection_id: nangoConnectionId, // Pre-configured Nango connection ID (cf. github.com/NangoHQ/nango).
        nango_provider_config_key: nangoProviderConfigKey // Pre-configured Nango provider configuration (cf. github.com/NangoHQ/nango).
    };

    return new Nango().sync('https://api.hubapi.com/crm/v3/objects/contacts', config);
};
