# Project Context: remove-exif-online

## Metadata
- **Tool Name:** EXIF Metadata Stripper
- **Target Domain:** freeexifremover.com (TBD)
- **Primary Keyword:** remove exif online
- **Supporting Keywords:**
  - remove metadata from photo online
  - remove location from photo online
  - strip exif data online
  - clean image metadata free
  - client side exif remover
- **Competitors:**
  - [Jimpl](https://jimpl.com) (Server-side upload, deletes after 24h)
  - [Metadata2Go](https://www.metadata2go.com) (Server-side upload, outdated cluttered UI)
  - [Exifdata.com](https://www.exifdata.com) (Server-side upload, basic presentation)

## Core Differentiation (USPs)
1. **100% Client-Side Processing:** Images never leave the browser. Zero upload, absolute privacy.
2. **Lossless Byte Stripping:** Directly parse the image buffer and slice out the metadata segments (APP1, tEXt, EXIF chunks) without re-encoding the image. This guarantees 100% original quality, zero compression degradation, and extremely fast execution.
3. **Interactive GPS Map:** Pinpoint exact location metadata on an interactive map (using Leaflet.js from CDN) to visually demonstrate to the user why stripping is important for privacy.
4. **Vercel-Inspired UI:** Modern dark/light theme, sleek layouts, interactive drag-and-drop.
5. **Infinite Batch Processing:** Drag and drop dozens of files; strip them concurrently and download them instantly with no limitations.
