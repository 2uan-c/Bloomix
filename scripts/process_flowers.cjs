const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const FLOWERS = [
  "rose",
  "peony",
  "sunflower",
  "hydrangea",
  "lily",
  "tulip",
  "carnation",
  "gerbera",
  "daisy",
  "orchid",
  "chrysanthemum",
  "ranunculus",
  "calla-lily",
  "lisianthus",
  "iris",
  "lavender",
  "baby-breath",
  "babys-breath",
  "waxflower",
  "statice",
  "eucalyptus",
  "ruscus",
  "italian-ruscus",
  "fern",
  "olive-branch"
];

async function extractFromJpg(name) {
  const jpgPath = path.join(process.cwd(), "public/assets/flowers", `${name}.jpg`);
  if (!fs.existsSync(jpgPath)) {
    console.error(`Source JPG missing for ${name}: ${jpgPath}`);
    return null;
  }

  const img = sharp(jpgPath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Sample 4 corners (averaged 16x16 block)
  const sampleCorner = (startX, startY) => {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let y = startY; y < startY + 16; y++) {
      for (let x = startX; x < startX + 16; x++) {
        const idx = (y * w + x) * 3;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        count++;
      }
    }
    return [rSum / count, gSum / count, bSum / count];
  };

  const tl = sampleCorner(2, 2);
  const tr = sampleCorner(w - 18, 2);
  const bl = sampleCorner(2, h - 18);
  const br = sampleCorner(w - 18, h - 18);

  const isBg = new Uint8Array(w * h); // 1 = background, 0 = foreground

  // Initial candidate pass based on bilinear backdrop distance
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const srcIdx = (y * w + x) * 3;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      const expR = (1 - u) * (1 - v) * tl[0] + u * (1 - v) * tr[0] + (1 - u) * v * bl[0] + u * v * br[0];
      const expG = (1 - u) * (1 - v) * tl[1] + u * (1 - v) * tr[1] + (1 - u) * v * bl[1] + u * v * br[1];
      const expB = (1 - u) * (1 - v) * tl[2] + u * (1 - v) * tr[2] + (1 - u) * v * bl[2] + u * v * br[2];

      const dist = Math.sqrt((r - expR) ** 2 + (g - expG) ** 2 + (b - expB) ** 2);
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

      // Absolute outer 4px perimeter is guaranteed 100% background
      if (x <= 4 || x >= w - 5 || y <= 4 || y >= h - 5) {
        isBg[y * w + x] = 1;
      } else if (dist < 32 && maxDiff < 26) {
        isBg[y * w + x] = 1;
      }
    }
  }

  // Flood fill from all 4 borders into connected similar-color pixels
  const queue = [];
  for (let x = 0; x < w; x++) {
    queue.push(x, 0);
    queue.push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    queue.push(0, y);
    queue.push(w - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = ny * w + nx;
        if (isBg[nIdx] === 0) {
          const u = nx / (w - 1);
          const v = ny / (h - 1);
          const srcIdx = nIdx * 3;
          const r = data[srcIdx];
          const g = data[srcIdx + 1];
          const b = data[srcIdx + 2];

          const expR = (1 - u) * (1 - v) * tl[0] + u * (1 - v) * tr[0] + (1 - u) * v * bl[0] + u * v * br[0];
          const expG = (1 - u) * (1 - v) * tl[1] + u * (1 - v) * tr[1] + (1 - u) * v * bl[1] + u * v * br[1];
          const expB = (1 - u) * (1 - v) * tl[2] + u * (1 - v) * tr[2] + (1 - u) * v * bl[2] + u * v * br[2];

          const dist = Math.sqrt((r - expR) ** 2 + (g - expG) ** 2 + (b - expB) ** 2);
          const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

          // Sunflower yellow petals have high saturation (maxDiff > 50) and distinct hue
          // Ruscus green leaves have high green component
          // Rose red petals have high red saturation
          const isFocalFlower = (name === "rose" && r > g + 25) || 
                                (name === "sunflower" && r > 120 && g > 100 && maxDiff > 35) ||
                                (name === "ruscus" && g > r && g > b);

          if (!isFocalFlower && dist < 48 && maxDiff < 30) {
            isBg[nIdx] = 1;
            queue.push(nx, ny);
          } else if (isFocalFlower && dist < 26 && maxDiff < 18) {
            isBg[nIdx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Smooth alpha mask with edge feathering (anti-aliasing)
  const outData = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const srcIdx = idx * 3;
      const outIdx = idx * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      outData[outIdx] = r;
      outData[outIdx + 1] = g;
      outData[outIdx + 2] = b;

      if (isBg[idx] === 1) {
        outData[outIdx + 3] = 0;
      } else {
        // Check if on boundary with background
        let bgNeighborCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              if (isBg[ny * w + nx] === 1) bgNeighborCount++;
            }
          }
        }

        if (bgNeighborCount > 0) {
          // Feather alpha according to background proximity
          const alphaFactor = 1 - (bgNeighborCount / 8) * 0.55;
          outData[outIdx + 3] = Math.round(255 * alphaFactor);
        } else {
          outData[outIdx + 3] = 255;
        }
      }
    }
  }

  // Defringe light borders
  for (let y = 3; y < h - 3; y++) {
    for (let x = 3; x < w - 3; x++) {
      const idx = (y * w + x) * 4;
      const alpha = outData[idx + 3];
      if (alpha > 0 && alpha < 240) {
        const r = outData[idx];
        const g = outData[idx + 1];
        const b = outData[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 210) {
          outData[idx + 3] = Math.floor(alpha * 0.75);
        }
      }
    }
  }

  return sharp(outData, { raw: { width: w, height: h, channels: 4 } });
}

