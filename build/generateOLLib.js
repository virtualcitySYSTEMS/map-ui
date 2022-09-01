import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const isWindows = process.platform.indexOf('win') === 0;
const sourceDir = path.join('node_modules', 'ol');

/**
 * Parse the JSDoc output.
 * @param {string} output JSDoc output
 * @returns {Object} Symbol and define info.
 */
function parseOutput(output) {
  if (!output) {
    throw new Error('Expected JSON output');
  }

  let info;
  try {
    info = JSON.parse(String(output));
  } catch (err) {
    throw new Error(`Failed to parse output as JSON: ${ output}`);
  }
  if (!Array.isArray(info.symbols)) {
    throw new Error(`Expected symbols array: ${ output}`);
  }
  if (!Array.isArray(info.defines)) {
    throw new Error(`Expected defines array: ${ output}`);
  }

  return info;
}

/**
 * Get checked path of a binary.
 * @param {string} binaryName Binary name of the binary path to find.
 * @returns {string} Path.
 */
function getBinaryPath(binaryName) {
  const binary = isWindows ? `${binaryName}.cmd` : binaryName;

  const expectedPaths = [
    path.join('node_modules', '.bin', binary),
    path.resolve(
      path.join('node_modules', 'jsdoc', '.bin', binary),
    ),
  ];

  for (let i = 0; i < expectedPaths.length; i++) {
    const expectedPath = expectedPaths[i];
    if (fs.existsSync(expectedPath)) {
      return expectedPath;
    }
  }

  throw Error(
    `JsDoc binary was not found in any of the expected paths: ${ expectedPaths}`,
  );
}

/**
 * Spawn JSDoc.
 * @returns {Promise<Object>} Resolves with the JSDoc output (new metadata).
 *     If provided with an empty list of paths, resolves with null.
 */
function spawnJSDoc() {
  const jsdocConfig = path.join(
    'build',
    'info',
    'conf.json',
  );

  return new Promise((resolve, reject) => {
    let output = '';
    let errors = '';
    const child = spawn(getBinaryPath('jsdoc'), ['-c', jsdocConfig, sourceDir]);

    child.stdout.on('data', (data) => {
      output += String(data);
    });

    child.stderr.on('data', (data) => {
      errors += String(data);
    });

    child.on('exit', (code) => {
      if (code) {
        reject(new Error(errors || 'JSDoc failed with no output'));
        return;
      }

      let info;
      try {
        info = parseOutput(output);
      } catch (err) {
        reject(err);
        return;
      }
      resolve(info);
    });
  });
}

/**
 * Read the symbols from info file.
 * @returns {Promise<Array>} Resolves with an array of symbol objects.
 */
async function getSymbols() {
  const info = await spawnJSDoc();
  return info.symbols.filter(
    symbol => symbol.kind !== 'member' || symbol.exports,
  );
}

const exported = new Set();

/**
 * Generate an import statement.
 * @param {Object} symbol Symbol.
 * @param {string} member Member.
 * @returns {string|null} An import statement.
 */
function getImport(symbol, member) {
  const defaultExport = symbol.name.split('~');
  const namedExport = symbol.name.split('.');
  let importName;
  let exportName;
  let from;

  if (defaultExport.length > 1 || symbol.exports === 'default') {
    from = defaultExport[0].replace(/^module:/, '');
    importName = 'default';
    exportName = from.replace(/[./]+/g, '$');
  } else if (namedExport.length > 1 && (member || (symbol.exports && symbol.exports !== 'default'))) {
    from = namedExport[0].replace(/^module:/, '');
    importName = member || symbol.exports;
    exportName = `${from.replace(/[./]+/g, '$')}$${importName}`;
  }
  if (exportName && !exported.has(exportName)) {
    exported.add(exportName);
    return `export {${importName} as ${exportName}} from '${from}';`;
  }
  return null;
}

/**
 * Generate code to export a named symbol.
 * @param {Object} symbol Symbol.
 * @param {Object<string, string>} namespaces Already defined namespaces.
 * @param {Object} imports Imports.
 */
function formatSymbolExport(symbol, namespaces, imports) {
  const { name } = symbol;
  const parts = name.split('~');
  const nsParts = parts[0].replace(/^module:/, '').split(/[/.]/);
  const imp = getImport(symbol, nsParts.pop());
  if (imp) {
    imports[imp] = true;
  }
}

/**
 * Generate export code given a list symbol names.
 * @param {Array<Object>} symbols List of symbols.
 * @returns {string} Export code.
 */
function generateExports(symbols) {
  const namespaces = {};
  const imports = [];
  symbols.forEach((symbol) => {
    const { name } = symbol;
    if (name.indexOf('#') === -1) {
      const imp = getImport(symbol);
      if (imp) {
        imports[imp] = true;
      }
      formatSymbolExport(symbol, namespaces, imports);
    }
  });
  const source = Object.keys(imports)
    .map(line => line.replace('from \'ol/', 'from \'ol/'))
    .map(line => line.replace('from \'ol\'', 'from \'ol/index.js\''))
    .join('\n');
  return `${source}\nexport * from 'ol/index.js';\n`;
}

/**
 * Generate the exports code.
 * @returns {Promise<string>} Resolves with the exports code.
 */
export default async function main() {
  const symbols = await getSymbols();
  const code = generateExports(symbols);
  const filepath = path.join('lib', 'olLib.js');
  await fs.promises.writeFile(filepath, `/* eslint-disable */\n${code}`);
}
