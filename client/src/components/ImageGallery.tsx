import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  title?: string;
  onImageClick?: (index: number) => void;
}

export default function ImageGallery({ images, title, onImageClick }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const encodeImageUrl = (url: string): string => {
    if (!url) return url;
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        const encodedPath = urlObj.pathname.split('/').map(segment => {
          try {
            const decoded = decodeURIComponent(segment);
            return encodeURIComponent(decoded);
          } catch {
            return encodeURIComponent(segment);
          }
        }).join('/');
        return urlObj.origin + encodedPath + (urlObj.search || '') + (urlObj.hash || '');
      }
      return url.replace(/ /g, '%20');
    } catch {
      return url.replace(/ /g, '%20');
    }
  };

  const encodedImages = images.map(img => encodeImageUrl(img));

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="relative bg-card rounded-xl overflow-hidden group cursor-pointer border-2" onClick={() => setIsLightboxOpen(true)}>
        <img
          src={encodedImages[currentIndex]}
          className="w-full h-[400px] object-cover transition-opacity hover:opacity-90"
          alt={title}
        />
        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {encodedImages.map((img, i) => (
          <button key={i} onClick={() => setCurrentIndex(i)} className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${currentIndex === i ? "border-cyan-500 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}>
            <img src={img} className="w-full h-full object-cover" alt="" />
          </button>
        ))}
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <button onClick={() => setIsLightboxOpen(false)} className="absolute top-6 right-6 text-white hover:text-cyan-400 transition-colors"><X className="h-8 w-8" /></button>
          <img src={encodedImages[currentIndex]} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="" />
        </div>
      )}
    </div>
  );
}
