import React from 'react';
import Button from './Button';

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  isLoading = false,
  itemName = 'records'
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-4 border-t border-slate-100 gap-4">
      <p className="text-xs text-slate-500">
        Showing page{" "}
        <span className="font-bold text-slate-700">{currentPage}</span> of{" "}
        <span className="font-bold text-slate-700">{totalPages}</span>
        {totalItems !== undefined && (
          <span className="ml-1 opacity-70">
            ({totalItems} total {itemName})
          </span>
        )}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
