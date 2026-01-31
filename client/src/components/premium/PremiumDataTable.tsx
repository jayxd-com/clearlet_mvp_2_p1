import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

interface PremiumDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  pagination?: PaginationProps;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function PremiumDataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  pagination,
  onRowClick,
  emptyMessage = "No items found",
  className,
}: PremiumDataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="font-medium animate-pulse">Loading data...</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] overflow-hidden shadow-md transition-shadow hover:shadow-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-slate-950/50 border-b-2 border-slate-100 dark:border-slate-800">
              <TableRow className="hover:bg-transparent">
                {columns.map((col, index) => (
                  <TableHead 
                    key={index} 
                    className={cn(
                      "h-12 px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap", 
                      col.headerClassName
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, rowIndex) => (
                  <TableRow 
                    key={item.id} 
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "group transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800/50",
                      onRowClick ? "cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50" : ""
                    )}
                  >
                    {columns.map((col, colIndex) => (
                      <TableCell key={colIndex} className={cn("py-5 px-6", col.className)}>
                        {col.cell 
                          ? col.cell(item) 
                          : col.accessorKey 
                            ? <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{String(item[col.accessorKey])}</span>
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center px-6">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-full mb-3">
                        <Inbox className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="font-medium">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>
              Showing <span className="font-medium text-slate-900 dark:text-white">{((pagination.currentPage - 1) * pagination.pageSize) + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}</span> of <span className="font-medium text-slate-900 dark:text-white">{pagination.totalItems}</span> items
            </span>
            
            {pagination.onPageSizeChange && (
              <div className="flex items-center gap-2 ml-4">
                <span>Rows per page</span>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(val) => {
                    pagination.onPageSizeChange?.(Number(val));
                    // Reset to page 1 when size changes usually
                    pagination.onPageChange(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map(size => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage === 1}
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                className="gap-1 pl-2.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                className="gap-1 pr-2.5"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
