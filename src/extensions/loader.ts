import * as fs from 'fs';
import * as path from 'path';
import { ExtensionManifest } from '../types';
import { logger } from '../utils/logger';

export class ExtensionLoader {
  private extensionsPath: string;
  private loadedExtensions: Map<string, ExtensionManifest> = new Map();

  constructor(extensionsPath: string = './extensions') {
    this.extensionsPath = path.resolve(extensionsPath);
  }

  /**
   * Discover all extensions in the extensions directory
   */
  async discoverExtensions(): Promise<string[]> {
    const extensionPaths: string[] = [];

    if (!fs.existsSync(this.extensionsPath)) {
      logger.warn(`Extensions directory not found: ${this.extensionsPath}`);
      return extensionPaths;
    }

    const entries = fs.readdirSync(this.extensionsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const extPath = path.join(this.extensionsPath, entry.name);
        const manifestPath = path.join(extPath, 'manifest.json');

        if (fs.existsSync(manifestPath)) {
          extensionPaths.push(extPath);
          logger.info(`Discovered extension: ${entry.name}`);
        }
      }
    }

    return extensionPaths;
  }

  /**
   * Load and validate an extension manifest
   */
  async loadExtensionManifest(extensionPath: string): Promise<ExtensionManifest | null> {
    try {
      const manifestPath = path.join(extensionPath, 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest: ExtensionManifest = JSON.parse(manifestContent);

      // Basic validation
      if (!manifest.name || !manifest.version || !manifest.manifest_version) {
        logger.error(`Invalid manifest in ${extensionPath}`);
        return null;
      }

      this.loadedExtensions.set(manifest.name, manifest);
      logger.info(`Loaded extension manifest: ${manifest.name} v${manifest.version}`);

      return manifest;
    } catch (error) {
      logger.error(`Failed to load extension manifest from ${extensionPath}:`, error);
      return null;
    }
  }

  /**
   * Get all loaded extension manifests
   */
  getLoadedExtensions(): ExtensionManifest[] {
    return Array.from(this.loadedExtensions.values());
  }

  /**
   * Get paths for all valid extensions
   */
  async getExtensionPaths(): Promise<string[]> {
    const paths = await this.discoverExtensions();
    const validPaths: string[] = [];

    for (const extPath of paths) {
      const manifest = await this.loadExtensionManifest(extPath);
      if (manifest) {
        validPaths.push(extPath);
      }
    }

    return validPaths;
  }
}
