export default {
  "title": "Smart Invoice FAQ",
  "tagline": "Your #1 Guide to Smart Invoice",
  "url": "https://your-docusaurus-test-site.com",
  "baseUrl": "/",
  "onBrokenLinks": "throw",
  "onBrokenMarkdownLinks": "warn",
  "favicon": "img/favicon.ico",
  "organizationName": "raid-guild",
  "projectName": "Smart-Invoice.FAQ",
  "themeConfig": {
    "navbar": {
      "title": "Smart Invoice FAQ",
      "logo": {
        "alt": "My Site Logo",
        "src": "img/logo.svg"
      },
      "items": [
        {
          "href": "https://github.com/raid-guild/smart-invoice",
          "label": "GitHub",
          "position": "right"
        }
      ],
      "hideOnScroll": false
    },
    "footer": {
      "style": "dark",
      "links": [
        {
          "title": "Docs",
          "items": [
            {
              "label": "Getting Started",
              "to": "docs/introducing-smart-invoice",
              "position": "left"
            },
            {
              "label": "GitHub",
              "href": "https://github.com/raid-guild/smart-invoice",
              "position": "left"
            }
          ]
        },
        {
          "title": "Community",
          "items": [
            {
              "label": "Discord",
              "href": "https://discord.gg/YwfYQbWG",
              "position": "right"
            },
            {
              "label": "Twitter",
              "href": "https://twitter.com/RaidGuild",
              "position": "right"
            }
          ]
        }
      ],
      "copyright": "Copyright © 2021 RaidGuild, DAO"
    },
    "colorMode": {
      "defaultMode": "light",
      "disableSwitch": false,
      "respectPrefersColorScheme": false,
      "switchConfig": {
        "darkIcon": "🌜",
        "darkIconStyle": {},
        "lightIcon": "🌞",
        "lightIconStyle": {}
      }
    },
    "docs": {
      "versionPersistence": "localStorage"
    },
    "metadatas": [],
    "prism": {
      "additionalLanguages": []
    },
    "hideableSidebar": false
  },
  "presets": [
    [
      "@docusaurus/preset-classic",
      {
        "docs": {
          "sidebarPath": "/Users/burle/Downloads/githubprojects/smart-invoice/packages/FAQ/sidebars.js",
          "editUrl": "https://github.com/facebook/docusaurus/edit/master/website/"
        },
        "blog": {
          "showReadingTime": true,
          "editUrl": "https://github.com/facebook/docusaurus/edit/master/website/blog/"
        },
        "theme": {
          "customCss": "/Users/burle/Downloads/githubprojects/smart-invoice/packages/FAQ/src/css/custom.css"
        }
      }
    ]
  ],
  "baseUrlIssueBanner": true,
  "i18n": {
    "defaultLocale": "en",
    "locales": [
      "en"
    ],
    "localeConfigs": {}
  },
  "onDuplicateRoutes": "warn",
  "customFields": {},
  "plugins": [],
  "themes": [],
  "titleDelimiter": "|",
  "noIndex": false
};