import ExifReader from 'exifreader';

export interface MetadataSummary {
  hasMetadata: boolean;
  fileType?: string;
  cameraMake?: string;
  cameraModel?: string;
  dateTime?: string;
  software?: string;
  gps?: {
    latitude: number;
    longitude: number;
    formatted: string;
  };
  details: { label: string; value: string }[];
}

/**
 * Parses image metadata using ExifReader.
 */
export async function parseMetadata(file: File): Promise<MetadataSummary> {
  const summary: MetadataSummary = {
    hasMetadata: false,
    details: [],
  };

  try {
    const tags = await ExifReader.load(file);
    
    // Determine file type from tags or extension
    summary.fileType = file.type || file.name.split('.').pop()?.toUpperCase();

    // Helper to extract tag value
    const getTag = (name: string): string | undefined => {
      const tag = tags[name];
      if (!tag) return undefined;
      return tag.description || String(tag.value);
    };

    summary.cameraMake = getTag('Make');
    summary.cameraModel = getTag('Model');
    summary.dateTime = getTag('DateTimeOriginal') || getTag('DateTime');
    summary.software = getTag('Software');

    // Extract GPS
    if (tags['GPSLatitude'] && tags['GPSLongitude']) {
      const latTag = tags['GPSLatitude'];
      const lonTag = tags['GPSLongitude'];
      const latRef = tags['GPSLatitudeRef']?.description || 'N';
      const lonRef = tags['GPSLongitudeRef']?.description || 'E';

      // ExifReader stores coordinates as decimals or description
      let lat = Number(latTag.description);
      let lon = Number(lonTag.description);

      // Fallback calculation if description is not decimal
      if (isNaN(lat) && Array.isArray(latTag.value)) {
        lat = parseGpsArray(latTag.value, latRef);
      }
      if (isNaN(lon) && Array.isArray(lonTag.value)) {
        lon = parseGpsArray(lonTag.value, lonRef);
      }

      if (!isNaN(lat) && !isNaN(lon)) {
        summary.gps = {
          latitude: lat,
          longitude: lon,
          formatted: `${lat.toFixed(5)}° ${latRef}, ${lon.toFixed(5)}° ${lonRef}`,
        };
      }
    }

    // Compile list of detail items for display
    const checkTags = [
      { key: 'Make', label: 'Camera Maker' },
      { key: 'Model', label: 'Camera Model' },
      { key: 'DateTimeOriginal', label: 'Date Taken' },
      { key: 'Software', label: 'Software/Editor' },
      { key: 'LensModel', label: 'Lens' },
      { key: 'ExposureTime', label: 'Exposure' },
      { key: 'FNumber', label: 'Aperture' },
      { key: 'ISOSpeedRatings', label: 'ISO' },
    ];

    for (const tagInfo of checkTags) {
      const val = getTag(tagInfo.key);
      if (val) {
        summary.details.push({ label: tagInfo.label, value: val });
        summary.hasMetadata = true;
      }
    }

    if (summary.gps) {
      summary.details.push({ label: 'GPS Location', value: summary.gps.formatted });
      summary.hasMetadata = true;
    }

    // Check if there are other tags to justify showing metadata
    if (Object.keys(tags).length > 5) {
      summary.hasMetadata = true;
    }
  } catch (e) {
    console.error('Error parsing EXIF metadata:', e);
  }

  return summary;
}

function parseGpsArray(val: any[], ref: string): number {
  // val is usually [degrees, minutes, seconds]
  const d = val[0] || 0;
  const m = val[1] || 0;
  const s = val[2] || 0;
  let dec = d + m / 60 + s / 3600;
  if (ref === 'S' || ref === 'W') {
    dec = -dec;
  }
  return dec;
}

/**
 * Losslessly strips EXIF (APP1) and Photoshop (APP13) markers from JPEG ArrayBuffer.
 */
