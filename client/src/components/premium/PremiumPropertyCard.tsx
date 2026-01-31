import { useLocation } from "wouter";
import { MapPin, Bed, Bath, Eye, Edit, Trash2, Home, Users, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PremiumButton } from "./PremiumButton";
import { formatCents } from "@/lib/currency";

interface PremiumPropertyCardProps {
  property: any;
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
  applicationCount?: number;
  showActions?: boolean;
  onClickOverride?: () => void;
}

export function PremiumPropertyCard({ 
  property, 
  onDelete, 
  isDeleting, 
  applicationCount,
  showActions = true,
  onClickOverride
}: PremiumPropertyCardProps) {
  const [, setLocation] = useLocation();

  // Parse images
  let images: string[] = [];
  if (property.images) {
    if (typeof property.images === 'string') {
      try {
        images = JSON.parse(property.images);
      } catch {
        images = [property.images];
      }
    } else if (Array.isArray(property.images)) {
      images = property.images;
    }
  }
  const imageUrl = images.length > 0 ? images[0] : null;
  const isPdf = imageUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div
      className="rounded-[2rem] border-2 border-slate-100 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-400 overflow-hidden transition-all cursor-pointer hover:shadow-2xl bg-white dark:bg-slate-800 group h-full flex flex-col"
      onClick={() => onClickOverride ? onClickOverride() : setLocation(`/landlord/properties/${property.id}`)}
    >
      {/* Property Image */}
      <div className="relative h-56 overflow-hidden bg-slate-900">
        {imageUrl && !isPdf ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-slate-500">
            {isPdf ? (
              <>
                <FileText className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-50">PDF Document</span>
              </>
            ) : (
              <Home className="w-16 h-16 opacity-30" />
            )}
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className={cn(
            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border-none",
            property.status === "active" ? "bg-green-500 text-white" : 
            property.status === "rented" ? "bg-blue-500 text-white" :
            "bg-yellow-500 text-white"
          )}>
            {property.status}
          </Badge>
        </div>
      </div>
      
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight mb-1 group-hover:text-cyan-500 transition-colors line-clamp-1">{property.title}</h3>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm font-medium">
            <MapPin className="h-4 w-4 text-cyan-500" />
            {property.city}, {property.country}
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-slate-300" />
            {property.bedrooms}
          </div>
          <div className="flex items-center gap-2">
            <Bath className="h-5 w-5 text-slate-300" />
            {property.bathrooms}
          </div>
          {applicationCount !== undefined && (
            <div className="flex items-center gap-2 text-cyan-500">
              <Users className="h-5 w-5" />
              {applicationCount}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t-2 border-slate-100 dark:border-slate-700">
          <span className="text-2xl font-black text-cyan-500 tracking-tight">
            {formatCents(property.rentPrice || 0, property.currency || "EUR")}
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">/mo</span>
          </span>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            <PremiumButton
              variant="outline"
              className="flex-1 h-10 text-[10px] rounded-xl border-2 bg-cyan-500/5 text-cyan-600 border-transparent hover:bg-cyan-500/10"
              onClick={(e) => { e.stopPropagation(); setLocation(`/landlord/properties/${property.id}`); }}
            >
              <Eye className="h-4 w-4 mr-2" /> Preview
            </PremiumButton>
            <PremiumButton
              variant="outline"
              className="flex-1 h-10 text-[10px] rounded-xl border-2 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100"
              onClick={(e) => { e.stopPropagation(); setLocation(`/landlord/edit-property/${property.id}`); }}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit
            </PremiumButton>
            
            {onDelete && (
              <div onClick={(e) => e.stopPropagation()}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="w-10 h-10 p-0 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 font-bold rounded-xl flex items-center justify-center transition-colors border-none cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Delete Property?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
                        Are you sure you want to delete "{property.title}"? This action cannot be undone and will remove all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                      <AlertDialogCancel className="border-2 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl px-8 border-none cursor-pointer"
                        onClick={() => onDelete(property.id)}
                        disabled={isDeleting}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}