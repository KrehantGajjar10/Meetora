import { useState } from 'react';
import {
  Code,
  Palette,
  Wrench,
  Trophy,
  Briefcase,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface EventImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  className?: string;
  aspectRatio?: string;
}

export default function EventImage({
  src,
  alt,
  category = '',
  className = '',
  aspectRatio = 'aspect-video',
}: EventImageProps) {
  const [imageState, setImageState] = useState<{
    source: string | null;
    hasError: boolean;
    isLoaded: boolean;
  }>({ source: null, hasError: false, isLoaded: false });

  const cleanCategory = category.toLowerCase();
  const imageSource = src?.trim() || null;
  const isCurrentSource = imageState.source === imageSource;
  const hasError = isCurrentSource && imageState.hasError;
  const isLoaded = isCurrentSource && imageState.isLoaded;

  // Pick category-specific icon and gradient
  const getCategoryTheme = () => {
    if (cleanCategory.includes('tech') || cleanCategory.includes('code') || cleanCategory.includes('software')) {
      return {
        icon: Code,
        accentColor: 'text-primary',
        label: 'Technology & Code',
      };
    }
    if (cleanCategory.includes('design') || cleanCategory.includes('ux') || cleanCategory.includes('ui')) {
      return {
        icon: Palette,
        accentColor: 'text-primary',
        label: 'Design & UX',
      };
    }
    if (cleanCategory.includes('workshop') || cleanCategory.includes('hands-on')) {
      return {
        icon: Wrench,
        accentColor: 'text-primary',
        label: 'Workshop & Lab',
      };
    }
    if (cleanCategory.includes('hackathon') || cleanCategory.includes('competition')) {
      return {
        icon: Trophy,
        accentColor: 'text-primary',
        label: 'Hackathon & Contest',
      };
    }
    if (cleanCategory.includes('career') || cleanCategory.includes('talk') || cleanCategory.includes('job')) {
      return {
        icon: Briefcase,
        accentColor: 'text-primary',
        label: 'Career & Industry',
      };
    }
    return {
      icon: Calendar,
      accentColor: 'text-primary',
      label: category || 'Campus Event',
    };
  };

  const theme = getCategoryTheme();
  const IconComponent = theme.icon;

  const showFallback = !imageSource || hasError;

  return (
    <div className={`relative overflow-hidden bg-app-bg ${aspectRatio} ${className}`}>
      {/* Real Image Render */}
      {imageSource && !hasError && (
        <img
          src={imageSource}
          alt={alt}
          onLoad={() =>
            setImageState({ source: imageSource, hasError: false, isLoaded: true })
          }
          onError={() =>
            setImageState({ source: imageSource, hasError: true, isLoaded: false })
          }
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Graceful Brand Fallback when genuinely without image or image failed */}
      {showFallback && (
        <div
          className="flex h-full w-full flex-col items-center justify-center border-b border-border/60 bg-linear-to-br from-app-bg via-surface to-primary-soft/40 p-6 text-center"
        >
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-surface/90 shadow-sm backdrop-blur-xs">
            <IconComponent className={`h-7 w-7 ${theme.accentColor}`} />
            <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-primary" />
          </div>
          <p className="line-clamp-1 text-xs font-bold text-text-primary tracking-tight">
            {theme.label}
          </p>
          <p className="mt-1 line-clamp-1 max-w-[85%] text-[11px] font-medium text-text-muted">
            {alt}
          </p>
        </div>
      )}
    </div>
  );
}
