"use client";
import React, { useState } from "react";
import { Col, Row } from "react-bootstrap";
import CreateTicket from "../Components/CreateTicket";

function page() {
  const [modalShow, setModalShow] = useState(false);

  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">Support Tickets</h2>
          </div>
          <div>
            <button
              className="custom-btn"
              type="button"
              onClick={() => setModalShow(true)}
            >
              Create Ticket
            </button>
          </div>
        </div>

        <div className="custom-table-cards billing-history">
          <div className="card-header">
            <div>
              <h5 className="table-title">Ticket List</h5>
            </div>
            <div className="table-search">
              <input
                type="text"
                className="form-control"
                placeholder="Search Ticket ..."
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
                  <th>Ticket ID</th>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Last update date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#12345</td>
                  <td>Payment</td>
                  <td>Payment Failed</td>
                  <td>
                    <span className="status-badge ongoing">Open</span>
                  </td>
                  <td>05 Oct 2025</td>
                </tr>
                <tr>
                  <td>#12345</td>
                  <td>Account</td>
                  <td>Login Issue</td>
                  <td>
                    <span className="status-badge pending">Pending</span>
                  </td>
                  <td>07 Oct 2025</td>
                </tr>
                <tr>
                  <td>#12345</td>
                  <td>Other</td>
                  <td>Profile Update Issue</td>
                  <td>
                    <span className="status-badge complete">Resolved</span>
                  </td>
                  <td>10 Oct 2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateTicket show={modalShow} onHide={() => setModalShow(false)} />
    </div>
  );
}

export default page;
