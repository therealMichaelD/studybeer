module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        'babel-preset-expo',     // enables JSX + TypeScript
      ],
      plugins: [
        'react-native-reanimated/plugin',  // required for Reanimated
        require.resolve("expo-router/babel"), // required for Expo Router
      ],
    };
  };