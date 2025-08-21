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
          {Array.from({ length: totalPages }, (_, index) => (
            <span
              key={index}
              className={currentPage === index + 1 ? "active" : ""}
              onClick={() => onPageChange(index + 1)}
            >
              {index + 1}
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
