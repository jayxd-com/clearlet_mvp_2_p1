import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ClipboardList } from "lucide-react";

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: logs, isLoading } = trpc.crm.getAuditLogs.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading logs...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
          <ClipboardList className="h-10 w-10 text-slate-400" />
          Audit Logs
        </h1>

        <Card className="border-2 shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900">
              <TableRow>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Admin</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Action</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Resource</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-bold">{log.adminName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{log.resourceType} #{log.resourceId}</TableCell>
                  <TableCell className="text-slate-400 text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
