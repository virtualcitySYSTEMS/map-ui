/* eslint import/no-extraneous-dependencies: ["error", { "devDependencies": false }] */
import os from 'os';

/**
 * Determine the host based on the _first_ non internal interface. Used if server is started with an empty "--host" flag.
 * @returns {string|null}
 */
export function determineHostIpFromInterfaces() {
  const interFace = Object.values(os.networkInterfaces())
    .flatMap((nInterface) => nInterface ?? [])
    .find(
      (detail) =>
        detail &&
        detail.address &&
        !detail.internal &&
        detail.family === 'IPv4',
    );
  return interFace?.address ?? null;
}

/**
 * @param {number} [defaultPort=8080]
 * @param {boolean} [defaultHttps=false]
 * @param {string} [defaultHost='127.0.0.1']
 * @returns {string}
 */
export function determineHostFromArgv(
  defaultPort = 8080,
  defaultHttps = false,
  defaultHost = '127.0.0.1',
) {
  let port = defaultPort;
  const portIndex = process.argv.indexOf('--port');
  if (portIndex > -1 && process.argv.length > portIndex + 1) {
    const portNumber = Number(process.argv[portIndex + 1]);
    if (Number.isFinite(portNumber)) {
      port = portNumber;
    }
  }

  let protocol = defaultHttps ? 'https' : 'http';
  if (process.argv.includes('--https')) {
    protocol = 'https';
  }

  const hostIndex = process.argv.indexOf('--host');
  let host = defaultHost;
  if (hostIndex > -1) {
    if (
      process.argv.length > hostIndex + 1 &&
      !process.argv[hostIndex + 1].startsWith('-')
    ) {
      host = process.argv[hostIndex + 1];
    } else {
      host = determineHostIpFromInterfaces() ?? host;
    }
  }
  return `${protocol}://${host}:${port}`;
}
