import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Path to downloads directory
const DOWNLOADS_DIR = path.join(__dirname, '../../public/downloads');

/**
 * GET /downloads/chrome-extension.zip
 * Download the Chrome extension package
 */
router.get('/chrome-extension.zip', (req: Request, res: Response) => {
  const filePath = path.join(DOWNLOADS_DIR, 'chrome-extension.zip');

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'Chrome extension package not found',
      message: 'The package may not have been built yet. Please run: npm run build:chrome'
    });
  }

  try {
    // Get file stats for size
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="chrome-extension.zip"');
    res.setHeader('Content-Length', stats.size.toString());
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('X-File-Size', `${sizeInMB}MB`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming chrome extension:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });

  } catch (error) {
    console.error('Error serving chrome extension:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to serve chrome extension package'
    });
  }
});

/**
 * GET /downloads/workflow-builder.zip
 * Download the Workflow Builder package
 */
router.get('/workflow-builder.zip', (req: Request, res: Response) => {
  const filePath = path.join(DOWNLOADS_DIR, 'workflow-builder.zip');

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'Workflow builder package not found',
      message: 'The package may not have been built yet. Please run: npm run build:workflow'
    });
  }

  try {
    // Get file stats for size
    const stats = fs.statSync(filePath);
    const sizeInKB = (stats.size / 1024).toFixed(2);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="workflow-builder.zip"');
    res.setHeader('Content-Length', stats.size.toString());
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('X-File-Size', `${sizeInKB}KB`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming workflow builder:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });

  } catch (error) {
    console.error('Error serving workflow builder:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to serve workflow builder package'
    });
  }
});

/**
 * GET /downloads/manifest.json
 * Get version and metadata information for available downloads
 */
router.get('/manifest.json', (req: Request, res: Response) => {
  try {
    const chromeExtPath = path.join(DOWNLOADS_DIR, 'chrome-extension.zip');
    const workflowPath = path.join(DOWNLOADS_DIR, 'workflow-builder.zip');

    // Read package.json for version
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Check file existence and get sizes
    const chromeExtExists = fs.existsSync(chromeExtPath);
    const workflowExists = fs.existsSync(workflowPath);

    const manifest = {
      version: packageJson.version,
      generated: new Date().toISOString(),
      packages: {
        chromeExtension: {
          filename: 'chrome-extension.zip',
          available: chromeExtExists,
          size: chromeExtExists ? fs.statSync(chromeExtPath).size : 0,
          downloadUrl: '/downloads/chrome-extension.zip',
          description: 'stackBrowserAgent Chrome Extension for browser automation'
        },
        workflowBuilder: {
          filename: 'workflow-builder.zip',
          available: workflowExists,
          size: workflowExists ? fs.statSync(workflowPath).size : 0,
          downloadUrl: '/downloads/workflow-builder.zip',
          description: 'Workflow Builder application for creating automation workflows'
        }
      },
      buildCommands: {
        chromeExtension: 'npm run build:chrome',
        workflowBuilder: 'npm run build:workflow',
        all: 'npm run build'
      }
    };

    // Set caching headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

    res.json(manifest);

  } catch (error) {
    console.error('Error generating manifest:', error);
    res.status(500).json({
      error: 'Failed to generate manifest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
