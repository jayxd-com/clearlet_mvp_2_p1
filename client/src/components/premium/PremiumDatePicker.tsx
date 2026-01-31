import React, { forwardRef } from "react";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

export interface PremiumDatePickerProps {
  value?: Date | string;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: string | Date; // Allow string (ISO) or Date
  max?: string | Date;
  className?: string;
  containerClassName?: string;
  highlightedDates?: (Date | string)[];
}

const PremiumDatePicker = forwardRef<HTMLDivElement, PremiumDatePickerProps>(
  ({ value, onChange, label, error, helperText, placeholder = "Pick a date", disabled, min, max, className, containerClassName, highlightedDates = [] }, ref) => {
    
    // safe date parsing
    const dateValue = React.useMemo(() => {
      if (!value) return undefined;
      if (value instanceof Date) return value;
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : undefined;
    }, [value]);

    const handleSelect = (date: Date | undefined) => {
      onChange?.(date);
    };

    // Convert min/max strings to Date if necessary
    const minDate = typeof min === 'string' ? parseISO(min) : min;
    const maxDate = typeof max === 'string' ? parseISO(max) : max;

    // Parse highlighted dates
    const parsedHighlightedDates = React.useMemo(() => {
      return highlightedDates.map(d => {
        if (d instanceof Date) return d;
        const parsed = parseISO(d);
        return isValid(parsed) ? parsed : undefined;
      }).filter((d): d is Date => !!d);
    }, [highlightedDates]);

    return (
      <div className={cn("space-y-2", containerClassName)} ref={ref}>
        {label && (
          <Label className={cn(
            "text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1",
            disabled && "opacity-70",
            error && "text-red-500 dark:text-red-400"
          )}>
            {label}
          </Label>
        )}
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full h-12 pl-3 text-left font-normal border-2 border-slate-200 dark:border-slate-800 rounded-xl transition-all",
                "hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-cyan-500/50 dark:hover:border-cyan-500/50",
                "focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
                !dateValue && "text-muted-foreground",
                error && "border-red-500 focus:ring-red-500",
                className
              )}
              disabled={disabled}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  dateValue ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <span className="flex-1 truncate">
                  {dateValue ? format(dateValue, "PPP") : <span>{placeholder}</span>}
                </span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              modifiers={{ highlighted: parsedHighlightedDates }}
              modifiersClassNames={{ highlighted: "bg-cyan-500 text-white font-bold hover:bg-cyan-600 hover:text-white rounded-md" }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {helperText && !error && (
          <p className="text-xs text-slate-500 dark:text-slate-400 ml-1">
            {helperText}
          </p>
        )}
        
        {error && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400 ml-1 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PremiumDatePicker.displayName = "PremiumDatePicker";

export { PremiumDatePicker };