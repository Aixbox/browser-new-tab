"use client";

import { useState, useEffect } from "react";
import { GlobeIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { imageCache } from "@/lib/image-cache";

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
  useProxy?: boolean;
}

export const CachedImage = ({ 
  src, 
  alt, 
  className, 
  style,
  fallback,
  useProxy: forceProxy = false
}: CachedImageProps) => {
  const [hasError, setHasError] = useState(false);
  const [useProxy, setUseProxy] = useState(forceProxy);
  const [isLoaded, setIsLoaded] = useState(false);

  // 重置状态当 src 改变
  useEffect(() => {
    setHasError(false);
    setUseProxy(forceProxy);
    setIsLoaded(imageCache.has(src));
  }, [src, forceProxy]);

  const handleError = () => {
    if (!useProxy) {
      setUseProxy(true);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
    imageCache.set(src, imageUrl);
  };

  if (hasError) {
    return fallback || (
      <div className={cn("flex items-center justify-center bg-white/5", className)} style={style}>
        <GlobeIcon className="w-6 h-6 text-white" />
      </div>
    );
  }

  const imageUrl = useProxy ? `/api/icon?url=${encodeURIComponent(src)}` : src;

  return (
    <img 
      src={imageUrl}
      alt={alt}
      className={cn(className, !isLoaded && "opacity-0")}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
      decoding="async"
    />
  );
};
