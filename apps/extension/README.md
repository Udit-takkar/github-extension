# GitHub Notifications Chrome Extension

## Setup Instructions

### 1. Install Dependencies

```bash
bun install
```

### 2. Create Icon Assets

Plasmo requires PNG icons. Create the following files in the `assets/` directory:

- `icon.png` - 512x512 px (source icon)

Plasmo will automatically generate all required sizes (16x16, 48x48, 128x128).

You can use any image editor or online tool to create a simple icon, or use this quick method:

**Using ImageMagick (if installed):**
```bash
convert -size 512x512 xc:#24292e -fill white -pointsize 200 -gravity center -annotate +0+0 "GH" assets/icon.png
```

**Or download a placeholder:**
Visit https://via.placeholder.com/512x24292e/FFFFFF?text=GH and save as `assets/icon.png`

### 3. Run Development Server

```bash
bun dev
```

This will:
- Start the Plasmo development server
- Watch for file changes
- Generate the extension in `build/chrome-mv3-dev/`

### 4. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `build/chrome-mv3-dev` directory
5. The extension should appear in your toolbar

### 5. Test the Extension

1. Click the extension icon
2. Click "Sign in with GitHub"
3. This will open `http://localhost:3000` (make sure your Next.js server is running)

## File Structure

```
extension/
├── popup.tsx          # Extension popup UI
├── background.ts      # Background service worker
├── style.css          # Popup styles
├── assets/
│   └── icon.png      # Extension icon (you need to create this)
├── package.json
└── tsconfig.json
```

## Common Issues

### "No icon found in assets directory"

Create `assets/icon.png` (512x512 recommended). See step 2 above.

### "No supported UI library found"

Make sure React is installed:
```bash
bun add react@^18.2.0 react-dom@^18.2.0
```

### Extension not loading

1. Check that `build/chrome-mv3-dev` directory exists
2. Make sure `bun dev` is running
3. Try reloading the extension in Chrome

## Development

- **Hot reload**: Changes to popup.tsx and style.css will hot reload
- **Background changes**: Require extension reload in Chrome
- **Manifest changes**: Require `bun dev` restart

## Building for Production

```bash
bun run build
```

Output will be in `build/chrome-mv3-prod/`

## Packaging

```bash
bun run package
```

Creates a ZIP file ready for Chrome Web Store submission.