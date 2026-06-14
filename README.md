# Free EXIF Remover 🛡️📷

**[Free EXIF Remover](https://freeexifremover.com)** is a privacy-first, 100% client-side web utility that surgically strips EXIF tags, GPS coordinates, and camera metadata from your images (JPEG, PNG, WebP) directly inside your web browser. 

Unlike conventional tools that require you to upload private photos to remote servers (compromising your security), this tool processes files entirely locally in your browser's sandboxed memory. **Your files never leave your computer.**

---

## 🚀 Key Features

* **100% Client-Side Processing**: Zero server uploads. The tool uses Web APIs (`FileReader`, `ArrayBuffer`, `DataView`, and `Blob`) to strip metadata locally.
* **Lossless Binary Slicing**: Instead of drawing your image onto a canvas (which triggers lossy re-compression, altering pixels and degrading quality), our code parses the raw file bytes, locates metadata chunks (e.g. `APP1` markers in JPEG, or `tEXt`/`eXIf` blocks in PNG), and slices them out. Pixels remain 100% identical.
* **Interactive Metadata & GPS Inspector**: Drag and drop any image to instantly preview its embedded EXIF tags (Aperture, ISO, Shutter Speed, Camera Model) and pinpoint its capture location on an interactive Leaflet map.
* **Infinite Batch Processing**: Sanitize dozens of files concurrently in milliseconds without queue limits or file size caps.
* **Clean Dark/Light Modes**: A responsive, Vercel-inspired UI with system theme sync and smooth transitions.

---

## 🔒 Verification & Privacy Audit

Privacy advocates are naturally skeptical—and they should be. We encourage you to audit the network requests to confirm that your images are processed locally:

1. Open **[Free EXIF Remover](https://freeexifremover.com)** in your browser.
2. Press `F12` (or right-click and select **Inspect**) to open Developer Tools.
3. Go to the **Network** tab.
4. Drag and drop any image with EXIF metadata into the upload zone.
5. Notice that **no network requests are sent** to upload or transmit your image. The Leaflet map tiles are loaded dynamically from OpenStreetMap, but your raw image files remain strictly within your device's memory.

---

## 🛠️ Technology Stack

* **Core**: [Astro](https://astro.build) (Static MPA mode)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (Utility-first styling with class-based dark mode)
* **Metadata Parsing**: [ExifReader](https://github.com/mattiasw/ExifReader)
* **Interactive Mapping**: [Leaflet.js](https://leafletjs.com/) (Loaded on demand from CDN)
* **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 💻 Local Development

If you want to run this application locally:

### 1. Clone & Install
```bash
git clone https://github.com/abhilashrajjan-555/remove-exif-online.git
cd remove-exif-online
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser.

### 3. Build & Deploy (via Wrangler)
Make a production build:
```bash
npm run build
```

Log in to Cloudflare and deploy the static build directory:
```bash
npx wrangler login
npm run deploy
```

---

## ⚖️ License & Contributions

This project is open-source. Feel free to clone, modify, and host your own instance. Contributions, issue reports, and feature requests are welcome!
