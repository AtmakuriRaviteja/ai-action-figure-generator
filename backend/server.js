import { generationConfig } from "./config.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const SD_URL = process.env.SD_WEBUI_URL || "http://127.0.0.1:7860";

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Serve generated images
app.use(
  "/generated_images",
  express.static(path.join(__dirname, "generated_images"))
);

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// MAIN GENERATION ROUTE
app.post("/generate", upload.single("image"), async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const tempImage = path.join(__dirname, "temp.jpg");
  fs.writeFileSync(tempImage, req.file.buffer);

  const faceCheck = await new Promise((resolve) => {
    // using quotes around tempImage to handle paths with spaces
    exec(`python detect_face.py "${tempImage}"`, (error, stdout) => {
      resolve(stdout ? stdout.trim() : "");
    });
  });

  if (faceCheck === "no_face") {
    return res.status(400).json({ error: "No face detected in image" });
  }

  const base64Image = req.file.buffer.toString("base64");
  const gender = req.body.gender || "person";

  let genderPrompt = "";

  if (gender === "male") {
    genderPrompt = "male action figure, masculine face, short hair, strong jawline, no makeup";
  } else if (gender === "female") {
    genderPrompt = "female action figure, feminine face, long hair, makeup";
  }

  const prompt = `
  3D cartoon vinyl toy action figure,
  ${genderPrompt},
  wearing exactly the same clothes as the photo,
  big head small body proportions,
  pixar style character,
  vibrant colors, smooth plastic toy texture,
  standing inside transparent blister packaging,
  collectible toy packaging,
  colorful cardboard backing card,
  toy accessories beside the figure,
  professional product photography,
  studio lighting
  `;

  const negative_prompt = `
  blurry, low quality, distorted face, bad anatomy,
  extra arms, extra legs, cropped, watermark, complex background, real skin, photographic skin
  `;

  try {
    const response = await axios.post(
      "http://127.0.0.1:7860/sdapi/v1/img2img",
      {
        init_images: [base64Image],
        prompt: prompt,
        negative_prompt: negative_prompt,
        steps: 30,
        cfg_scale: 7.5,
        width: 768,
        height: 768,
        denoising_strength: 0.6
      }
    );

    res.json({
      image: response.data.images[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Generation failed" });
  }

});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
  console.log(`AI backend running at http://localhost:${PORT}`);
  console.log(`Using Stable Diffusion API at ${SD_URL}`);
});