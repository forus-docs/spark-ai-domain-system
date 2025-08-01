'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface TaskPaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function TaskPagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: TaskPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPages = 7; // Maximum number of page buttons to show

    if (totalPages <= maxPages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-3">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="page-size" className="text-sm text-gray-600">
          Show
        </label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PAGE_SIZES.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">
          of {totalItems} items
        </span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "p-2 rounded-md transition-colors",
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={cn(
              "min-w-[32px] px-3 py-1 text-sm rounded-md transition-colors",
              page === currentPage
                ? "bg-blue-600 text-white"
                : page === '...'
                ? "cursor-default"
                : "hover:bg-gray-100"
            )}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "p-2 rounded-md transition-colors",
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Item Count */}
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
    </div>
  );
}