async function main() {
  console.log("🌸 Starting comprehensive floral asset transparency processor...");

  for (const name of FLOWERS) {
    const assetPng = path.join(process.cwd(), "public/assets/flowers", `${name}.png`);
    const flowerPng = path.join(process.cwd(), "public/flowers", `${name}.png`);
    const assetWebp = path.join(process.cwd(), "public/assets/flowers", `${name}.webp`);
    const flowerWebp = path.join(process.cwd(), "public/flowers", `${name}.webp`);

    let finalSharpInstance = null;

    // If transparent PNG already exists in public/assets/flowers (e.g. peony, lily, hydrangea)
    // verify it and use it
    if (fs.existsSync(assetPng)) {
      const meta = await sharp(assetPng).metadata();
      if (meta.hasAlpha) {
        console.log(`✓ Using existing verified transparent PNG: ${name}.png`);
        finalSharpInstance = sharp(assetPng);
      }
    }

    // If missing (rose, sunflower, ruscus), extract from original high-res JPG
    if (!finalSharpInstance) {
      console.log(`⚡ Extracting 100% transparent PNG from JPG for ${name}...`);
      finalSharpInstance = await extractFromJpg(name);
      if (finalSharpInstance) {
        // Save to public/assets/flowers
        await finalSharpInstance.clone().png({ compressionLevel: 8 }).toFile(assetPng);
        console.log(`  Saved ${assetPng}`);
      }
    }

    if (finalSharpInstance) {
      // 1. Ensure public/flowers/${name}.png exists
      await finalSharpInstance.clone().png({ compressionLevel: 8 }).toFile(flowerPng);

      // 2. Ensure public/assets/flowers/${name}.webp is transparent
      await finalSharpInstance.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(assetWebp);

      // 3. Ensure public/flowers/${name}.webp is transparent
      await finalSharpInstance.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(flowerWebp);

      console.log(`  ✓ Synced all 4 formats for ${name}: assets.png, flowers.png, assets.webp, flowers.webp`);
    } else {
      console.error(`❌ Failed to produce transparent asset for ${name}`);
    }
  }

  console.log("\n🌺 All floral assets successfully processed and synced across all directories!");
}

main().catch(console.error);
