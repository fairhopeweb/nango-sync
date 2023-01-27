---
slug: /sync
sidebar_label: Introduction
---

# Nango: The fast way to integrate your app with 3rd-party APIs

The service that lets you easily synchronise data between your app and any 3rd-party API.


## ⭐ Why Nango?

Adding integrations to an app is complicated.

At first, it looks as simple as making requests to a 3rd-party API. But you quickly need to build OAuth, background synchronisation, retries, pagination, caching, webhooks, data transformation, monitoring, etc.

We pre-built these components so you don’t have to and can focus on shipping low maintenance integrations fast.

## ✨ How it works

With Nango, building integrations becomes as simple as: 

1. Authenticate users with OAuth in your frontend: 

```jsx
nango.auth('hubspot', '<user-id>'); // Starts OAuth flow
```

2. Easily sync data from any API endpoint to your DB in the backend:

```tsx
nango.sync('https://api.hubspot.com/crm/v3/contacts', config); // Syncs contacts forever!
```

3. Read the always-fresh data from the DB and use it in your app
```sql
SELECT * FROM hubspot_contacts WHERE ...
```

Additionally, Nango has out-of-the-box support for:

- 🔐 OAuth token retrieval & refresh
- 📶 Incremental syncs
- 🪝 Webhooks
- ⚡️ JSON-to-SQL schema mapping
- 🔄 Retries & rate-limit handling
- 🚀 Scalable & flexible open-source infrastructure
- ✅ Language-agnostic
- ☁️ Self-hosted and Cloud options

## 🧑‍💻 Example use cases

Nango is API agnostic: It works with any API endpoint that returns JSON (you just need to [give it a few details](nango-sync/use-nango/sync-all-options.md) about the endpoint).

While Nango supports millions of APIs, here are some of the most popular ones:

- **CRMs** such as [HubSpot](real-world-examples.md#hubspot-sync-all-hubspot-crm-contacts), Salesforce, Pipedrive, Zoho CRM, Zendesk Sell etc.
- **Accounting systems** such as Quickbooks, Xero, Netsuite, Zoho Books, Freshbooks etc.
- **Cloud providers** such as AWS, GCP, Azure, DigitalOcean, Fly.io, Heroku etc.
- **Productivity tools** such as Gmail, Google Calendar, [Slack](real-world-examples.md#slack-sync-all-posts-from-a-slack-channel), Outlook 365, Zoom, Google Drive etc.
- **Project Management tools** such as Airtable, Asana, Monday.com, ClickUp etc.
- **Dev tools** such as [Github](real-world-examples.md#github-sync-all-stargazers-from-a-repo), Gitlab, JIRA, Trello, Figma etc.
-   ...any API endpoint that returns JSON

The docs have [more examples](real-world-examples.md) of Nango configurations for different APIs and endpoints.

## 🔍 Try it & learn more

**See Nango in Action**  
The fastest way to see Nango in action is with our [Quickstart 🚀](nango-sync/quickstart.md), head over there and sync data to your local machine in less than 3 minutes.

**Understand how Nango works**  
If you are ready to take a closer look we recommend you start with the [Core concepts](nango-sync/use-nango/core-concepts.md).

**See what you can build with Nango**  
You can also check out some [real-world examples](real-world-examples.md) of things you can sync with Nango (keep in mind, it works with any API endpoint so these are just examples). Or join our [Slack community](https://nango.dev/slack) to see what others are building with Nango.