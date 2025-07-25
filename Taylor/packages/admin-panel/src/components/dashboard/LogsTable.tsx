import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Log } from "@/hooks/useLogs";

interface LogsTableProps {
  logs: Log[];
}

export const LogsTable = ({ logs }: LogsTableProps) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Method</TableHead>
            <TableHead>Path</TableHead>
            <TableHead className="w-[80px]">Status</TableHead>
            <TableHead className="text-right">Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.method}</TableCell>
              <TableCell className="font-mono text-sm">{log.path}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  log.status_code >= 200 && log.status_code < 300 
                    ? 'bg-green-100 text-green-800' 
                    : log.status_code >= 400 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {log.status_code}
                </span>
              </TableCell>
              <TableCell className="text-right text-sm text-gray-500">
                {new Date(log.created_at).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 