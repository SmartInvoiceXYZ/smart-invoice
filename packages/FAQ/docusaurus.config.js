/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Smart Invoice FAQ',
  tagline: 'Your #1 Guide to Smart Invoice',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'raid-guild', // Usually your GitHub org/user name.
  projectName: 'Smart-Invoice.FAQ', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'Smart Invoice FAQ',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      items: [
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
              position: 'left'
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/YwfYQbWG',
              position: 'right'
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/RaidGuild',
              position: 'right'
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
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
