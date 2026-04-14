"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import React from "react";
import { Col, Row, Spinner, Modal, Button, Form } from "react-bootstrap";
import { MoreVertical } from "lucide-react";
import organizerApi from "@/api/organizerApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

// ─── Helpers ────────────────────────────────────────────────────────────────

// ─── Component ───────────────────────────────────────────────────────────────

function page() {
  const { t } = useLanguage();

  const TYPE_LABEL = {
    TICKET_SALE: t("ticketSale"),
    PAYOUT_REQUEST: t("payoutRequest"),
    PAYOUT_REJECTED: t("payoutRejected"),
    REFUND: t("refund"),
    ADJUSTMENT: t("adjustment"),
    REFERRAL: t("referralReward"),
  };

  const TYPE_BADGE = {
    TICKET_SALE: "complete",
    PAYOUT_REQUEST: "pending",
    PAYOUT_REJECTED: "cancel",
    REFUND: "cancel",
    ADJUSTMENT: "upcoming",
    REFERRAL: "complete",
  };

  const formatAmount = (amount) => {
    const abs = Math.abs(amount).toLocaleString();
    return amount < 0 ? `-₮${abs}` : `+₮${abs}`;
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    payoutBalance: 0,
    walletHistory: [],
    payoutHistory: [],
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [open, setOpen] = useState(null);
  const dropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Payout Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutReference, setPayoutReference] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [minPayout, setMinPayout] = useState(1000); // Default fallback

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await organizerApi.getEarnings();
      if (res?.status) {
        setEarnings({
          totalEarnings: res.data.totalEarnings || 0,
          payoutBalance: res.data.payoutBalance || 0,
          walletHistory: res.data.walletHistory || [],
          payoutHistory: res.data.payoutHistory || [],
        });
        if (res.data.minPayout) setMinPayout(res.data.minPayout);
      }
    } catch (err) {
      toast.error(t("failedToLoadEarnings") || "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.title = "Earnings - Bondy";
  }, []);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error(t("enterValidAmount") || "Enter a valid amount");
      return;
    }
    if (amount < minPayout) {
      toast.error(t("minPayoutAmount", { amount: minPayout.toLocaleString() }) || `Minimum payout amount is ₮${minPayout.toLocaleString()}`);
      return;
    }
    if (amount > earnings.payoutBalance) {
      toast.error(t("amountExceedsBalance") || "Amount exceeds available balance");
      return;
    }
    if (!payoutReference.trim()) {
      toast.error(t("paymentRefRequired") || "Payment reference / bank account details are required");
      return;
    }
    setPayoutLoading(true);
    try {
      const res = await organizerApi.requestPayout(amount, payoutReference.trim());
      if (res?.status) {
        toast.success(t("payoutRequestSubmitted") || "Payout request submitted!");
        setShowPayoutModal(false);
        setPayoutAmount("");
        setPayoutReference("");
        fetchEarnings();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Payout request failed");
    } finally {
      setPayoutLoading(false);
    }
  };

  // Derived stats from wallet history
  const totalPaidOut = earnings.payoutHistory
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayouts = earnings.payoutHistory
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  // Filter wallet history
  const filteredHistory = earnings.walletHistory.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.description?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      item._id?.toLowerCase().includes(q);
    const matchType = typeFilter === "ALL" || item.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to page 1 when filters change
  const handleSearch = (val) => { setSearch(val); setCurrentPage(1); };
  const handleTypeFilter = (val) => { setTypeFilter(val); setCurrentPage(1); };

  return (
    <div>
      <div className="cards">
        {/* Header */}
        <div className="card-header">
          <div>
            <h2 className="card-title">{t("earnings")}</h2>
            <p className="card-desc">{t("trackIncome")}</p>
          </div>
          <button
            className="common_btn"
            onClick={() => setShowPayoutModal(true)}
            disabled={earnings.payoutBalance <= 0}
          >
            {t("requestPayout")}
          </button>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" /> {t("loading")}...
          </div>
        ) : (
          <div className="dashbord-card-grid">
            <div className="earning-cards">
              <h5>{t("totalEarnings")}</h5>
              <h4>₮{earnings.totalEarnings.toLocaleString()}</h4>
            </div>
            <div className="earning-cards">
              <h5>{t("availableBalance")}</h5>
              <h4>₮{earnings.payoutBalance.toLocaleString()}</h4>
            </div>
            <div className="earning-cards">
              <h5>{t("totalPaidOut")}</h5>
              <h4>₮{totalPaidOut.toLocaleString()}</h4>
            </div>
            <div className="earning-cards">
              <h5>{t("pendingPayout")}</h5>
              <h4>₮{pendingPayouts.toLocaleString()}</h4>
            </div>
            <div className="earning-cards">
              <h5>{t("referralCredits")}</h5>
              <h4>
                ₮{earnings.walletHistory
                  .filter((w) => w.type === "REFERRAL")
                  .reduce((s, w) => s + (w.amount || 0), 0)
                  .toLocaleString()}
              </h4>
            </div>
          </div>
        )}

        {/* Transaction History Table */}
        <div className="custom-table-cards transaction-history mt-4">
          <div className="card-header">
            <div>
              <h5 className="table-title">{t("transactionHistory")}</h5>
            </div>
            <div className="d-flex gap-2 align-items-center">
              {/* Type filter */}
              <select
                className="form-control"
                style={{ maxWidth: 180 }}
                value={typeFilter}
                onChange={(e) => handleTypeFilter(e.target.value)}
              >
                <option value="ALL">{t("allTypes")}</option>
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {/* Search */}
              <div className="table-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder={t("searchTransactions")}
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <button type="button">
                  <img src="/img/org-img/search-white.svg" width={16} alt="search" />
                </button>
              </div>
            </div>
          </div>

          <div className="table table-responsive custom-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("orderDate")}</th>
                  <th>{t("description")}</th>
                  <th>{t("transactionID")}</th>
                  <th>{t("transactionType")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("balanceAfter")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <Spinner animation="border" size="sm" /> {t("loading")}...
                    </td>
                  </tr>
                ) : paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4" style={{ color: "#999" }}>
                      {search || typeFilter !== "ALL"
                        ? t("noMatchingTransactions")
                        : t("noTransactionsYet")}
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((item, i) => (
                    <tr key={item._id || i}>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>
                        <div className="title">{item.description || TYPE_LABEL[item.type] || item.type}</div>
                        <div className="sub">{TYPE_LABEL[item.type] || item.type}</div>
                      </td>
                      <td className="trx" style={{ fontSize: 12, color: "#888" }}>
                        #{String(item._id).slice(-8).toUpperCase()}
                      </td>
                      <td>
                        <span className={`status-badge ${TYPE_BADGE[item.type] || "pending"}`}>
                          {TYPE_LABEL[item.type] || item.type}
                        </span>
                      </td>
                      <td
                        className="amount"
                        style={{ color: item.amount < 0 ? "#e74c3c" : "#27ae60", fontWeight: 600 }}
                      >
                        {formatAmount(item.amount)}
                      </td>
                      <td>₮{(item.balanceAfter || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination ─── */}
          {!loading && filteredHistory.length > PAGE_SIZE && (
            <div className="d-flex justify-content-between align-items-center px-3 py-3" style={{ borderTop: "1px solid #2a2a2a" }}>
              <span style={{ color: "#888", fontSize: 13 }}>
                {t("showingTransactions", {
                  start: Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredHistory.length),
                  end: Math.min(currentPage * PAGE_SIZE, filteredHistory.length),
                  total: filteredHistory.length
                })}
              </span>
              <div className="d-flex gap-2">
                <button
                  className="common_btn"
                  style={{ padding: "6px 14px", fontSize: 13 }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ← {t("previous")}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} style={{ alignSelf: "center", color: "#666" }}>...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className="common_btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: 13,
                          opacity: currentPage === p ? 1 : 0.5,
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  className="common_btn"
                  style={{ padding: "6px 14px", fontSize: 13 }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  {t("next")} →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Payout Request Modal ──────────────────────────────────────────── */}
      <Modal show={showPayoutModal} onHide={() => { setShowPayoutModal(false); setPayoutAmount(""); setPayoutReference(""); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("requestPayout")}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRequestPayout}>
          <Modal.Body>
            <p style={{ color: "#999", fontSize: 14 }}>
              {t("availableBalance")}:{" "}
              <strong style={{ color: "#fff" }}>₮{earnings.payoutBalance.toLocaleString()}</strong>
              <span style={{ marginLeft: 12, color: "#aaa" }}>
                {t("min") || "Minimum"}: <strong style={{ color: "#fff" }}>₮{minPayout.toLocaleString()}</strong>
              </span>
            </p>

            {/* Amount */}
            <Form.Group className="mb-3">
              <Form.Label>{t("payoutAmountLabel")}</Form.Label>
              <Form.Control
                type="number"
                min={minPayout}
                max={earnings.payoutBalance}
                placeholder={t("minPayoutAmount", { amount: minPayout.toLocaleString() })}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                required
              />
              {Number(payoutAmount) > 0 && Number(payoutAmount) < minPayout && (
                <Form.Text style={{ color: "#e74c3c" }}>
                  {t("minPayoutAmount", { amount: minPayout.toLocaleString() })}
                </Form.Text>
              )}
              {Number(payoutAmount) > earnings.payoutBalance && (
                <Form.Text style={{ color: "#e74c3c" }}>
                  {t("amountExceedsBalance")}
                </Form.Text>
              )}
            </Form.Group>

            {/* Payment Reference */}
            <Form.Group className="mb-3">
              <Form.Label>{t("payoutRefLabel")} <span style={{ color: "#e74c3c" }}>*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder={t("payoutRefPlaceholder")}
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
                required
              />
              <Form.Text style={{ color: "#888" }}>
                {t("payoutRefDesc")}
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowPayoutModal(false); setPayoutAmount(""); setPayoutReference(""); }}>
              {t("discard")}
            </Button>
            <Button
              type="submit"
              className="common_btn"
              disabled={
                payoutLoading ||
                !payoutAmount ||
                !payoutReference.trim() ||
                Number(payoutAmount) < minPayout ||
                Number(payoutAmount) > earnings.payoutBalance
              }
            >
              {payoutLoading ? <Spinner animation="border" size="sm" /> : t("payoutRequestSubmitted") && t("submitTicket") /** Reusing submitTicket as Submit Request fallback */ || "Submit Request"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default page;
