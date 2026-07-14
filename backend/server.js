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
const PORT = process.env.PORT || 10000;

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

  const genderNoun = gender === "female" ? "woman" : "man";
  const genderAdjective = gender === "female" ? "female" : "male";

  const prompt = "3D collectible vinyl toy action figure of " + heroName + ", a " + genderAdjective + " " + profession + " " + genderNoun + ", holding " + accessories + ", pixar style character, cartoon toy design, big head small body proportions, smooth plastic material, detailed toy sculpt, standing inside transparent blister packaging, toy box branding, professional toy product photography, studio lighting, vibrant colors, highly detailed 3D render";

  const negative_prompt = "realistic photo, photorealistic, skin pores, wrinkles, blurry, low quality, bad anatomy, extra fingers, distorted face, watermark, text";

  try {
    const formData = new FormData();
    formData.append("image", req.file.buffer, { filename: "image.jpg", contentType: "image/jpeg" });
    formData.append("prompt", prompt);
    formData.append("negative_prompt", negative_prompt);
    formData.append("output_format", "png");
    formData.append("strength", "0.75");
    formData.append("mode", "image-to-image");

    const response = await axios.post(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      formData,
      {
        headers: {
          Authorization: "Bearer " + process.env.STABILITY_API_KEY,
          Accept: "application/json",
          ...formData.getHeaders()
        }
      }
    );

    res.json({ image: response.data.image });

  } catch (error) {
    console.error("Stability AI Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log("AI backend running at http://localhost:" + PORT);
});
