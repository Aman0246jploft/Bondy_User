"use client";
import React, { useEffect, useState } from "react";
import CreateTicket from "../Components/CreateTicket";
import authApi from "../../../api/authApi";
import supportTicketApi from "../../../api/supportTicketApi";
import { useLanguage } from "@/context/LanguageContext";
import Modal from "react-bootstrap/Modal";

function Page() {
  const { t } = useLanguage();
  const [modalShow, setModalShow] = useState(false);
  const [detailModalShow, setDetailModalShow] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const STATUS_OPTIONS = [
    { value: "", label: t("allStatus") },
    { value: "Open", label: t("open") },
    { value: "Pending", label: t("pending") },
    { value: "Resolved", label: t("resolved") },
  ];

  const fetchCategories = async () => {
    try {
      const response = await authApi.getCategoryList({
        type: "support_ticket",
      });
      if (response?.status && response?.data) {
        setCategories(response?.data?.categories);
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
      if (selectedStatus) params.status = selectedStatus;

      const response = await supportTicketApi.getMyTickets(params);
      if (response?.status && response?.data) {
        setTickets(response?.data?.tickets);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (ticketId) => {
    setLoading(true);
    try {
      const response = await supportTicketApi.getTicketDetails(ticketId);
      if (response?.status && response?.data) {
        setSelectedTicket(response.data.ticket);
        setDetailModalShow(true);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    document.title = "Support Tickets - Bondy";
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [selectedCategory, selectedStatus]);

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

  const getStatusText = (status) => {
    switch (status) {
      case "Open":
        return t("open");
      case "Pending":
        return t("pending");
      case "Resolved":
        return t("resolved");
      default:
        return status;
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ticket.ticketId?.toLowerCase().includes(q) ||
      ticket.subject?.toLowerCase().includes(q) ||
      ticket.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">{t("supportTickets")}</h2>
          </div>
          <div>
            <button
              className="custom-btn"
              type="button"
              onClick={() => setModalShow(true)}>
              {t("createTicket")}
            </button>
          </div>
        </div>

        <div className="custom-table-cards billing-history">
          <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h5 className="table-title">{t("supportTicketList")}</h5>
            </div>
            <div className="dashboard-filter d-flex flex-wrap gap-2 w-100 w-md-auto justify-content-start justify-content-md-end">
              <select
                className="form-select filter-select w-auto"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">{t("allCategories")}</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                  </option>
                ))}
              </select>
              <select
                className="form-select filter-select w-auto"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="position-relative filter-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder={t("searchTicketPlaceholder")}
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
          <div className="table-responsive custom-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("ticketID")}</th>
                  <th>{t("category")}</th>
                  <th>{t("subject")}</th>
                  <th>{t("status")}</th>
                  <th>{t("lastUpdateDate")}</th>
                  <th>{t("actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
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
                          {getStatusText(ticket.status)}
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
                      <td>
                        <button
                          type="button"
                          className="btn p-0 border-0 bg-transparent"
                          onClick={() => handleViewDetails(ticket.ticketId)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#23ada4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer" }}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      {t("noTicketsFound")}
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

      {/* Detail Modal */}
      <Modal
        show={detailModalShow}
        onHide={() => {
          setDetailModalShow(false);
          setSelectedTicket(null);
        }}
        size="lg"
        centered
        scrollable
        className="common_modal gradientsSc"
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("ticketDetails") || "Ticket Details"}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: "#fff" }}>
          {selectedTicket && (
            <div>
              <div className="mb-3">
                <strong>{t("ticketID") || "Ticket ID"}:</strong> #{selectedTicket.ticketId}
              </div>
              <div className="mb-3">
                <strong>{t("category") || "Category"}:</strong> {selectedTicket.category ? selectedTicket.category.charAt(0).toUpperCase() + selectedTicket.category.slice(1) : "N/A"}
              </div>
              <div className="mb-3">
                <strong>{t("status") || "Status"}:</strong>{" "}
                <span className={`status-badge ${getStatusBadge(selectedTicket.status)}`}>
                  {getStatusText(selectedTicket.status)}
                </span>
              </div>
              <div className="mb-3" style={{ wordBreak: "break-word" }}>
                <strong>{t("subject") || "Subject"}:</strong> {selectedTicket.subject}
              </div>
              <div className="mb-4">
                <strong>{t("description") || "Description"}:</strong>
                <p className="mt-1 p-3 rounded" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.adminComments && selectedTicket.adminComments.length > 0 && (
                <div>
                  <h5 className="mb-3 text-white" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
                    {t("adminComments") || "Admin Comments"}
                  </h5>
                  <div style={{ maxHeight: "250px", overflowY: "auto", paddingRight: "5px" }}>
                    {selectedTicket.adminComments.map((comment, index) => (
                      <div key={index} className="p-3 mb-2 rounded" style={{ background: "rgba(35, 173, 164, 0.08)", border: "1px solid rgba(35, 173, 164, 0.2)", wordBreak: "break-word" }}>
                        <p className="mb-1">{comment.comment}</p>
                        <small className="text-secondary">
                          {new Date(comment.createdAt).toLocaleString()}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style jsx>{`
        @media (max-width: 767px) {
          .filter-select {
            width: 100% !important;
          }
          .filter-search {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Page;
