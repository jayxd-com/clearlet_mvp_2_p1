import { useRef, useState, useEffect } from "react";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { RotateCcw, Check, PenTool, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
  onCancel?: () => void;
  width?: number;
  height?: number;
  isLoading?: boolean;
}

export function SignatureCanvas({ 
  onSave, 
  onCancel, 
  width = 600, 
  height = 240, // Increased height for better signing area
  isLoading = false
}: SignatureCanvasProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width, height });

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const actualWidth = Math.min(width, containerWidth - 4); // 4px for border
        setCanvasSize({ width: actualWidth, height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Set drawing styles - High contrast for signature
    ctx.strokeStyle = "#000000"; 
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Fill with transparent or white background?
    // White is safer for PDF embedding
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  }, [canvasSize]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = "touches" in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = "touches" in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    if ("touches" in e) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    setIsEmpty(true);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const signatureData = canvas.toDataURL("image/png");
    onSave(signatureData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <PenTool className="h-5 w-5 text-cyan-500" />
            Your Signature
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Sign within the box below using your mouse or finger
          </p>
        </div>
        {!isEmpty && (
          <button 
            onClick={clearCanvas}
            className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      
      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className={cn(
          "relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 transition-all",
          isDrawing ? "border-cyan-400 dark:border-cyan-500 bg-white dark:bg-slate-800 ring-2 ring-cyan-500/20" : "hover:border-slate-400 dark:hover:border-slate-600"
        )}
      >
        {isEmpty && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <p className="text-4xl font-serif italic text-slate-200 dark:text-slate-700">Sign Here</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none relative z-10 w-full h-full"
          style={{ display: "block" }}
        />
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {onCancel && (
          <PremiumButton
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:flex-1 text-slate-500 border-slate-200"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </PremiumButton>
        )}
        <PremiumButton
          size="sm"
          onClick={saveSignature}
          disabled={isEmpty || isLoading}
          className={cn(
            "w-full sm:flex-1",
            isEmpty ? "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600" : "bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Processing..." : "Confirm & Sign"}
        </PremiumButton>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}