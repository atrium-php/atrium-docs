import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Atrium',
    description: 'A free, modular, upgradable Laravel platform for multi-portal apps',
    base: '/atrium-docs/',

    themeConfig: {
        nav: [
            { text: 'Guide', link: '/guide/getting-started' },
            { text: 'Packages', link: '/packages/' },
            { text: 'Portals', link: '/portals/landing' },
            { text: 'Reference', link: '/reference/config' },
        ],

        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'Getting Started', link: '/guide/getting-started' },
                    { text: 'Modules', link: '/guide/modules' },
                    { text: 'Customising without forking', link: '/guide/customising' },
                    { text: 'Upgrading', link: '/guide/upgrading' },
                    { text: 'Deploying', link: '/guide/deploying' },
                    { text: 'Build (and sell) a module', link: '/guide/build-a-module' },
                    { text: 'Single vs Multi Domain', link: '/guide/single-vs-multi-domain' },
                    { text: 'Cross-Subdomain SSO', link: '/guide/sso-sessions' },
                    { text: 'make:subdomain Command', link: '/guide/make-subdomain-command' },
                    { text: 'Roles & Permissions', link: '/guide/roles-and-permissions' },
                    { text: 'Theming', link: '/guide/theming' },
                    { text: 'Error Pages', link: '/guide/error-pages' },
                    { text: 'Search', link: '/guide/search' },
                    { text: 'Troubleshooting & FAQ', link: '/guide/troubleshooting' },
                ],
            },
            {
                text: 'Packages',
                items: [
                    { text: 'Overview', link: '/packages/' },
                    { text: 'Core', link: '/packages/core' },
                    { text: 'Skeleton', link: '/packages/skeleton' },
                    { text: 'Access Control', link: '/packages/access-control' },
                    { text: 'Activity', link: '/packages/activity' },
                    { text: 'Analytics', link: '/packages/analytics' },
                    { text: 'Announcements', link: '/packages/announcements' },
                    { text: 'API', link: '/packages/api' },
                    { text: 'Backup', link: '/packages/backup' },
                    { text: 'Billing', link: '/packages/billing' },
                    { text: 'Currency', link: '/packages/currency' },
                    { text: 'Feature Flags', link: '/packages/feature-flags' },
                    { text: 'Health', link: '/packages/health' },
                    { text: 'Impersonation', link: '/packages/impersonation' },
                    { text: 'Import / Export', link: '/packages/import-export' },
                    { text: 'Invitations', link: '/packages/invitations' },
                    { text: 'Language', link: '/packages/language' },
                    { text: 'Email templates', link: '/packages/mail-templates' },
                    { text: 'Maintenance', link: '/packages/maintenance' },
                    { text: 'Media', link: '/packages/media' },
                    { text: 'Notifications', link: '/packages/notifications' },
                    { text: 'Security', link: '/packages/security' },
                    { text: 'Teams', link: '/packages/teams' },
                    { text: 'Webhooks', link: '/packages/webhooks' },
                ],
            },
            {
                text: 'Portals',
                items: [
                    { text: 'Landing', link: '/portals/landing' },
                    { text: 'Auth', link: '/portals/auth' },
                    { text: 'Account', link: '/portals/account' },
                    { text: 'App', link: '/portals/app' },
                    { text: 'Backoffice', link: '/portals/backoffice' },
                ],
            },
            {
                text: 'Reference',
                items: [
                    { text: 'Config', link: '/reference/config' },
                    { text: 'Commands', link: '/reference/commands' },
                    { text: 'Env Vars', link: '/reference/env-vars' },
                    { text: 'Flux UI Pro', link: '/reference/flux-ui' },
                ],
            },
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/atrium-php/atrium' },
        ],
    },
});