export function stripJpegMetadata(arrayBuffer: ArrayBuffer): ArrayBuffer {
  const dataView = new DataView(arrayBuffer);
  if (dataView.getUint16(0) !== 0xFFD8) {
    throw new Error('Not a valid JPEG image.');
  }

  let offset = 2;
  const segments: Uint8Array[] = [new Uint8Array(arrayBuffer.slice(0, 2))]; // Start with SOI (0xFFD8)
  const exifMarker = 0xFFE1;   // APP1 (EXIF / XMP)
  const psMarker = 0xFFED;     // APP13 (Photoshop metadata)

  while (offset < dataView.byteLength) {
    // Check if we have enough bytes left for marker + length
    if (offset + 4 > dataView.byteLength) {
      const remaining = new Uint8Array(arrayBuffer.slice(offset));
      segments.push(remaining);
      break;
    }

    const marker = dataView.getUint16(offset);
    
    // If we hit SOS (Start of Scan 0xFFDA), the rest is image data
    if (marker === 0xFFDA) {
      const remaining = new Uint8Array(arrayBuffer.slice(offset));
      segments.push(remaining);
      break;
    }

    // Markers that don't have length are RST0-RST7, SOI, EOI, TEM, etc.
    // They are all > 0xFFD0 and < 0xFFD9. In normal JPEG structures, these are in the scan data,
    // but just in case we hit one:
    if (marker >= 0xFFD0 && marker <= 0xFFD9) {
      const segment = new Uint8Array(arrayBuffer.slice(offset, offset + 2));
      segments.push(segment);
      offset += 2;
      continue;
    }

    const length = dataView.getUint16(offset + 2);
    const totalSegmentLength = 2 + length;

    if (offset + totalSegmentLength > dataView.byteLength) {
      // Corrupt file segment, just copy remaining and stop
      const remaining = new Uint8Array(arrayBuffer.slice(offset));
      segments.push(remaining);
      break;
    }

    if (marker === exifMarker || marker === psMarker) {
      // Skip this metadata segment!
      offset += totalSegmentLength;
    } else {
      // Keep this segment
      const segment = new Uint8Array(arrayBuffer.slice(offset, offset + totalSegmentLength));
      segments.push(segment);
      offset += totalSegmentLength;
    }
  }

  // Concatenate segments
  const totalLength = segments.reduce((acc, s) => acc + s.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const s of segments) {
    result.set(s, pos);
    pos += s.length;
  }
  return result.buffer;
}

/**
 * Losslessly strips metadata chunks (tEXt, zTXt, iTXt, eXIf) from PNG ArrayBuffer.
 */
export function stripPngMetadata(arrayBuffer: ArrayBuffer): ArrayBuffer {
  const signature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const view = new DataView(arrayBuffer);
  
  // Verify PNG signature
  for (let i = 0; i < 8; i++) {
    if (view.getUint8(i) !== signature[i]) {
      throw new Error('Not a valid PNG image.');
    }
  }

  const chunks: Uint8Array[] = [new Uint8Array(arrayBuffer.slice(0, 8))]; // PNG Signature
  let offset = 8;
  const decoder = new TextDecoder('ascii');

  while (offset < arrayBuffer.byteLength) {
    if (offset + 12 > arrayBuffer.byteLength) {
      // Corrupt chunk header
      const remaining = new Uint8Array(arrayBuffer.slice(offset));
      chunks.push(remaining);
      break;
    }

    const length = view.getUint32(offset);
    const typeBytes = new Uint8Array(arrayBuffer.slice(offset + 4, offset + 8));
    const type = decoder.decode(typeBytes);
    const chunkTotalLength = 12 + length; // 4 length + 4 type + data + 4 CRC

    if (offset + chunkTotalLength > arrayBuffer.byteLength) {
      // Corrupt chunk data
      const remaining = new Uint8Array(arrayBuffer.slice(offset));
      chunks.push(remaining);
      break;
    }

    // Metadata chunk types in PNG:
    // tEXt, zTXt, iTXt (Text metadata)
    // eXIf (EXIF metadata chunk in newer PNG specs)
    const isMetadata = ['tEXt', 'zTXt', 'iTXt', 'eXIf'].includes(type);

    if (isMetadata) {
      // Skip this chunk!
      offset += chunkTotalLength;
    } else {
      // Keep this chunk
      const chunk = new Uint8Array(arrayBuffer.slice(offset, offset + chunkTotalLength));
      chunks.push(chunk);
      offset += chunkTotalLength;

      if (type === 'IEND') {
        break; // Reached end of PNG
      }
    }
  }

  // Concatenate chunks
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result.buffer;
}

