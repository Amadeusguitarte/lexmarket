import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

const dir = path.join(process.cwd(), 'public', 'hero');

function processImage(fileName) {
  const filePath = path.join(dir, fileName);
  const ext = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, ext);
  const outPath = path.join(dir, `${baseName}.png`);

  let width, height, data;

  if (ext === '.jpg' || ext === '.jpeg') {
    const raw = fs.readFileSync(filePath);
    const decoded = jpeg.decode(raw, { useTArray: true });
    width = decoded.width;
    height = decoded.height;
    data = decoded.data;
  } else if (ext === '.png') {
    const raw = fs.readFileSync(filePath);
    const decoded = PNG.sync.read(raw);
    width = decoded.width;
    height = decoded.height;
    data = decoded.data;
  }

  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3] !== undefined ? data[idx + 3] : 255;

      // If near black (outer black background around rotated asset)
      if (r < 40 && g < 40 && b < 40) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      } else {
        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = a;
      }
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outPath, buffer);
  console.log(`Processed ${fileName} -> ${baseName}.png (${width}x${height}, transparent bg)`);
}

['hero-expediente.jpg', 'hero-tutela.jpg', 'hero-tu-caso.png'].forEach(f => {
  if (fs.existsSync(path.join(dir, f))) {
    processImage(f);
  }
});
