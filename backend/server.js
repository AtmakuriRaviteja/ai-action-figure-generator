import { generationConfig } from "./config.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import FormData from "form-data";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/generate", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const heroName = req.body.name || "Custom Hero";
  const profession = req.body.profession || "Hero";
  const accessories = req.body.accessories || "epic gear";
  const gender = req.body.gender || "male";
  const customPrompt = req.body.customPrompt || "";

  const genderNoun = gender === "female" ? "woman" : "man";
  const genderAdjective = gender === "female" ? "female" : "male";

  let prompt = `3D collectible vinyl toy action figure of ${heroName}, a ${genderAdjective} ${profession} ${genderNoun}, holding ${accessories}, pixar style character, cartoon toy design, big head small body proportions, smooth plastic material, detailed toy sculpt, standing inside transparent blister packaging, toy box branding, professional toy product photography, studio lighting, vibrant colors, highly detailed 3D render`;

  if (customPrompt) {
    prompt += `, ${customPrompt}`;
  }

  const negative_prompt = `realistic photo, photorealistic, skin pores, wrinkles, blurry, low quality, bad anatomy, extra fingers, distorted face, watermark, text`;

  try {
    const base64Image = req.file.buffer.toString('base64');
    const sdUrl = process.env.SD_WEBUI_URL || "http://127.0.0.1:7860";

    const response = await axios.post(
      `${sdUrl}/sdapi/v1/img2img`,
      {
        init_images: [base64Image],
        prompt: prompt,
        negative_prompt: negative_prompt,
        denoising_strength: 0.75,
        steps: 20,
        cfg_scale: 7,
        width: 512,
        height: 512,
        sampler_name: "Euler a",
        alwayson_scripts: {
          roop: {
            args: [
              base64Image,
              true,
              '0',
              'inswapper_128.onnx',
              'CodeFormer',
              1,
              'None',
              1,
              1,
              false,
              true
            ]
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (response.data && response.data.images && response.data.images.length > 0) {
      res.json({ image: response.data.images[0] });
    } else {
      res.status(500).json({ error: "Invalid response from Stable Diffusion" });
    }

  } catch (error) {
    console.error("Stable Diffusion Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`AI backend running at http://localhost:${PORT}`);
});