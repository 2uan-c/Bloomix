import React, { useState, useEffect } from "react";
import { getFlowerImageUrl } from "../utils/botanicalImages.ts";
import { Leaf } from "lucide-react";

interface FlowerBotanicalImageProps {
  flowerId: string;
  color?: string;
  className?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  rounded?: "md" | "lg" | "xl" | "full";
  catalogBackdrop?: boolean;
}

export const FlowerBotanicalImage: React.FC<FlowerBotanicalImageProps> = ({
  flowerId,
  color,
  className = "",
  alt,
  size = "md",
  rounded = "xl",
  catalogBackdrop = false,
}) => {
  const initialUrl = getFlowerImageUrl(flowerId, color);
  const [currentSrc, setCurrentSrc] = useState(initialUrl);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackAttempt, setFallbackAttempt] = useState(0);

  useEffect(() => {
    const nextUrl = getFlowerImageUrl(flowerId, color);
    setCurrentSrc(nextUrl);
    setHasError(false);
    setIsLoading(true);
    setFallbackAttempt(0);
  }, [flowerId, color]);

  const sizeClasses = {
    sm: "w-10 h-10 min-w-[40px]",
    md: "w-16 h-16 min-w-[64px]",
    lg: "w-24 h-24 min-w-[96px]",
    xl: "w-32 h-32 min-w-[128px]",
    hero: "w-full h-44 sm:h-48",
  };

  const roundedClasses = {
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  const handleError = () => {
    // Attempt fallback between /assets/flowers/ and /flowers/ using transparent .png or .webp
    const normalizedId = (flowerId || "").toLowerCase().trim();
    if (fallbackAttempt === 0) {
      setFallbackAttempt(1);
      if (currentSrc.includes("/assets/flowers/")) {
        setCurrentSrc(`/flowers/${normalizedId}.png`);
      } else {
        setCurrentSrc(`/assets/flowers/${normalizedId}.png`);
      }
    } else if (fallbackAttempt === 1) {
      setFallbackAttempt(2);
      setCurrentSrc(`/assets/flowers/${normalizedId}.webp`);
    } else if (fallbackAttempt === 2) {
      setFallbackAttempt(3);
      setCurrentSrc(`/flowers/${normalizedId}.webp`);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-[#F3EFE6] border border-[#E0D8C8] p-1 overflow-hidden text-center text-[#2D2D2D]/60 ${sizeClasses[size]} ${roundedClasses[rounded]} ${className}`}
        title={`${flowerId} (Image unavailable)`}
      >
        <Leaf className="w-4 h-4 text-[#8B7E6B] opacity-60 mb-0.5" />
        <span className="text-[9px] font-sans font-medium line-clamp-1 capitalize">
          {flowerId}
        </span>
      </div>
    );
  }

  const containerStyles = catalogBackdrop
    ? "bg-[#F0EEE6] border-[#D6CFC0] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.05)]"
    : "bg-[#FAF8F3] border-[#E8E4D9]";

  return (
    <div
      className={`relative overflow-hidden ${containerStyles} border flex items-center justify-center ${sizeClasses[size]} ${roundedClasses[rounded]} ${className}`}
    >
      {/* Contrasting Catalog Thumbnail Backdrop Element */}
      {catalogBackdrop && (
        <>
          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, #F8F6F0 15%, #ECE5D7 68%, #DFD6C3 100%)",
            }}
          />
          {/* Subtle soft grounding pedestal */}
          <div className="absolute inset-2 sm:inset-3 rounded-xl bg-gradient-to-b from-white/40 to-[#E4DCB9]/30 border border-[#DDD5C3]/40 shadow-2xs pointer-events-none" />
        </>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-[#F4EFE6] animate-pulse flex items-center justify-center z-10">
          <Leaf className="w-4 h-4 text-[#2D4F1E]/30 animate-pulse" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt || `${flowerId} flower`}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        className={`relative z-10 w-full h-full ${
          catalogBackdrop
            ? "object-contain p-2.5 drop-shadow-[0_3px_6px_rgba(0,0,0,0.08)]"
            : "object-cover"
        } transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        } hover:scale-105 transition-transform duration-500`}
      />
    </div>
  );
};
