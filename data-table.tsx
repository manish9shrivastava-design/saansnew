'use client';

import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Download, Search } from 'lucide-react';
import type { DataRecord, Schema } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SortConfig = {
  key: string;
  direction: 'ascending' | 'descending';
} | null;

const ITEMS_PER_PAGE = 10;

export function DataTable({ columns, data }: { columns: Schema; data: DataRecord[] }) {
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!filter) return data;
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [data, filter]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedData, currentPage]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const convertToCSV = (dataToConvert: DataRecord[]) => {
    if (columns.length === 0 || dataToConvert.length === 0) {
      return '';
    }

    const columnHeaders = columns.map(c => c.label);
    const rows = dataToConvert.map(row => {
        return columns.map(col => {
            let cellData = row[col.name];
            if (cellData === null || cellData === undefined) {
                cellData = '';
            }
            const cellString = String(cellData);
            // Escape quotes and wrap in quotes if it contains a comma, a quote, or a newline
            if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
                return `"${cellString.replace(/"/g, '""')}"`;
            }
            return cellString;
        }).join(',');
    });

    return [columnHeaders.join(','), ...rows].join('\n');
  };

  const handleExport = () => {
    const csvContent = convertToCSV(sortedData);
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "data-export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  if (columns.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No schema defined. The table cannot be displayed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search all fields..."
            className="pl-8 sm:w-[300px]"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
         <Button variant="outline" onClick={handleExport} disabled={sortedData.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={column.id}>
                  <Button variant="ghost" onClick={() => requestSort(column.name)}>
                    {column.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map(item => (
                <TableRow key={item.id}>
                  {columns.map(column => (
                    <TableCell key={`${item.id}-${column.id}`}>
                      {column.type === 'date' ? new Date(item[column.name]).toLocaleDateString() : String(item[column.name] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {data.length > 0 ? 'No matching records found.' : 'No data available. Add records via the Data Entry page.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
         <div className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, sortedData.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, sortedData.length)} of {sortedData.length} records.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
           <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
