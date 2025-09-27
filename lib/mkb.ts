export type ModelId =
  | "fal-ai/flux/dev"
  | "fal-ai/kling-video/v2.5-turbo/pro/text-to-video"
  | "fal-ai/kling-video/v2.5-turbo/pro/image-to-video"
  | "fal-ai/minimax/hailuo-02/pro/image-to-video"
  | "fal-ai/bytedance/seedance/v1/pro/image-to-video"
  | "fal-ai/sync-lipsync/v2/pro";

interface ModelConfig {
  name: string;
  type: "image" | "video";
  defaultParams: Record<string, any>;
  supportsNegative: boolean;
  requiresImage?: boolean;
  requiresVideo?: boolean;
  requiresAudio?: boolean;
  suggest: string[];
}

export const MKB: Record<ModelId, ModelConfig> = {
  "fal-ai/flux/dev": {
    name: "FLUX.1 [dev]",
    type: "image",
    defaultParams: { image_size: "square_hd" },
    supportsNegative: false,
    suggest: ["cinematic still", "soft light", "highly detailed"],
  },
  "fal-ai/kling-video/v2.5-turbo/pro/text-to-video": {
    name: "Kling 2.5 Turbo Pro (T2V)",
    type: "video",
    defaultParams: {
      duration: "5",
      aspect_ratio: "16:9",
      negative_prompt: "blur, distort, and low quality",
      cfg_scale: 0.5
    },
    supportsNegative: true,
    suggest: ["smooth camera movement", "dramatic lighting"],
  },
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video": {
    name: "Kling 2.5 Turbo Pro (I2V)",
    type: "video",
    defaultParams: {
      duration: "5",
      negative_prompt: "blur, distort, and low quality",
      cfg_scale: 0.5
    },
    supportsNegative: true,
    requiresImage: true,
    suggest: ["camera movement", "bring image to life", "add motion"],
  },
  "fal-ai/minimax/hailuo-02/pro/image-to-video": {
    name: "MiniMax Hailuo-02 Pro (I2V)",
    type: "video",
    defaultParams: {
      prompt_optimizer: true
    },
    supportsNegative: false,
    requiresImage: true,
    suggest: ["natural movement", "dynamic scenes", "fluid motion"],
  },
  "fal-ai/bytedance/seedance/v1/pro/image-to-video": {
    name: "Seedance 1.0 Pro (I2V)",
    type: "video",
    defaultParams: {},
    supportsNegative: false,
    requiresImage: true,
    suggest: ["animate image", "bring to life", "automatic motion"],
  },
  "fal-ai/sync-lipsync/v2/pro": {
    name: "Sync Lip Sync v2 Pro (V2V)",
    type: "video",
    defaultParams: {
      sync_mode: "cut_off"
    },
    supportsNegative: false,
    requiresVideo: true,
    requiresAudio: true,
    suggest: ["lip sync", "voice over", "dialogue"],
  },
} as const;
export type Mkb = typeof MKB;
