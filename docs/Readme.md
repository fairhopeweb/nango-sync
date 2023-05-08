These docs were written for Nango sync as part of a docusaurus 2.4.0 project.

To deploye them into a docs page:
- Move the contents of `nango-sync` in this directory into the `docs` folder of a new docusaurus install
- Move the contents of `img` in this directory into the `static/img` folder of a new docusaurus install

Alternatively you can search & render the Markdown pages with any markdown editor.

docusauraus sidebar object:

```
docsSidebar: [
        'nango-sync/introduction',
        'nango-sync/quickstart',
        {
            type: 'category',
            label: 'Use Nango Sync',
            items: [
                {
                    id: 'nango-sync/use-nango/core-concepts',
                    type: 'doc',
                    label: 'Core concepts'
                },
                {
                    type: 'category',
                    label: 'Create Syncs',
                    items: [
                        {
                            id: 'nango-sync/use-nango/sync-all-options',
                            type: 'doc',
                            label: 'All Options'
                        },
                        {
                            id: 'nango-sync/use-nango/sync-modes',
                            type: 'doc',
                            label: 'Modes'
                        },
                        {
                            id: 'nango-sync/use-nango/sync-schedule',
                            type: 'doc',
                            label: 'Scheduling'
                        },
                        {
                            id: 'nango-sync/use-nango/sync-metadata',
                            type: 'doc',
                            label: 'Metadata'
                        },
                        {
                            id: 'nango-sync/use-nango/sync-pagination',
                            type: 'doc',
                            label: 'Pagination'
                        },
                        {
                            id: 'nango-sync/use-nango/sync-auth',
                            type: 'doc',
                            label: 'Authentication'
                        }
                    ]
                },
                {
                    id: 'nango-sync/use-nango/manage-syncs',
                    type: 'doc',
                    label: 'Manage Syncs'
                },
                {
                    id: 'nango-sync/use-nango/sync-notifications',
                    type: 'doc',
                    label: 'Sync Notifications'
                },
                {
                    id: 'nango-sync/use-nango/schema-mappings',
                    type: 'doc',
                    label: 'Schema mappings'
                },
                {
                    id: 'nango-sync/use-nango/db-config',
                    type: 'doc',
                    label: 'DB Configuration'
                },
                {
                    id: 'nango-sync/use-nango/observability',
                    type: 'doc',
                    label: 'Observability'
                }
            ]
        },
        {
            id: 'nango-sync/real-world-examples',
            type: 'doc',
            label: 'Examples'
        },
        {
            id: 'nango-sync/architecture',
            type: 'doc',
            label: 'Architecture & Vision'
        },
        {
            id: 'nango-sync/license-faq',
            type: 'doc',
            label: 'License FAQ & Pricing'
        },
        'nango-sync/contributing'
    ], // Next sidebar
```