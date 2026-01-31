import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PropertyGalleryProps {
  images: string[];
  propertyTitle: string;
}

export function PropertyGallery({ images, propertyTitle }: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "+") {
        setZoom((prev) => Math.min(prev + 0.2, 3));
      } else if (e.key === "-") {
        setZoom((prev) => Math.max(prev - 0.2, 0.5));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex]);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoom(1);
  };

  const openGallery = (index: number) => {
    setSelectedIndex(index);
    setIsOpen(true);
    setZoom(1);
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-slate-200 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Main Image */}
        <div
          className="col-span-4 md:col-span-3 row-span-2 relative cursor-pointer group overflow-hidden rounded-lg"
          onClick={() => openGallery(0)}
        >
          <img
            src={images[0]}
            alt={`${propertyTitle} - Main`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Thumbnail Images */}
        {images.slice(1, 5).map((image, index) => (
          <div
            key={index + 1}
            className="relative cursor-pointer group overflow-hidden rounded-lg aspect-square"
            onClick={() => openGallery(index + 1)}
          >
            <img
              src={image}
              alt={`${propertyTitle} - ${index + 2}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {index === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <p className="text-white text-xl font-semibold">+{images.length - 5} more</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
              <div className="text-white">
                <h3 className="font-semibold">{propertyTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedIndex + 1} / {images.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.5))}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setZoom((prev) => Math.min(prev + 0.2, 3))}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Main Image */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={images[selectedIndex]}
                alt={`${propertyTitle} - ${selectedIndex + 1}`}
                className="max-w-full max-h-full object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedIndex(index);
                      setZoom(1);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedIndex
                        ? "border-white scale-110"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
