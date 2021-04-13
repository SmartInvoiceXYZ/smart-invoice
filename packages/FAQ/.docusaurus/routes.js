
import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';
export default [
{
  path: '/',
  component: ComponentCreator('/','deb'),
  exact: true,
},
{
  path: '/__docusaurus/debug',
  component: ComponentCreator('/__docusaurus/debug','3d6'),
  exact: true,
},
{
  path: '/__docusaurus/debug/config',
  component: ComponentCreator('/__docusaurus/debug/config','914'),
  exact: true,
},
{
  path: '/__docusaurus/debug/content',
  component: ComponentCreator('/__docusaurus/debug/content','c28'),
  exact: true,
},
{
  path: '/__docusaurus/debug/globalData',
  component: ComponentCreator('/__docusaurus/debug/globalData','3cf'),
  exact: true,
},
{
  path: '/__docusaurus/debug/metadata',
  component: ComponentCreator('/__docusaurus/debug/metadata','31b'),
  exact: true,
},
{
  path: '/__docusaurus/debug/registry',
  component: ComponentCreator('/__docusaurus/debug/registry','0da'),
  exact: true,
},
{
  path: '/__docusaurus/debug/routes',
  component: ComponentCreator('/__docusaurus/debug/routes','244'),
  exact: true,
},
{
  path: '/markdown-page',
  component: ComponentCreator('/markdown-page','be1'),
  exact: true,
},
{
  path: '/docs',
  component: ComponentCreator('/docs','ad7'),
  
  routes: [
{
  path: '/docs/complete-invoice',
  component: ComponentCreator('/docs/complete-invoice','ea7'),
  exact: true,
},
{
  path: '/docs/creating-a-smart-invoice',
  component: ComponentCreator('/docs/creating-a-smart-invoice','d4c'),
  exact: true,
},
{
  path: '/docs/deposit-or-release',
  component: ComponentCreator('/docs/deposit-or-release','752'),
  exact: true,
},
{
  path: '/docs/FAQ',
  component: ComponentCreator('/docs/FAQ','d46'),
  exact: true,
},
{
  path: '/docs/glossary',
  component: ComponentCreator('/docs/glossary','65f'),
  exact: true,
},
{
  path: '/docs/how-does-it-work',
  component: ComponentCreator('/docs/how-does-it-work','0ab'),
  exact: true,
},
{
  path: '/docs/introducing-smart-invoice',
  component: ComponentCreator('/docs/introducing-smart-invoice','f5e'),
  exact: true,
},
{
  path: '/docs/view-existing-invoice',
  component: ComponentCreator('/docs/view-existing-invoice','9e5'),
  exact: true,
},
]
},
{
  path: '*',
  component: ComponentCreator('*')
}
];
