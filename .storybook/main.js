const path = require('path');

module.exports = {
  "stories": [
    "../components/stories/**/*.stories.mdx",
    "../components/stories/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
  ],
  "core": {
    "builder": "storybook-builder-vite"
  },
  viteFinal: async (config, { configType }) => {
    console.log(config);
    console.log(__dirname);
    config.resolve.alias = { ...config.resolve.alias, ...{
        "@": `${path.resolve(__dirname, "../src")}`,
        '@vcsuite/uicomponents': `${path.resolve(__dirname, "../components")}`
      }
    };
    console.log(config);
    return config;
  },
}
