/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
// import "bootstrap-icons/font/bootstrap-icons.css";
import "../assets/css/bootstrap.min.css";
// import '../../assets/js/bootstrap.bundle.min.js';
import "../assets/css/style.css";
import "../assets/css/responsive.css";
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  // Generate smart page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // how many pages to show around current page

    if (totalPages <= 20) {
      // small data → show full pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first
    pages.push(1);

    // Left ellipsis
    if (currentPage > maxVisible) {
      pages.push("...");
    }

    // Middle pages
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Right ellipsis
    if (currentPage < totalPages - maxVisible + 1) {
      pages.push("...");
    }

    // Always show last
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="tablePagination">
      <div className="pageCount">
        {`${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(
          currentPage * itemsPerPage,
          totalItems
        )} of ${totalItems} items`}
      </div>

      <div className="pagination">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>

        <div className="paginationCount">
          {getPageNumbers().map((page, index) => (
            <span
              key={index}
              className={page === currentPage ? "active" : ""}
              onClick={() => typeof page === "number" && onPageChange(page)}
              style={{ cursor: page === "..." ? "default" : "pointer" }}
            >
              {page}
            </span>
          ))}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
