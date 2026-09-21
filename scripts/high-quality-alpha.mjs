import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

const brainDir = 'C:\\Users\\amade\\.gemini\\antigravity-ide\\brain\\5a6a4bf5-cee7-41ef-a5f2-e8edf26213b5';
const outDir = path.join(process.cwd(), 'public', 'hero');

const files = [
  { raw: 'media__1790019770042.jpg', target: 'hero-expediente.png', isJpg: true },
  { raw: 'media__1790019770070.jpg', target: 'hero-tutela.png', isJpg: true },
  { raw: 'media__1790019770035.png', target: 'hero-tu-caso.png', isJpg: false }
];

files.forEach(({ raw, target, isJpg }) => {
  const rawPath = path.join(brainDir, raw);
  const targetPath = path.join(outDir, target);

  let width, height, data;

  if (isJpg) {
    const rawBuf = fs.readFileSync(rawPath);
    const decoded = jpeg.decode(rawBuf, { useTArray: true });
    width = decoded.width;
    height = decoded.height;
    data = decoded.data;
  } else {
    const rawBuf = fs.readFileSync(rawPath);
    const decoded = PNG.sync.read(rawBuf);
    width = decoded.width;
    height = decoded.height;
    data = decoded.data;
  }

  const png = new PNG({ width, height });

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    let a = data[i + 3] !== undefined ? data[i + 3] : 255;

    if (isJpg) {
      // Smooth alpha matting for black background removal without pixelation
      const lum = (r + g + b) / 3;
      if (lum <= 4) {
        r = 0; g = 0; b = 0; a = 0;
      } else if (lum >= 65) {
        // Keep pixel full opacity
      } else {
        // Anti-aliased transition edge matting
        const alphaRatio = (lum - 4) / 61;
        a = Math.round(255 * alphaRatio);
        r = Math.min(255, Math.round(r / alphaRatio));
        g = Math.min(255, Math.round(g / alphaRatio));
        b = Math.min(255, Math.round(b / alphaRatio));
      }
    }

    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = a;
  }

  const outBuf = PNG.sync.write(png);
  fs.writeFileSync(targetPath, outBuf);
  console.log(`Saved smooth transparent PNG: ${target} (${width}x${height})`);
});
