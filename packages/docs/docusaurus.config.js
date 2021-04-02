/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Smart Invoice FAQ',
  tagline: 'Your #1 Guide to Smart Invoice',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/logo.png',
  organizationName: 'raid-guild',
  projectName: 'smart-invoice',
  themeConfig: {
    navbar: {
      title: 'Smart Invoice',
      logo: {
        alt: 'RaidGuild Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          href: 'https://smartinvoice.xyz',
          label: 'Dapp',
          position: 'right',
        },
        {
          href: 'https://github.com/raid-guild/smart-invoice',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/introducing-smart-invoice',
              position: 'left',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/raid-guild/smart-invoice',
              position: 'left',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/CanD2WcK7W',
              position: 'right',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/RaidGuild',
              position: 'right',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} RaidGuild, DAO`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/raid-guild/smart-invoice/edit/master/packages/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