/**
 * Losslessly strips metadata chunks (EXIF, XMP) from WebP ArrayBuffer.
 */
export function stripWebpMetadata(arrayBuffer: ArrayBuffer): ArrayBuffer {
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder('ascii');

  // Verify RIFF and WEBP signatures
  if (view.byteLength < 12) {
    throw new Error('WebP file too small.');
  }
  
  const riffSig = decoder.decode(new Uint8Array(arrayBuffer.slice(0, 4)));
  const webpSig = decoder.decode(new Uint8Array(arrayBuffer.slice(8, 12)));

  if (riffSig !== 'RIFF' || webpSig !== 'WEBP') {
    throw new Error('Not a valid WebP image.');
  }

  const chunks: { tag: string; data: Uint8Array }[] = [];
  let offset = 12;

  while (offset < arrayBuffer.byteLength) {
    if (offset + 8 > arrayBuffer.byteLength) {
      break; // End of file
    }

    const tag = decoder.decode(new Uint8Array(arrayBuffer.slice(offset, offset + 4)));
    const size = view.getUint32(offset + 4, true); // WebP uses little-endian
    
    // Chunks are padded to even sizes in file stream
    const paddedSize = size + (size % 2 === 0 ? 0 : 1);
    const chunkTotalLength = 8 + paddedSize;

    if (offset + chunkTotalLength > arrayBuffer.byteLength) {
      // Corrupt chunk
      break;
    }

    // Skip EXIF and XMP chunks
    if (tag !== 'EXIF' && tag !== 'XMP ') {
      const chunkData = new Uint8Array(arrayBuffer.slice(offset, offset + chunkTotalLength));
      chunks.push({ tag, data: chunkData });
    }

    offset += chunkTotalLength;
  }

  // Calculate new RIFF size
  // New size is: 4 ("WEBP") + sum(kept chunk lengths)
  const keptChunksLength = chunks.reduce((acc, c) => acc + c.data.length, 0);
  const newRiffSize = 4 + keptChunksLength;

  const result = new Uint8Array(8 + keptChunksLength);
  
  // Set "RIFF"
  const encoder = new TextEncoder();
  result.set(encoder.encode('RIFF'), 0);
  
  // Set size (little endian)
  const sizeView = new DataView(result.buffer);
  sizeView.setUint32(4, newRiffSize, true);

  // Set "WEBP"
  result.set(encoder.encode('WEBP'), 8);

  // Copy kept chunks
  let pos = 12;
  for (const c of chunks) {
    result.set(c.data, pos);
    pos += c.data.length;
  }

  return result.buffer;
}

/**
 * Automates stripping of image metadata based on file type.
 */
export async function stripImageMetadata(file: File): Promise<{ blob: Blob; sizeSaved: number }> {
  const arrayBuffer = await file.arrayBuffer();
  let strippedBuffer: ArrayBuffer;

  const type = file.type || '';
  
  if (type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
    strippedBuffer = stripJpegMetadata(arrayBuffer);
  } else if (type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    strippedBuffer = stripPngMetadata(arrayBuffer);
  } else if (type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')) {
    strippedBuffer = stripWebpMetadata(arrayBuffer);
  } else {
    // Unsupported format, return original file buffer
    strippedBuffer = arrayBuffer;
  }

  const sizeSaved = file.size - strippedBuffer.byteLength;
  const cleanBlob = new Blob([strippedBuffer], { type: file.type || 'application/octet-stream' });

  return {
    blob: cleanBlob,
    sizeSaved: Math.max(0, sizeSaved),
  };
}
