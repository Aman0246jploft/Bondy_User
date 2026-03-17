"use client";

import React from "react";
import { Pagination } from "react-bootstrap";

const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="d-flex justify-content-center mt-5 mb-5">
      <Pagination className="custom-pagination">
        <Pagination.Prev
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />

        {[...Array(totalPages)].map((_, idx) => (
          <Pagination.Item
            key={idx + 1}
            active={idx + 1 === currentPage}
            onClick={() => onPageChange(idx + 1)}
          >
            {idx + 1}
          </Pagination.Item>
        ))}

        <Pagination.Next
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>

      <style jsx global>{`
        .custom-pagination .page-item .page-link {
          background-color: transparent;
          border: 1px solid var(--border, #484848);
          color: var(--white, #fff);
          margin: 0 4px;
          border-radius: 8px;
          padding: 8px 16px;
          transition: all 0.3s ease;
        }

        .custom-pagination .page-item.active .page-link {
          background: var(--primary-teal, #23ada4);
          border-color: var(--primary-teal, #23ada4);
          color: white;
          box-shadow: 0 4px 15px rgba(35, 173, 164, 0.2);
        }

        .custom-pagination .page-item.disabled .page-link {
          background-color: transparent;
          border-color: #222;
          color: #555;
        }

        .custom-pagination .page-item .page-link:hover:not(.disabled) {
          border-color: var(--primary-teal, #23ada4);
          color: var(--primary-teal, #23ada4);
          background-color: rgba(35, 173, 164, 0.05);
        }
      `}</style>
    </div>
  );
};

export default PaginationComponent;
