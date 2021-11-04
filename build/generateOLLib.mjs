import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { walk } from 'walk';

const isWindows = process.platform.indexOf('win') === 0;

const sourceDir = path.join('node_modules', 'ol', 'src');

/**
 * Generate a list of all .js paths in the source directory.
 * @return {Promise<Array>} Resolves to an array of source paths.
 */
function getPaths() {
  return new Promise((resolve, reject) => {
    let paths = [];

    const walker = walk(sourceDir);
    walker.on('file', (root, stats, next) => {
      const sourcePath = path.join(root, stats.name);
      if (/\.js$/.test(sourcePath)) {
        paths.push(sourcePath);
      }
      next();
    });
    walker.on('errors', () => {
      reject(new Error(`Trouble walking ${sourceDir}`));
    });

    walker.on('end', () => {
      /**
       * Windows has restrictions on length of command line, so passing all the
       * changed paths to a task will fail if this limit is exceeded.
       * To get round this, if this is Windows and there are newer files, just
       * pass the sourceDir to the task so it can do the walking.
       */
      if (isWindows) {
        paths = [sourceDir];
      }

      resolve(paths);
    });
  });
}

/**
 * Parse the JSDoc output.
 * @param {string} output JSDoc output
 * @return {Object} Symbol and define info.
 */
function parseOutput(output) {
  if (!output) {
    throw new Error('Expected JSON output');
  }

  let info;
  try {
    info = JSON.parse(String(output));
  } catch (err) {
    throw new Error('Failed to parse output as JSON: ' + output);
  }
  if (!Array.isArray(info.symbols)) {
    throw new Error('Expected symbols array: ' + output);
  }
  if (!Array.isArray(info.defines)) {
    throw new Error('Expected defines array: ' + output);
  }

  return info;
}

/**
 * Get checked path of a binary.
 * @param {string} binaryName Binary name of the binary path to find.
 * @return {string} Path.
 */
function getBinaryPath(binaryName) {
  if (isWindows) {
    binaryName += '.cmd';
  }

  const expectedPaths = [
    path.join('node_modules', '.bin', binaryName),
    path.resolve(
      path.join('node_modules', 'jsdoc', '.bin', binaryName)
    ),
  ];

  for (let i = 0; i < expectedPaths.length; i++) {
    const expectedPath = expectedPaths[i];
    if (fs.existsSync(expectedPath)) {
      return expectedPath;
    }
  }

  throw Error(
    'JsDoc binary was not found in any of the expected paths: ' + expectedPaths
  );
}

/**
 * Spawn JSDoc.
 * @param {Array<string>} paths Paths to source files.
 * @return {Promise<string>} Resolves with the JSDoc output (new metadata).
 *     If provided with an empty list of paths, resolves with null.
 */
function spawnJSDoc(paths) {
  const jsdocConfig = path.join(
    'build',
    'info',
    'conf.json'
  );

  return new Promise((resolve, reject) => {
    let output = '';
    let errors = '';
    const child = spawn(getBinaryPath('jsdoc'), ['-c', jsdocConfig].concat(paths));

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
 * Generate info from the sources.
 * @return {Promise<Error>} Resolves with the info object.
 */
async function generateInfo() {
  const paths = await getPaths();
  return spawnJSDoc(paths);
}
/**
 * Read the symbols from info file.
 * @return {Promise<Array>} Resolves with an array of symbol objects.
 */
async function getSymbols() {
  const info = await generateInfo();
  return info.symbols.filter((symbol) => symbol.kind !== 'member');
}

/**
 * Generate an import statement.
 * @param {Object} symbol Symbol.
 * @param {string} member Member.
 * @return {string} An import statement.
 */
function getImport(symbol, member) {
  const defaultExport = symbol.name.split('~');
  const namedExport = symbol.name.split('.');
  if (defaultExport.length > 1) {
    const from = defaultExport[0].replace(/^module\:/, '');
    const importName = from.replace(/[.\/]+/g, '$');
    return `export {default as ${importName}} from '${from}';`;
  } else if (namedExport.length > 1 && member) {
    const from = namedExport[0].replace(/^module\:/, '');
    const importName = from.replace(/[.\/]+/g, '$');
    return `export {${member} as ${importName}$${member}} from '${from}';`;
  }
}

/**
 * Generate code to export a named symbol.
 * @param {Object} symbol Symbol.
 * @param {Object<string, string>} namespaces Already defined namespaces.
 * @param {Object} imports Imports.
 * @return {string} Export code.
 */
function formatSymbolExport(symbol, namespaces, imports) {
  const name = symbol.name;
  const parts = name.split('~');
  const nsParts = parts[0].replace(/^module\:/, '').split(/[\/\.]/);
  imports[getImport(symbol, nsParts.pop())] = true;
}

/**
 * Generate export code given a list symbol names.
 * @param {Array<Object>} symbols List of symbols.
 * @return {string} Export code.
 */
function generateExports(symbols) {
  const namespaces = {};
  const imports = [];
  symbols.forEach(function (symbol) {
    const name = symbol.name;
    if (name.indexOf('#') === -1) {
      const imp = getImport(symbol);
      if (imp) {
        imports[getImport(symbol)] = true;
      }
      formatSymbolExport(symbol, namespaces, imports);
    }
  });
  const source = Object.keys(imports).join('\n');
  return `${source}\nexport * from 'ol';\n`;
}

/**
 * Generate the exports code.
 * @return {Promise<string>} Resolves with the exports code.
 */
export default async function main() {
  const symbols = await getSymbols();
  const code = generateExports(symbols);
  const filepath = path.join('lib', 'olLib.js');
  await fs.promises.writeFile(filepath, code);
}

