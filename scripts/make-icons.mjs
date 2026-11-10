import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Mirrors public/icon.svg on a 512x512 design canvas.
const CANVAS = 512;
const HALF_STROKE = 13;
const BACKGROUND = [15, 17, 21];
const GREEN = [52, 211, 153];

const polylines = [
  [[256, 190], [256, 310]],
  [[256, 232], [178, 190], [126, 128]],
  [[256, 232], [334, 190], [386, 128]],
  [[256, 310], [204, 376], [192, 472]],
  [[256, 310], [308, 376], [320, 472]],
];

const segments = polylines.flatMap((line) =>
  line.slice(0, -1).map((from, i) => [...from, ...line[i + 1]]),
);
const rings = [[256, 120, 42]];
const dots = [[112, 76, 26], [400, 76, 26]];

function clamp(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function segmentDistance(x, y, [x1, y1, x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : clamp(((x - x1) * dx + (y - y1) * dy) / length);
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function roundedRectDistance(x, y, size, radius) {
  const qx = Math.abs(x - size / 2) - (size / 2 - radius);
  const qy = Math.abs(y - size / 2) - (size / 2 - radius);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    radius
  );
}

function render(size) {
  const scale = size / CANVAS;
  const radius = 104 * scale;
  const halfStroke = HALF_STROKE * scale;
  const scaledSegments = segments.map((s) => s.map((value) => value * scale));
  const scaledRings = rings.map(([cx, cy, r]) => [cx * scale, cy * scale, r * scale]);
  const scaledDots = dots.map(([cx, cy, r]) => [cx * scale, cy * scale, r * scale]);
  const rows = [];

  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const alpha = clamp(0.5 - roundedRectDistance(px, py, size, radius));
      let green = 0;
      for (const segment of scaledSegments) {
        green = Math.max(green, clamp(halfStroke + 0.5 - segmentDistance(px, py, segment)));
      }
      for (const [cx, cy, r] of scaledRings) {
        green = Math.max(green, clamp(halfStroke + 0.5 - Math.abs(Math.hypot(px - cx, py - cy) - r)));
      }
      for (const [cx, cy, r] of scaledDots) {
        green = Math.max(green, clamp(r + 0.5 - Math.hypot(px - cx, py - cy)));
      }
      const offset = 1 + x * 4;
      row[offset] = Math.round(BACKGROUND[0] + (GREEN[0] - BACKGROUND[0]) * green);
      row[offset + 1] = Math.round(BACKGROUND[1] + (GREEN[1] - BACKGROUND[1]) * green);
      row[offset + 2] = Math.round(BACKGROUND[2] + (GREEN[2] - BACKGROUND[2]) * green);
      row[offset + 3] = Math.round(alpha * 255);
    }
    rows.push(row);
  }

  return deflateSync(Buffer.concat(rows));
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function png(size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", render(size)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), "../public/icons");
mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const file = resolve(outDir, `icon-${size}.png`);
  writeFileSync(file, png(size));
  console.log(`${file} (${size}x${size})`);
}
