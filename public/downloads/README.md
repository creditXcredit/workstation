# Downloads Directory

This directory contains downloadable packages for the stackBrowserAgent workstation system.

## Generated Files

The following files are automatically generated during the build process:

- **chrome-extension.zip** - Chrome extension package for browser automation
- **workflow-builder.zip** - Workflow builder application bundle

## Build Process

These packages are created by:
- `npm run build:chrome` - Builds and packages the Chrome extension
- `npm run build:workflow` - Packages the workflow builder
- `npm run build` - Runs both build processes

## Usage

Users can download these packages via:
- Dashboard UI: `http://localhost:3000/dashboard.html`
- Direct download: `http://localhost:3000/downloads/[filename]`
- API endpoint: `GET /downloads/manifest.json` for version info

## Version Information

Version information is embedded in the manifest.json file and served via the `/downloads/manifest.json` endpoint.

## Notes

- These files are gitignored and generated on each build
- Files are served with appropriate MIME types and caching headers
- The download routes include file existence checks and error handling
