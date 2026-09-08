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

function Page() {
  const { t } = useLanguage();

  const TYPE_LABEL = {
    TICKET_SALE: t("ticketSale"),
    COURSE_SALE: t("courseSale") || "Course Sale",
    PAYOUT_REQUEST: t("payoutRequest"),
    PAYOUT_REJECTED: t("payoutRejected"),
    REFUND: t("refund"),
    CANCELLATION_DEDUCTION: t("cancellationDeduction") || "Cancellation Deduction",
    ADJUSTMENT: t("adjustment"),
    REFERRAL: t("referralReward"),
    PURCHASE: t("purchase"),
    "Ticket Sale": t("ticketSale"),
    "Course Sale": t("courseSale") || "Course Sale",
    "Purchase": t("purchase"),
    "Payout Request": t("payoutRequest"),
    "Payout Refunded": t("payoutRejected"),
    "Payout Rejected": t("payoutRejected"),
    "Refund": t("refund"),
    "Cancellation Deduction": t("cancellationDeduction") || "Cancellation Deduction",
    "Adjustment": t("adjustment"),
    "Referral Reward": t("referralReward"),
    "Тасалбар борлуулалт": t("ticketSale") || "Тасалбар борлуулалт",
    "Сургалт борлуулалт": t("courseSale") || "Сургалт борлуулалт",
    "Худалдан авалт": t("purchase") || "Худалдан авалт",
    "Төлбөрийн хүсэлт": t("payoutRequest") || "Төлбөрийн хүсэлт",
    "Төлбөр буцаагдсан": t("payoutRejected") || "Төлбөр буцаагдсан",
    "Буцаан олголт": t("refund") || "Буцаан олголт",
    "Цуцлалтын суутгал": t("cancellationDeduction") || "Цуцлалтын суутгал",
    "Зохицуулалт": t("adjustment") || "Зохицуулалт",
    "Урилгын шагнал": t("referralReward") || "Урилгын шагнал",
  };

  const TYPE_BADGE = {
    TICKET_SALE: "complete",
    COURSE_SALE: "complete",
    PAYOUT_REQUEST: "pending",
    PAYOUT_REJECTED: "cancel",
    REFUND: "cancel",
    CANCELLATION_DEDUCTION: "cancel",
    ADJUSTMENT: "upcoming",
    REFERRAL: "complete",
    PURCHASE: "purchase",
    "Ticket Sale": "complete",
    "Course Sale": "complete",
    "Purchase": "purchase",
    "Payout Request": "pending",
    "Payout Refunded": "cancel",
    "Payout Rejected": "cancel",
    "Refund": "cancel",
    "Cancellation Deduction": "cancel",
    "Adjustment": "upcoming",
    "Referral Reward": "complete",
    "Тасалбар борлуулалт": "complete",
    "Сургалт борлуулалт": "complete",
    "Худалдан авалт": "purchase",
    "Төлбөрийн хүсэлт": "pending",
    "Төлбөр буцаагдсан": "cancel",
    "Буцаан олголт": "cancel",
    "Цуцлалтын суутгал": "cancel",
    "Зохицуулалт": "upcoming",
    "Урилгын шагнал": "complete",
  };

  const formatAmount = (amount) => {
    const abs = Math.abs(amount).toLocaleString();
    return amount < 0 ? `-₮${abs}` : `+₮${abs}`;
  };

  const formatDescription = (desc) => {
    if (!desc) return "";
    const isMongolian = t("ticketSale") === "Тасалбар борлуулалт";
    if (isMongolian) {
      if (desc.startsWith("Ticket Sale: ")) return `Тасалбар борлуулалт: ${desc.slice(13)}`;
      if (desc.startsWith("Course Sale: ")) return `Сургалт борлуулалт: ${desc.slice(13)}`;
      if (desc.startsWith("Event: ")) {
        const rest = desc.slice(7);
        return `Арга хэмжээ: ${rest === "Unknown Event" ? "Тодорхойгүй арга хэмжээ" : rest}`;
      }
      if (desc.startsWith("Course: ")) {
        const rest = desc.slice(8);
        return `Сургалт: ${rest === "Unknown Course" ? "Тодорхойгүй сургалт" : rest}`;
      }
      if (desc.startsWith("Payout Request of ")) return `Төлбөрийн хүсэлт: ₮${desc.slice(18)}`;
      if (desc.startsWith("Payout request of ")) return `Төлбөрийн хүсэлт: ₮${desc.slice(18)}`;
      if (desc.startsWith("Payout Request: ")) return `Төлбөрийн хүсэлт: ${desc.slice(16)}`;
      if (desc.startsWith("Payout rejected: ")) {
        const rest = desc.slice(17);
        return `Төлбөр татгалзагдсан: ${rest === "No reason provided" ? "Шалтгаан тодорхойгүй" : rest}`;
      }
      if (desc.startsWith("Payout Rejected: ")) {
        const rest = desc.slice(17);
        return `Төлбөр татгалзагдсан: ${rest === "No reason provided" ? "Шалтгаан тодорхойгүй" : rest}`;
      }
      if (desc.startsWith("Admin manual payout: ")) {
        const rest = desc.slice(21);
        return `Админы гараар хийсэн төлбөр: ${rest === "No notes" ? "Тэмдэглэлгүй" : rest}`;
      }
      if (desc.startsWith("Cancellation Deduction: ")) {
        const rest = desc.slice(24);
        return `Цуцлалтын суутгал: ${rest === "Booking cancelled" ? "Захиалга цуцлагдсан" : rest}`;
      }
      if (desc === "1st Successful Referral Reward - 10% Off") return "1 дэх амжилттай урилгын шагнал - 10% хөнгөлөлт";
      if (desc === "5th Successful Referral Reward - 25,000 MNT Off") return "5 дахь амжилттай урилгын шагнал - 25,000₮ хөнгөлөлт";
      if (desc.startsWith("Referral Reward: ")) return `Урилгын шагнал: ${desc.slice(17)}`;
      if (desc === "Referral Reward" || desc === "Referral") return "Урилгын шагнал";
    } else {
      if (desc.startsWith("Тасалбар борлуулалт: ")) return `Ticket Sale: ${desc.slice(21)}`;
      if (desc.startsWith("Сургалт борлуулалт: ")) return `Course Sale: ${desc.slice(20)}`;
      if (desc.startsWith("Арга хэмжээ: ")) {
        const rest = desc.slice(13);
        return `Event: ${rest === "Тодорхойгүй арга хэмжээ" ? "Unknown Event" : rest}`;
      }
      if (desc.startsWith("Сургалт: ")) {
        const rest = desc.slice(9);
        return `Course: ${rest === "Тодорхойгүй сургалт" ? "Unknown Course" : rest}`;
      }
      if (desc.startsWith("Төлбөрийн хүсэлт: ₮")) return `Payout Request of ${desc.slice(19)}`;
      if (desc.startsWith("Төлбөрийн хүсэлт: ")) return `Payout Request: ${desc.slice(18)}`;
      if (desc.startsWith("Төлбөр татгалзагдсан: ")) {
        const rest = desc.slice(22);
        return `Payout rejected: ${rest === "Шалтгаан тодорхойгүй" ? "No reason provided" : rest}`;
      }
      if (desc.startsWith("Админы гараар хийсэн төлбөр: ")) {
        const rest = desc.slice(29);
        return `Admin manual payout: ${rest === "Тэмдэглэлгүй" ? "No notes" : rest}`;
      }
      if (desc.startsWith("Цуцлалтын суутгал: ")) {
        const rest = desc.slice(19);
        return `Cancellation Deduction: ${rest === "Захиалга цуцлагдсан" ? "Booking cancelled" : rest}`;
      }
      if (desc.startsWith("Урилгын шагнал: ")) return `Referral Reward: ${desc.slice(16)}`;
      if (desc === "Урилгын шагнал") return "Referral Reward";
    }
    return desc;
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
      toast.error(
        t("minPayoutAmount", { amount: minPayout.toLocaleString() }) ||
        `Minimum payout amount is ₮${minPayout.toLocaleString()}`,
      );
      return;
    }
    if (amount > earnings.payoutBalance) {
      toast.error(
        t("amountExceedsBalance") || "Amount exceeds available balance",
      );
      return;
    }
    if (!payoutReference.trim()) {
      toast.error(
        t("paymentRefRequired") ||
        "Payment reference / bank account details are required",
      );
      return;
    }
    setPayoutLoading(true);
    try {
      const res = await organizerApi.requestPayout(
        amount,
        payoutReference.trim(),
      );
      if (res?.status) {
        toast.success(
          t("payoutRequestSubmitted") || "Payout request submitted!",
        );
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

  const FILTER_OPTIONS = [
    { value: "ALL", label: t("allTypes") || "All Types" },
    { value: "TICKET_SALE", label: t("ticketSale") || "Ticket Sale" },
    { value: "COURSE_SALE", label: t("courseSale") || "Course Sale" },
    { value: "PURCHASE", label: t("purchase") || "Purchase" },
    { value: "PAYOUT_REQUEST", label: t("payoutRequest") || "Payout Request" },
    { value: "PAYOUT_REJECTED", label: t("payoutRejected") || "Payout Refunded" },
    { value: "REFUND", label: t("refund") || "Refund" },
    { value: "CANCELLATION_DEDUCTION", label: t("cancellationDeduction") || "Cancellation Deduction" },
    { value: "ADJUSTMENT", label: t("adjustment") || "Adjustment" },
    { value: "REFERRAL", label: t("referralReward") || "Referral Reward" },
  ];

  // Filter wallet history
  const filteredHistory = earnings.walletHistory.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.description?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      item._id?.toLowerCase().includes(q);
    const matchType =
      typeFilter === "ALL" ||
      item.type === typeFilter ||
      (typeFilter === "TICKET_SALE" && (item.type === "Ticket Sale" || item.type === "Тасалбар борлуулалт")) ||
      (typeFilter === "COURSE_SALE" && (item.type === "Course Sale" || item.type === "Сургалт борлуулалт")) ||
      (typeFilter === "PURCHASE" && (item.type === "Purchase" || item.type === "Худалдан авалт")) ||
      (typeFilter === "PAYOUT_REQUEST" && (item.type === "Payout Request" || item.type === "Төлбөрийн хүсэлт")) ||
      (typeFilter === "PAYOUT_REJECTED" && (item.type === "Payout Refunded" || item.type === "Payout Rejected" || item.type === "Төлбөр буцаагдсан")) ||
      (typeFilter === "REFUND" && (item.type === "Refund" || item.type === "Буцаан олголт")) ||
      (typeFilter === "CANCELLATION_DEDUCTION" && (item.type === "Cancellation Deduction" || item.type === "Цуцлалтын суутгал")) ||
      (typeFilter === "ADJUSTMENT" && (item.type === "Adjustment" || item.type === "Зохицуулалт")) ||
      (typeFilter === "REFERRAL" && (item.type === "Referral" || item.type === "Referral Reward" || item.type === "Урилгын шагнал"));
    return matchSearch && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Reset to page 1 when filters change
  const handleSearch = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };
  const handleTypeFilter = (val) => {
    setTypeFilter(val);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="cards">
        {/* Header */}
        <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <h2 className="card-title">{t("earnings")}</h2>
            <p className="card-desc">{t("trackIncome")}</p>
          </div>
          <button
            className="common_btn"
            onClick={() => setShowPayoutModal(true)}
            disabled={earnings.payoutBalance <= 0}>
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
                ₮
                {earnings.walletHistory
                  .filter((w) => w.type === "REFERRAL" || w.type === "Referral Reward" || w.type === "Урилгын шагнал")
                  .reduce((s, w) => s + (w.amount || 0), 0)
                  .toLocaleString()}
              </h4>
            </div>
          </div>
        )}

        {/* Transaction History Table */}
        <div className="custom-table-cards transaction-history mt-4">
          <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h5 className="table-title">{t("transactionHistory")}</h5>
            </div>
            <div className="d-flex flex-wrap gap-2 w-100 w-md-auto justify-content-start justify-content-md-end">
              {/* Type filter */}
              <select
                className="form-control filter-select"
                style={{ maxWidth: 180 }}
                value={typeFilter}
                onChange={(e) => handleTypeFilter(e.target.value)}>
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {/* Search */}
              <div className="table-search filter-search position-relative">
                <input
                  type="text"
                  className="form-control"
                  placeholder={t("searchTransactions")}
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <button type="button" className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent pe-2">
                  <img
                    src="/img/org-img/search-white.svg"
                    width={16}
                    alt="search"
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive custom-table-wrapper">
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
                    <td
                      colSpan={6}
                      className="text-center py-4"
                      style={{ color: "#999" }}>
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
                        <div className="title">
                          {formatDescription(item.description) ||
                            TYPE_LABEL[item.type] ||
                            item.type}
                        </div>
                        <div className="sub">
                          {TYPE_LABEL[item.type] || item.type}
                        </div>
                      </td>
                      <td
                        className="trx"
                        style={{ fontSize: 12, color: "#888" }}>
                        #{String(item._id).slice(-8).toUpperCase()}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${TYPE_BADGE[item.type] || "pending"}`}>
                          {TYPE_LABEL[item.type] || item.type}
                        </span>
                      </td>
                      <td
                        className="amount"
                        style={{
                          color: item.amount < 0 ? "#e74c3c" : "#27ae60",
                          fontWeight: 600,
                        }}>
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
            <div
              className="d-flex justify-content-between align-items-center px-3 py-3 flex-wrap"
              style={{ borderTop: "1px solid #2a2a2a" }}>
              <span style={{ color: "#888", fontSize: 13 }}>
                {t("showingTransactions", {
                  start: Math.min(
                    (currentPage - 1) * PAGE_SIZE + 1,
                    filteredHistory.length,
                  ),
                  end: Math.min(
                    currentPage * PAGE_SIZE,
                    filteredHistory.length,
                  ),
                  total: filteredHistory.length,
                })}
              </span>
              <div className="d-flex gap-2">
                <button
                  className="common_btn"
                  style={{ padding: "6px 14px", fontSize: 13 }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}>
                  ← {t("previous")}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1,
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{ alignSelf: "center", color: "#666" }}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className="common_btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: 13,
                          opacity: currentPage === p ? 1 : 0.5,
                        }}>
                        {p}
                      </button>
                    ),
                  )}
                <button
                  className="common_btn"
                  style={{ padding: "6px 14px", fontSize: 13 }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}>
                  {t("next")} →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Payout Request Modal ──────────────────────────────────────────── */}
      <Modal
        show={showPayoutModal}
        onHide={() => {
          setShowPayoutModal(false);
          setPayoutAmount("");
          setPayoutReference("");
        }}
        centered>
        <Modal.Header className="p-0 mb-4 pb-3" closeButton>
          <Modal.Title>{t("requestPayout")}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRequestPayout}>
          <Modal.Body className="p-0">
            <p style={{ color: "#999", fontSize: 14 }}>
              {t("availableBalance")}:{" "}
              <strong style={{ color: "#fff" }}>
                ₮{earnings.payoutBalance.toLocaleString()}
              </strong>
              <span style={{ marginLeft: 12, color: "#aaa" }}>
                {t("min") || "Minimum"}:{" "}
                <strong style={{ color: "#fff" }}>
                  ₮{minPayout.toLocaleString()}
                </strong>
              </span>
            </p>

            {/* Amount */}
            <Form.Group className="mb-3">
              <Form.Label>{t("payoutAmountLabel")}</Form.Label>
              <Form.Control
                type="number"
                min={minPayout}
                max={earnings.payoutBalance}
                placeholder={t("minPayoutAmount", {
                  amount: minPayout.toLocaleString(),
                })}
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
              <Form.Label>
                {t("payoutRefLabel")}{" "}
                <span style={{ color: "#e74c3c" }}>*</span>
              </Form.Label>
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
            <button
              className="outline-btn py-2 px-4"
              onClick={() => {
                setShowPayoutModal(false);
                setPayoutAmount("");
                setPayoutReference("");
              }}>
              {t("discard")}
            </button>
            <button
              type="submit"
              className="common_btn py-2"
              disabled={
                payoutLoading ||
                !payoutAmount ||
                !payoutReference.trim() ||
                Number(payoutAmount) < minPayout ||
                Number(payoutAmount) > earnings.payoutBalance
              }>
              {payoutLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                (t("payoutRequestSubmitted") &&
                  t(
                    "submitTicket",
                  )) /** Reusing submitTicket as Submit Request fallback */ ||
                "Submit Request"
              )}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>
      <style jsx>{`
        @media (max-width: 767px) {
          .filter-select {
            width: 100% !important;
            max-width: 100% !important;
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
