import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const upDir = path.join(root, "tools", "upscaled");

const jobs = [
  {
    src: "hollywood-key-art.png",
    dest: path.join(root, "src", "assets", "hollywood-key-art.jpg"),
    maxLongEdge: 3840,
  },
  {
    src: "audi-a5-front-shop.png",
    dest: path.join(root, "src", "assets", "work", "audi-a5-front-shop.jpg"),
    maxLongEdge: 2560,
  },
  {
    src: "audi-a5-hood-shop.png",
    dest: path.join(root, "src", "assets", "work", "audi-a5-hood-shop.jpg"),
    maxLongEdge: 2560,
  },
  {
    src: "audi-a5-rear-quarter.png",
    dest: path.join(root, "src", "assets", "work", "audi-a5-rear-quarter.jpg"),
    maxLongEdge: 2560,
  },
  {
    src: "audi-a5-three-quarter.png",
    dest: path.join(root, "src", "assets", "work", "audi-a5-three-quarter.jpg"),
    maxLongEdge: 2560,
  },
  {
    src: "audi-rings-detail.png",
    dest: path.join(root, "src", "assets", "work", "audi-rings-detail.jpg"),
    maxLongEdge: 2560,
  },
  {
    src: "salon-retrim.png",
    dest: path.join(root, "src", "assets", "work", "salon-retrim.jpg"),
    maxLongEdge: 2560,
  },
];

async function enhance(job) {
  const input = path.join(upDir, job.src);
  const meta = await sharp(input).metadata();
  const long = Math.max(meta.width || 0, meta.height || 0);
  const scale = long > job.maxLongEdge ? job.maxLongEdge / long : 1;

  let pipeline = sharp(input, { failOn: "none" }).rotate();

  if (scale < 1) {
    pipeline = pipeline.resize({
      width: Math.round((meta.width || 0) * scale),
      height: Math.round((meta.height || 0) * scale),
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    });
  }

  // Mild artifact control + careful sharpen for web delivery
  pipeline = pipeline
    .median(1)
    .modulate({ brightness: 1.01, saturation: 1.03 })
    .sharpen({ sigma: 0.7, m1: 0.8, m2: 0.4 })
    .jpeg({
      quality: 90,
      mozjpeg: true,
      chromaSubsampling: "4:4:4",
    });

  await pipeline.toFile(job.dest);
  const outMeta = await sharp(job.dest).metadata();
  const size = fs.statSync(job.dest).size;
  console.log(
    `${path.basename(job.dest)}: ${meta.width}x${meta.height} -> ${outMeta.width}x${outMeta.height} (${size} bytes)`,
  );
}

async function makeOg() {
  const key = path.join(root, "src", "assets", "hollywood-key-art.jpg");
  const dest = path.join(root, "public", "og-cover.jpg");
  await sharp(key)
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(dest);
  const meta = await sharp(dest).metadata();
  console.log(`og-cover.jpg: ${meta.width}x${meta.height} (${fs.statSync(dest).size} bytes)`);
}

for (const job of jobs) {
  await enhance(job);
}
await makeOg();
