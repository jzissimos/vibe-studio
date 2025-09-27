"use client";

import { useState, useEffect } from "react";

interface GenerationProgressProps {
  status: string;
  modelType: "image" | "video";
  modelName: string;
  queuePosition?: number;
  estimatedTime?: number;
  progress?: number;
  onCancel?: () => void;
}

const progressMessages = {
  image: [
    "🎨 Mixing colors and pixels...",
    "✨ Adding artistic flair...",
    "🖼️ Crafting your masterpiece...",
    "🎭 Bringing imagination to life...",
  ],
  video: [
    "🎬 Setting up the scene...",
    "🎥 Directing the camera...",
    "🎞️ Rendering frame by frame...",
    "✨ Adding motion magic...",
    "🎪 Choreographing the action...",
    "🎨 Painting with light...",
    "🎵 Syncing the rhythm...",
    "🌟 Polishing the final cut...",
  ]
};

const stageNames = {
  "IN_QUEUE": "Queued",
  "IN_PROGRESS": "Processing",
  "PROCESSING": "Generating",
  "RENDERING": "Rendering",
  "FINALIZING": "Finalizing",
  "COMPLETE": "Complete",
  "COMPLETED": "Complete"
};

export default function GenerationProgress({ 
  status, 
  modelType, 
  modelName, 
  queuePosition, 
  estimatedTime,
  progress = 0,
  onCancel 
}: GenerationProgressProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Rotate through fun messages
  useEffect(() => {
    const messages = progressMessages[modelType];
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [modelType]);

  // Track elapsed time
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const targetProgress = status === "IN_QUEUE" ? 10 : 
                          status === "IN_PROGRESS" ? 60 : 
                          status === "COMPLETE" || status === "COMPLETED" ? 100 : 30;
    
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        const diff = targetProgress - prev;
        return prev + Math.max(0.5, diff * 0.1);
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedRemaining = () => {
    if (estimatedTime) return estimatedTime;
    
    // Rough estimates based on model type
    const estimates = {
      "FLUX.1 [dev]": 5,
      "Kling": 45,
      "MiniMax": 60,
      "Seedance": 30,
      "Sync Lip Sync": 180
    };
    
    return estimates[modelName as keyof typeof estimates] || 30;
  };

  const isComplete = status === "COMPLETE" || status === "COMPLETED";
  const currentStage = stageNames[status as keyof typeof stageNames] || status;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isComplete ? (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isComplete ? "Generation Complete!" : `Generating ${modelType}...`}
            </h3>
            <p className="text-sm text-gray-600">{modelName} • {currentStage}</p>
          </div>
        </div>
        
        {onCancel && !isComplete && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{Math.round(animatedProgress)}% complete</span>
          <span>
            {elapsedTime > 0 && `${formatTime(elapsedTime)} elapsed`}
            {!isComplete && ` • ~${formatTime(getEstimatedRemaining() - elapsedTime)} remaining`}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, animatedProgress)}%` }}
          >
            <div className="h-full bg-white opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Queue Position */}
      {queuePosition !== undefined && queuePosition > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-800">
              Position #{queuePosition} in queue
            </span>
          </div>
        </div>
      )}

      {/* Fun Message */}
      {!isComplete && (
        <div className="text-center">
          <p className="text-gray-600 italic animate-fade-in">
            {progressMessages[modelType][currentMessage]}
          </p>
        </div>
      )}

      {/* Tips for longer generations */}
      {modelType === "video" && !isComplete && elapsedTime > 30 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Video generation takes time for quality results. 
            Feel free to browse other tabs while waiting!
          </p>
        </div>
      )}

      {/* Success State */}
      {isComplete && (
        <div className="text-center space-y-2">
          <p className="text-green-600 font-medium">
            🎉 Your {modelType} is ready!
          </p>
          <p className="text-sm text-gray-500">
            Generated in {formatTime(elapsedTime)}
          </p>
        </div>
      )}
    </div>
  );
}
