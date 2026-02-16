"use client";

import { useState, useRef, useEffect } from "react";
import React from "react";
import { Col, Row } from "react-bootstrap";
import { MoreVertical } from "lucide-react";
const statusText = {
  complete: "Confirm",
  pending: "Pending",
  cancel: "Canceled",
};

/* ===== TABLE DATA ===== */
const data = [
  {
    date: "20-07-2024",
    title: "Indie Rock Showcase",
    sub: "Ticket Sales Batch",
    trx: "#TRX-8829-01",
    status: "complete",
    amount: "+$2,450.00",
  },
  {
    date: "24-07-2024",
    title: "Withdrawal to **** 4589",
    sub: "Payout Request",
    trx: "#TRX-8829-09",
    status: "cancel",
    amount: "+$850.00",
  },
  {
    date: "25-07-2024",
    title: "Art Workshop Series",
    sub: "Ticket Sales Batch",
    trx: "#TRX-8829-03",
    status: "pending",
    amount: "-$1,500.00",
  },
  {
    date: "28-07-2024",
    title: "Art Workshop Series",
    sub: "Ticket Sales Batch",
    trx: "#TRX-8829-05",
    status: "cancel",
    amount: "$0.00",
  },
  {
    date: "01-08-2024",
    title: "Withdrawal to **** 4589",
    sub: "Payout Request",
    trx: "#TRX-8829-15",
    status: "cancel",
    amount: "+$850.00",
  },
  {
    date: "20-07-2024",
    title: "Indie Rock Showcase",
    sub: "Ticket Sales Batch",
    trx: "#TRX-8829-01",
    status: "complete",
    amount: "+$2,450.00",
  },
];

function page() {
  const [open, setOpen] = useState(null);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">Earnings</h2>
          </div>
        </div>
        <div className="dashbord-card-grid">
          <div className="earning-cards">
            <h5>Total Earnings</h5>
            <h4>$12,345</h4>
          </div>
          <div className="earning-cards">
            <h5>Pending Balance</h5>
            <h4>$5,901</h4>
          </div>
          <div className="earning-cards">
            <h5>Available Balance</h5>
            <h4>$6,789</h4>
          </div>
          <div className="earning-cards">
            <h5>Total Payout</h5>
            <h4>$8,709</h4>
          </div>
          <div className="earning-cards">
            <h5>Next Payout</h5>
            <h4>25-3-2026</h4>
          </div>
        </div>

        <div className="custom-table-cards transaction-history">
          <div className="card-header">
            <div>
              <h5 className="table-title">Transaction History</h5>
            </div>
            <div className="table-search">
              <input
                type="text"
                className="form-control"
                placeholder="Search Transaction ... "
              />
              <button type="button">
                <img src="/img/org-img/search-white.svg" />
              </button>
            </div>
          </div>
          <div className="table table-responsive custom-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th className="center">Action</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item, i) => (
                  <tr key={i}>
                    <td>{item.date}</td>

                    <td>
                      <div className="title">{item.title}</div>
                      <div className="sub">{item.sub}</div>
                    </td>

                    <td className="trx">{item.trx}</td>

                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {statusText[item.status]}
                      </span>
                    </td>

                    <td className="amount">{item.amount}</td>
                    <td className="center">
                      <div className="action" ref={dropdownRef}>
                        <button onClick={() => setOpen(open === i ? null : i)}>
                          <MoreVertical size={18} />
                        </button>

                        {open === i && (
                          <div className="dropdown">
                            <button>View</button>
                            <button>Download</button>
                            <button className="danger">Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
