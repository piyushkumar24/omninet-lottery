"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { isR2Url } from "@/lib/r2";

interface R2ImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * R2Image Component
 * 
 * A component for displaying images from Cloudflare R2 with proper URL handling.
 * Uses direct public URLs for R2 images with proper configuration.
 */
export function R2Image({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: R2ImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(
    src || "/placeholder-image.jpg"
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // If src is empty or changes, update the state
    if (!src) {
      setImageUrl("/placeholder-image.jpg");
      setError(false);
      return;
    }

    // Check if it's a data URL (from image preview during upload)
    if (src.startsWith('data:')) {
      setImageUrl(src);
      setError(false);
      return;
    }

    // For R2 URLs, we can use them directly since we've configured public access
    if (isR2Url(src)) {
      console.log("Using R2 public URL:", src);
      setImageUrl(src);
      setError(false);
      return;
    }

    // For all other URLs
    setImageUrl(src);
    setError(false);
  }, [src]);

  const handleError = () => {
    console.error("Failed to load image:", src);
    setError(true);
    setImageUrl("/placeholder-image.jpg");
  };

  if (!src) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">No Image</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div
          className={`bg-gray-100 animate-pulse ${className}`}
          style={{ width, height }}
        />
      )}
      
      <Image
        src={imageUrl}
        alt={alt}
        width={width || 300}
        height={height || 300}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} ${error ? "hidden" : ""} transition-opacity duration-300`}
        onLoadingComplete={() => setIsLoading(false)}
        onError={handleError}
        priority={priority}
      />
      
      {error && (
        <div
          className={`bg-gray-100 flex items-center justify-center ${className}`}
          style={{ width, height }}
        >
          <span className="text-gray-400 text-sm">Image Error</span>
        </div>
      )}
    </>
  );
} 