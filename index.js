const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);
const file = "Video-Name";

const inputVideo = `./video/${file}.mp4`;
const framesDir = `./frames/${file}`;
const outputDir = `./json`;

if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Paramètres ASCII
const ASCII_WIDTH = 200;  // largeur en caractères
const CHAR_ASPECT = 2.0;  // hauteur/largeur d’un caractère monospace
const ASCII_HEIGHT = Math.round((ASCII_WIDTH * 9) / 16 / CHAR_ASPECT);

// du plus sombre (gros) au plus clair (vide)
// const ASCII_CHARS = "@#W$9876543210?!abc;:+=-,._  ";
const ASCII_CHARS = " _.,-=+:;cba!?0123456789$W#@";

// Fonction conversion image → ASCII
async function imageToAscii(filepath, width, height) {
  const buffer = await sharp(filepath)
    .resize(width, height, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  let ascii = "";
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const val = buffer[idx]; // 0-255
      const char = ASCII_CHARS[Math.floor((val / 255) * (ASCII_CHARS.length - 1))];
      row += char;
    }
    ascii += row + "\n";
  }
  return ascii;
}

// Extraction des frames
console.log("🎬 Extraction des frames...");
ffmpeg(inputVideo)
  .output(path.join(framesDir, "frame-%05d.png"))
  .fps(15)
  .size(`${ASCII_WIDTH}x${ASCII_HEIGHT}`)
  .on("end", async () => {
    console.log("🖼 Conversion en ASCII...");

    const files = fs.readdirSync(framesDir).filter(f => f.endsWith(".png")).sort();
    const frames = [];

    for (let i = 0; i < files.length; i++) {
      const ascii = await imageToAscii(path.join(framesDir, files[i]), ASCII_WIDTH, ASCII_HEIGHT);
      frames.push(ascii);

      if (i % 50 === 0) console.log(`Frame ${i}/${files.length}`);
    }

    // Découpage en chunks pour alléger
    // const CHUNK_SIZE = 300;
    // for (let i = 0; i < frames.length; i += CHUNK_SIZE) {
    //   const chunk = frames.slice(i, i + CHUNK_SIZE);
    //   const index = Math.floor(i / CHUNK_SIZE);
      // const filename = path.join(outputDir, `badapple-${index}.json`);
      // fs.writeFileSync(filename, JSON.stringify(chunk));
    // }

    const filename = path.join(outputDir, `${file}.json`);
    fs.writeFileSync(filename, JSON.stringify(frames));
    console.log("✅ Généré :", filename);
  })
  .on("error", err => console.error("Erreur extraction ffmpeg:", err))
  .run();
