#!/usr/bin/env node

/**
 * Build script for browser extensions
 * Validates and prepares extensions for loading
 */

const fs = require('fs');
const path = require('path');

const EXTENSIONS_DIR = path.join(__dirname, '..', 'extensions');

function log(message, type = 'info') {
  const prefix = {
    info: '✓',
    warn: '⚠',
    error: '✗',
  }[type];
  console.log(`${prefix} ${message}`);
}

function validateManifest(manifestPath) {
  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    // Required fields
    const required = ['name', 'version', 'manifest_version'];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check manifest version
    if (manifest.manifest_version !== 3 && manifest.manifest_version !== 2) {
      log(`Warning: manifest_version ${manifest.manifest_version} may not be supported`, 'warn');
    }

    return manifest;
  } catch (error) {
    throw new Error(`Invalid manifest.json: ${error.message}`);
  }
}

function validateExtension(extensionDir) {
  const manifestPath = path.join(extensionDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json not found');
  }

  const manifest = validateManifest(manifestPath);

  // Check for referenced files
  const filesToCheck = [];

  if (manifest.background) {
    if (manifest.background.service_worker) {
      filesToCheck.push(manifest.background.service_worker);
    }
    if (manifest.background.scripts) {
      filesToCheck.push(...manifest.background.scripts);
    }
  }

  if (manifest.content_scripts) {
    for (const script of manifest.content_scripts) {
      if (script.js) {
        filesToCheck.push(...script.js);
      }
      if (script.css) {
        filesToCheck.push(...script.css);
      }
    }
  }

  // Verify files exist
  for (const file of filesToCheck) {
    const filePath = path.join(extensionDir, file);
    if (!fs.existsSync(filePath)) {
      log(`Warning: Referenced file not found: ${file}`, 'warn');
    }
  }

  return manifest;
}

function buildExtensions() {
  log('Building extensions...');

  if (!fs.existsSync(EXTENSIONS_DIR)) {
    log('No extensions directory found', 'warn');
    return;
  }

  const entries = fs.readdirSync(EXTENSIONS_DIR, { withFileTypes: true });
  const extensions = entries.filter((e) => e.isDirectory());

  if (extensions.length === 0) {
    log('No extensions found', 'warn');
    return;
  }

  let validCount = 0;
  let invalidCount = 0;

  for (const ext of extensions) {
    const extPath = path.join(EXTENSIONS_DIR, ext.name);
    try {
      const manifest = validateExtension(extPath);
      log(`Valid extension: ${manifest.name} v${manifest.version}`);
      validCount++;
    } catch (error) {
      log(`Invalid extension ${ext.name}: ${error.message}`, 'error');
      invalidCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  log(`Extensions validated: ${validCount} valid, ${invalidCount} invalid`);

  if (invalidCount > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildExtensions();
}

module.exports = { buildExtensions, validateExtension };
