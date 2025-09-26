export type ModelId =
  | "fal-ai/flux/dev"
  | "klingai/kling-video/v1/pro/text-to-video";

export const MKB = {
  "fal-ai/flux/dev": {
    name: "FLUX.1 [dev]",
    type: "image",
    defaultParams: { image_size: "square_hd" },
    supportsNegative: false,
    suggest: ["cinematic still", "soft light", "highly detailed"],
  },
  "klingai/kling-video/v1/pro/text-to-video": {
    name: "Kling 2.5 Turbo Pro (T2V)",
    type: "video",
    defaultParams: { duration: 5, aspect_ratio: "16:9" },
    supportsNegative: true,
    suggest: ["smooth camera movement", "dramatic lighting"],
  },
} as const;
export type Mkb = typeof MKB;
