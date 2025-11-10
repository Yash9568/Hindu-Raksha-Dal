import fs from "fs";
import path from "path";
import sharp from "sharp";

const projectRoot = process.cwd();
const srcArg = process.argv[2];
const srcRelative = srcArg || "public/source-icon.png";
const srcPath = path.resolve(projectRoot, srcRelative);
const outDir = path.resolve(projectRoot, "public/icons");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function generate() {
  if (!fs.existsSync(srcPath)) {
    console.error(`Source image not found: ${srcRelative}\nPlease place your image at ${srcRelative} or pass a path: node scripts/generate-icons.mjs <path-to-image>`);
    process.exit(1);
  }

  await ensureDir(outDir);

  const outputs = [
    { size: 192, name: "icon-192x192.png" },
    { size: 512, name: "icon-512x512.png" },
  ];

  for (const { size, name } of outputs) {
    const dest = path.join(outDir, name);
    await sharp(srcPath)
      .resize(size, size, { fit: "cover", position: "centre", withoutEnlargement: false })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(dest);
    console.log(`Generated ${path.relative(projectRoot, dest)}`);
  }

  console.log("Done.");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
