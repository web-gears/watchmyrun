const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const version = pkg.version || '1.1.0';
const timestamp = Date.now();

const versionJson = {
  version,
  buildTimestamp: timestamp,
  appName: 'WatchMy.Run',
  builtAt: new Date(timestamp).toISOString(),
};

// Write public/version.json
const publicPath = path.join(__dirname, '../public/version.json');
fs.writeFileSync(publicPath, JSON.stringify(versionJson, null, 2) + '\n', 'utf8');

// Write src/lib/version.ts
const libVersionPath = path.join(__dirname, '../src/lib/version.ts');
const tsContent = `// Automatically generated during build
export const APP_VERSION = '${version}';
export const BUILD_TIMESTAMP = ${timestamp};
export const BUILD_DATE = '${new Date(timestamp).toISOString()}';
`;
fs.writeFileSync(libVersionPath, tsContent, 'utf8');

console.log(`[Version Generator] Generated version ${version} (${new Date(timestamp).toISOString()})`);
