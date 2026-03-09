import fs from "fs";
import axios from "axios";

async function generateImage() {

    const response = await axios.post("http://127.0.0.1:7860/sdapi/v1/txt2img", {
        prompt: "studio ghibli style collectible toy action figure, colorful packaging, soft lighting",
        steps: 25,
        width: 512,
        height: 512
    });

    const image = response.data.images[0];
    const buffer = Buffer.from(image, "base64");

    fs.writeFileSync(`generated_images/figure_${Date.now()}.png`, buffer);

    console.log("Image saved successfully!");
}

generateImage();