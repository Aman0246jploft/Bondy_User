"use client";
import React, { useEffect, useState } from "react";
import CreateTicket from "../Components/CreateTicket";
import authApi from "../../../api/authApi";
import supportTicketApi from "../../../api/supportTicketApi";

function page() {
  const [modalShow, setModalShow] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchCategories = async () => {
    try {
      const response = await authApi.getCategoryList({
        type: "support_ticket",
      });
      if (response.status && response.data) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };



  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;

      const response = await supportTicketApi.getMyTickets(params);
      if (response.status && response.data) {
        setTickets(response.data.tickets);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [selectedCategory]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Open":
        return "ongoing";
      case "Pending":
        return "pending";
      case "Resolved":
        return "complete";
      default:
        return "pending";
    }
  };

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
              onClick={() => setModalShow(true)}>
              Create Ticket
            </button>
          </div>
        </div>

        <div className="custom-table-cards billing-history">
          <div className="card-header">
            <div>
              <h5 className="table-title">Ticket List</h5>
            </div>
            <div className="dashboard-filter table-search d-flex gap-2">
              <select
                className="form-select w-auto"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                  </option>
                ))}
              </select>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Ticket ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="button"
                  className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent pe-2">
                  <img src="/img/org-img/search-white.svg" width={16} />
                </button>
              </div>
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
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td>#{ticket.ticketId}</td>
                      <td>
                        {ticket.category
                          ? ticket.category.charAt(0).toUpperCase() +
                            ticket.category.slice(1)
                          : "N/A"}
                      </td>
                      <td>{ticket.subject}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusBadge(
                            ticket.status,
                          )}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        {ticket.updatedAt
                          ? new Date(ticket.updatedAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateTicket
        categories={categories}
        show={modalShow}
        onHide={() => setModalShow(false)}
        onSuccess={fetchTickets}
      />
    </div>
  );
}

export default page;
