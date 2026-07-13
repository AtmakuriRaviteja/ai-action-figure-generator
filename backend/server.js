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

  // Detect gender using python script
  const detectedGender = await new Promise((resolve) => {
    exec(`python detect_gender.py "${tempImage}"`, (error, stdout) => {
      resolve(stdout ? stdout.trim() : "");
    });
  });

  const base64Image = req.file.buffer.toString("base64");
  const heroName = req.body.name || "Custom Hero";
  const profession = req.body.profession || "Hero";
  const accessories = req.body.accessories || "epic gear";
  
  // Use detected gender if available and valid, otherwise fallback to frontend gender or "character"
  let finalGender = "character";
  
  if (req.body.gender && req.body.gender !== "auto") {
    // If user explicitly chose male or female
    finalGender = req.body.gender;
  } else if (detectedGender === "male" || detectedGender === "female") {
    // If set to auto and detection worked
    finalGender = detectedGender;
  } else if (req.body.gender) {
    // Fallback if detection failed but they provided some weird gender
    finalGender = req.body.gender;
  }

  // Make a clear difference in the prompt based on gender
  const genderNoun = finalGender === "female" ? "woman" : (finalGender === "male" ? "man" : "person");
  const genderAdjective = finalGender === "female" ? "female" : (finalGender === "male" ? "male" : "");

  const prompt = `
  3D collectible vinyl toy action figure of ${heroName},
  a ${genderAdjective} ${profession} ${genderNoun},
  holding ${accessories},
  pixar style character,
  cartoon toy design,
  big head small body proportions,
  smooth plastic material,
  detailed toy sculpt,
  standing inside transparent blister packaging,
  toy box branding,
  professional toy product photography,
  studio lighting,
  vibrant colors,
  highly detailed 3D render
  `;

  const baseNegative = `
  realistic photo, photorealistic, skin pores, wrinkles,
  blurry, low quality, bad anatomy, extra fingers,
  distorted face, watermark, text`;

  const genderNegative = finalGender === "female" 
    ? ", man, male, boy, facial hair, beard, mustache" 
    : (finalGender === "male" ? ", woman, female, girl, breasts" : "");

  const negative_prompt = baseNegative + genderNegative;

  const model = req.body.model;

  try {
    const response = await axios.post(
      `${SD_URL}/sdapi/v1/img2img`,
      {
        init_images: [base64Image],
        prompt: prompt,
        negative_prompt: negative_prompt,
        steps: generationConfig.steps,
        cfg_scale: generationConfig.cfg,
        sampler_name: generationConfig.sampler,
        width: generationConfig.width,
        height: generationConfig.height,
        denoising_strength: generationConfig.denoising_strength,
        override_settings: model ? { sd_model_checkpoint: model } : {}
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