# Typographic Jellyfish — interactive 3D

A luminous jellyfish made of thousands of characters, rendered with Three.js. Drag to orbit, scroll/pinch to zoom, and move the pointer to disturb the tentacles.

## Publish with GitHub Pages

1. Create a **public** GitHub repository.
2. Upload `index.html`, `style.css`, and `main.js` **to the repository root**.
3. Open **Settings → Pages → Build and deployment → Deploy from a branch**.
4. Select **main** and **/(root)**, then Save.
5. Wait for GitHub Pages to publish and open the URL shown there.

No Python, npm, build command, or server setup is required for GitHub Pages. Internet is required to load Three.js from jsDelivr.

For local preview, run `python3 -m http.server 8000` in this directory and open `http://localhost:8000`.

Edit the constants `N_CAP`, `N_RIM`, `N_ARMS`, `N_TENT` in `main.js` to change density. Lower values improve performance on phones.
