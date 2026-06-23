"use client";

import React from "react";
import { Pagination } from "react-bootstrap";

const getPageRange = (currentPage, totalPages) => {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
};

const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages);

  return (
    <div className="d-flex justify-content-center mt-5 mb-5">
      <Pagination className="custom-pagination">
        <Pagination.Prev
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />

        {pages.map((page, idx) => {
          if (page === "...") {
            return <Pagination.Ellipsis key={`ellipsis-${idx}`} disabled />;
          }

          return (
            <Pagination.Item
              key={page}
              active={page === currentPage}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Pagination.Item>
          );
        })}

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
