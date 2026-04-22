"use client";
import React, { useEffect, useState } from "react";
import CreateTicket from "../Components/CreateTicket";
import authApi from "../../../api/authApi";
import supportTicketApi from "../../../api/supportTicketApi";

import { useLanguage } from "@/context/LanguageContext";

function Page() {
  const { t } = useLanguage();
  const [modalShow, setModalShow] = useState(false);
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
      if (selectedStatus) params.status = selectedStatus;

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
    document.title = `${t("supportTickets")} - Bondy`;
  }, [t]);

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

  const translateStatus = (status) => {
    switch (status) {
      case "Open":
        return t("open");
      case "Pending":
        return t("pending");
      case "Resolved":
        return t("resolved");
      default: return status;
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
          <div className="card-header">
            <div>
              <h5 className="table-title">{t("supportTicketList")}</h5>
            </div>
            <div className="dashboard-filter d-flex gap-2">
              <select
                className="form-select w-auto"
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
                className="form-select w-auto"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="position-relative">
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
          <div className="table table-responsive custom-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("ticketID")}</th>
                  <th>{t("category")}</th>
                  <th>{t("subject")}</th>
                  <th>{t("status")}</th>
                  <th>{t("lastUpdateDate")}</th>
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
                          {translateStatus(ticket.status)}
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
    </div>
  );
}

export default Page;
