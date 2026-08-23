const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawFunc, filename) {
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFunc(x, y, width, height);
      const idx = (y * width + x) * 4;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
  }

  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter type 0
    const row = pixels.slice(y * width * 4, (y + 1) * width * 4);
    for (let i = 0; i < row.length; i++) {
      rawData.push(row[i]);
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(rawData));

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(6, 9);  // color type 6 (RGBA)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const pngBuffer = Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);

  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filename, pngBuffer);
  console.log(`Generated ${filename}`);
}

// Simple CRC32 implementation for PNG chunks
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      let mix = (crc ^ byte) & 1;
      crc = (crc >>> 1) ^ (mix ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function drawIcon(x, y, w, h) {
  const nx = w > 1 ? x / (w - 1) : 0.5;
  const ny = h > 1 ? y / (h - 1) : 0.5;

  const dx = nx - 0.5;
  const dy = ny - 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const cornerRadius = 0.2;
  const boxDx = Math.max(0, Math.abs(dx) - (0.5 - cornerRadius));
  const boxDy = Math.max(0, Math.abs(dy) - (0.5 - cornerRadius));
  const boxDist = Math.sqrt(boxDx * boxDx + boxDy * boxDy);

  if (boxDist > cornerRadius) {
    return [0, 0, 0, 0];
  }

  const angle = Math.atan2(dy, dx);
  let color;
  if (angle < -Math.PI / 2) {
    color = [234, 67, 53];
  } else if (angle < 0) {
    color = [66, 133, 244];
  } else if (angle < Math.PI / 2) {
    color = [52, 168, 83];
  } else {
    color = [251, 188, 5];
  }

  if (dist >= 0.22 && dist <= 0.38) {
    if (dy > -0.08 && dy < 0.08 && dx > 0.1) {
      return [15, 23, 42, 255];
    }
    return [color[0], color[1], color[2], 255];
  } else if (dist < 0.22) {
    if (dy >= -0.05 && dy <= 0.05 && dx >= 0.0) {
      return [66, 133, 244, 255];
    }
    return [15, 23, 42, 255];
  } else {
    return [15, 23, 42, 255];
  }
}

const outDir = path.join(__dirname, 'icons');
createPng(16, 16, drawIcon, path.join(outDir, 'icon16.png'));
createPng(48, 48, drawIcon, path.join(outDir, 'icon48.png'));
createPng(128, 128, drawIcon, path.join(outDir, 'icon128.png'));
