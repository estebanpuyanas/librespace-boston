/* global module, process, require */
/* eslint-disable @typescript-eslint/no-require-imports */

const app = require('./app.json');

const mapApiKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = {
  ...app.expo,
  plugins: [
    ...app.expo.plugins,
    ...(mapApiKey
      ? [
          [
            'react-native-maps',
            {
              androidGoogleMapsApiKey: mapApiKey,
              iosGoogleMapsApiKey: mapApiKey,
            },
          ],
        ]
      : []),
  ],
};
