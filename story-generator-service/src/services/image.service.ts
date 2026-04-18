import axios from "axios";
import * as fs from "fs-extra";
import * as path from "path";

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
}

export class ImageService {
  private apiToken: string;
  private baseUrl = "https://api.replicate.com/v1";
  // flux-schnell model version
  private modelVersion =
    "black-forest-labs/flux-schnell";
  private imagesBaseDir: string;
  private maxPollAttempts = 30;
  private pollIntervalMs = 2000;

  constructor() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("REPLICATE_API_TOKEN is not set");
    this.apiToken = token;
    this.imagesBaseDir =
      process.env.IMAGES_BASE_DIR ?? path.join(process.cwd(), "images");
  }

  // ─────────────────────────────────────────────
  // PUBLIC — generate and save image for a part
  // Returns the relative file path
  // ─────────────────────────────────────────────
  async generateAndSaveImage(
    prompt: string,
    universeId: string,
    storyId: string,
    partId: string
  ): Promise<string> {
    console.log(`  🎨 Generating image for part ${partId}...`);

    // 1. Start prediction
    const predictionId = await this.startPrediction(prompt);

    // 2. Poll until complete
    const imageUrl = await this.pollForResult(predictionId);

    // 3. Download and save locally
    const filePath = await this.downloadImage(
      imageUrl,
      universeId,
      storyId,
      partId
    );

    console.log(`  ✅ Image saved: ${filePath}`);
    return filePath;
  }

  // ─────────────────────────────────────────────
  // INTERNAL — create the prediction on Replicate
  // ─────────────────────────────────────────────
  private async startPrediction(prompt: string): Promise<string> {
    const response = await axios.post<ReplicatePrediction>(
      `${this.baseUrl}/models/${this.modelVersion}/predictions`,
      {
        input: {
          prompt: prompt,
          width: 512,
          height: 512,
          num_outputs: 1,
          num_inference_steps: 4, // Flux Schnell is optimized for 4 steps
          output_format: "png",
          output_quality: 90,
          go_fast: true,
          megapixels: "0.25", // 512x512 = 0.25MP — keep costs minimal
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
          Prefer: "wait", // Ask Replicate to wait up to 60s before returning
        },
      }
    );

    // If Prefer: wait succeeded synchronously
    const prediction = response.data;
    if (prediction.status === "succeeded" && prediction.output) {
      const outputUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;
      return outputUrl; // Return URL directly, skip polling
    }

    return prediction.id;
  }

  // ─────────────────────────────────────────────
  // INTERNAL — poll for prediction completion
  // ─────────────────────────────────────────────
  private async pollForResult(predictionIdOrUrl: string): Promise<string> {
    // If startPrediction already returned a URL (Prefer: wait), return it
    if (predictionIdOrUrl.startsWith("http")) {
      return predictionIdOrUrl;
    }

    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      await this.sleep(this.pollIntervalMs);

      const response = await axios.get<ReplicatePrediction>(
        `${this.baseUrl}/predictions/${predictionIdOrUrl}`,
        {
          headers: { Authorization: `Bearer ${this.apiToken}` },
        }
      );

      const prediction = response.data;

      if (prediction.status === "succeeded") {
        const output = prediction.output;
        if (!output) throw new Error("Prediction succeeded but no output URL");
        return Array.isArray(output) ? output[0] : output;
      }

      if (prediction.status === "failed" || prediction.status === "canceled") {
        throw new Error(
          `Replicate prediction ${predictionIdOrUrl} ${prediction.status}: ${prediction.error ?? "unknown error"}`
        );
      }

      console.log(
        `    ⏳ Image still generating... (attempt ${attempt + 1}/${this.maxPollAttempts})`
      );
    }

    throw new Error(
      `Replicate prediction ${predictionIdOrUrl} timed out after ${this.maxPollAttempts} attempts`
    );
  }

  // ─────────────────────────────────────────────
  // INTERNAL — download image to local filesystem
  // ─────────────────────────────────────────────
  private async downloadImage(
    imageUrl: string,
    universeId: string,
    storyId: string,
    partId: string
  ): Promise<string> {
    // Determine extension from URL
    const ext = imageUrl.includes(".webp")
      ? "webp"
      : imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")
      ? "jpg"
      : "png";

    const dirPath = path.join(this.imagesBaseDir, universeId, storyId);
    await fs.ensureDir(dirPath);

    const fileName = `${partId}.${ext}`;
    const filePath = path.join(dirPath, fileName);
    const relativePath = path.join("images", universeId, storyId, fileName);

    // Stream download
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    await fs.writeFile(filePath, Buffer.from(response.data as ArrayBuffer));

    return relativePath;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
