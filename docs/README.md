# StackBrowserAgent Web Dashboard

This is a simple, single-page web dashboard for the StackBrowserAgent API. It provides a user-friendly interface for managing JWT tokens and testing API endpoints.

## Features

- 🏥 **Health Check**: Monitor API status
- 🔑 **Token Management**: Generate demo and custom JWT tokens
- 🧪 **API Testing**: Test protected routes with tokens
- 📚 **Documentation Links**: Quick access to all documentation
- 🎨 **Modern UI**: Built with Alpine.js and DaisyUI
- 📱 **Responsive**: Works on desktop and mobile

## Quick Start

### Option 1: GitHub Pages (Recommended)

1. **Enable GitHub Pages**:
   - Go to your repository Settings
   - Navigate to "Pages" in the sidebar
   - Under "Source", select "Deploy from a branch"
   - Choose `main` branch and `/docs` folder
   - Click "Save"

2. **Configure API URL**:
   - Open `docs/index.html` in a text editor
   - Find the line: `apiUrl: 'YOUR_RAILWAY_URL_HERE',`
   - Replace with your Railway URL: `apiUrl: 'https://your-app.railway.app',`
   - Commit and push changes

3. **Access Dashboard**:
   - Your dashboard will be available at:
   - `https://[your-username].github.io/[repo-name]/`
   - Example: `https://creditxcredit.github.io/workstation/`

### Option 2: Local Development

1. **Open Locally**:
   ```bash
   # Open in browser
   open docs/index.html
   # or
   firefox docs/index.html
   # or
   chrome docs/index.html
   ```

2. **Configure API URL**:
   - Edit `docs/index.html`
   - Update the `apiUrl` variable with your Railway URL

3. **Use a Local Server** (optional, for CORS):
   ```bash
   # Python 3
   cd docs
   python3 -m http.server 8000
   
   # Node.js (with http-server)
   npx http-server docs -p 8000
   
   # Then open http://localhost:8000
   ```

## Configuration

### Update API URL

Edit `docs/index.html` and find this section:

```javascript
function dashboard() {
  return {
    // Configuration - UPDATE THIS WITH YOUR RAILWAY URL
    apiUrl: 'YOUR_RAILWAY_URL_HERE', // e.g., 'https://your-app.railway.app'
```

Replace `YOUR_RAILWAY_URL_HERE` with your actual Railway deployment URL.

### CORS Configuration

Make sure your Railway deployment allows requests from your GitHub Pages domain:

1. Update `.env` or Railway environment variables:
   ```env
   ALLOWED_ORIGINS=https://your-username.github.io,http://localhost:8000
   ```

2. Or allow all origins during development (not recommended for production):
   ```env
   ALLOWED_ORIGINS=*
   ```

## Usage Guide

### Health Check Tab

1. Click "Check Health" button
2. View system status and timestamp
3. Confirms API is online and accessible

### Token Management Tab

#### Demo Token
- Click "Generate Demo Token"
- Automatically creates a token for user "demo-user"
- Use for quick testing

#### Custom Token
- Enter a User ID (e.g., "john-doe")
- Select a role (User or Admin)
- Click "Generate"
- Token is created with your custom data

### Test API Tab

1. Paste a JWT token (or generate one first)
2. Click "Test /api/protected" or "Test /api/agent/status"
3. View the response in formatted JSON
4. Success/error status is clearly indicated

### Documentation Tab

Quick links to all project documentation:
- API Reference
- Architecture
- Interface Solutions
- Deployment Guide
- Security Documentation

## Technologies Used

- **Alpine.js**: Lightweight JavaScript framework (15kb)
- **DaisyUI**: Beautiful Tailwind CSS components
- **Tailwind CSS**: Utility-first CSS framework
- **No Build Tools**: Works directly in browser via CDN

## Customization

### Change Theme

Edit the `<html>` tag in `index.html`:

```html
<!-- Light theme (default) -->
<html lang="en">

<!-- Dark theme -->
<html lang="en" data-theme="dark">

<!-- Other themes: cupcake, bumblebee, emerald, corporate, synthwave, etc. -->
<html lang="en" data-theme="synthwave">
```

Available themes: https://daisyui.com/docs/themes/

### Add New Features

The dashboard uses Alpine.js for reactivity. To add features:

1. Add HTML in the appropriate tab section
2. Add methods to the `dashboard()` function
3. Use Alpine.js directives (`x-data`, `x-show`, `@click`, etc.)

Example - Add a new endpoint test:

```html
<button class="btn btn-primary" @click="testMyEndpoint">
  Test My Endpoint
</button>
```

```javascript
async testMyEndpoint() {
  await this.testEndpoint('/api/my-endpoint');
}
```

## Troubleshooting

### Dashboard Shows "Not Connected"

**Cause**: Cannot reach the API  
**Solution**: 
- Verify `apiUrl` is correctly set
- Check Railway deployment is running
- Verify CORS settings allow your domain

### CORS Errors in Browser Console

**Cause**: API blocks requests from your domain  
**Solution**: Add your GitHub Pages URL to `ALLOWED_ORIGINS` environment variable

### Token Generation Fails

**Cause**: API endpoint issues or rate limiting  
**Solution**:
- Check API is running (Health Check tab)
- Wait if rate limited (10 requests per 15 minutes)
- Verify JWT_SECRET is set in Railway

### Buttons Don't Work

**Cause**: JavaScript not loading  
**Solution**:
- Check browser console for errors
- Ensure Alpine.js CDN is accessible
- Try clearing browser cache

## Security Notes

⚠️ **Important Security Considerations**:

1. **API URL**: It's okay to expose your Railway URL in the HTML file - it's a public API endpoint
2. **JWT Secret**: Never put your JWT_SECRET in the HTML file
3. **HTTPS**: Always use HTTPS in production (GitHub Pages provides this)
4. **CORS**: Restrict ALLOWED_ORIGINS to only your GitHub Pages domain in production

## Next Steps

1. **Add Authentication**: Implement user login to restrict dashboard access
2. **Add More Endpoints**: Extend dashboard to test all API endpoints
3. **Add WebSocket**: Real-time updates for agent status
4. **Add Charts**: Visualize metrics and usage statistics
5. **Add Admin Features**: User management, configuration, etc.

## Support

For issues or questions:
- Open an issue on GitHub
- Check [INTERFACE_SOLUTIONS.md](../INTERFACE_SOLUTIONS.md) for alternative UI options
- See [API.md](../API.md) for API documentation

## License

Same as parent project - ISC License
