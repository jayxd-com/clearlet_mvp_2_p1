import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PremiumDocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  fileName?: string;
  type?: string;
}

export function PremiumDocumentViewer({
  open,
  onOpenChange,
  url,
  fileName = "Document Preview",
  type,
}: PremiumDocumentViewerProps) {
  if (!url) return null;

  const isPdf = type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white truncate pr-8">
            {fileName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 w-full h-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center p-4 relative">
          {isPdf ? (
            <iframe 
              src={url} 
              className="w-full h-full rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 bg-white" 
              title={fileName}
            />
          ) : (
            <img 
              src={url} 
              alt={fileName} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
