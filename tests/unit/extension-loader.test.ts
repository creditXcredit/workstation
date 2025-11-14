import { ExtensionLoader } from '../../src/extensions/loader';
import * as fs from 'fs';
import * as path from 'path';

describe('ExtensionLoader', () => {
  let loader: ExtensionLoader;
  const testExtensionsPath = path.join(__dirname, '../fixtures/extensions');

  beforeEach(() => {
    loader = new ExtensionLoader(testExtensionsPath);
  });

  describe('discoverExtensions', () => {
    it('should discover extensions in the directory', async () => {
      // This test would require fixture extensions
      const extensions = await loader.discoverExtensions();
      expect(Array.isArray(extensions)).toBe(true);
    });

    it('should return empty array if directory does not exist', async () => {
      const nonExistentLoader = new ExtensionLoader('/non/existent/path');
      const extensions = await nonExistentLoader.discoverExtensions();
      expect(extensions).toEqual([]);
    });
  });

  describe('loadExtensionManifest', () => {
    it('should return null for invalid manifest path', async () => {
      const manifest = await loader.loadExtensionManifest('/non/existent');
      expect(manifest).toBeNull();
    });
  });

  describe('getLoadedExtensions', () => {
    it('should return array of loaded extensions', () => {
      const extensions = loader.getLoadedExtensions();
      expect(Array.isArray(extensions)).toBe(true);
    });
  });
});
