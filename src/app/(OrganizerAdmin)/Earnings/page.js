"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import React from "react";
import Link from "next/link";
import organizerApi from "@/api/organizerApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import DateRangeCalendarPopover from "@/components/DateRangeCalendarPopover";
import GlobalLoader from "@/components/GlobalLoader";

// ─── Helpers ────────────────────────────────────────────────────────────────

// ─── Component ───────────────────────────────────────────────────────────────

function Page() {
  const { t, language } = useLanguage();

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
    PROMOTION: t("pyPromo") || "Promotion",
    "Promotion": t("pyPromo") || "Promotion",
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
  const [summary, setSummary] = useState({ available: 0, pending: 0, total: 0 });
  const [analytics, setAnalytics] = useState({ earnings: 0, deductions: 0, netEarnings: 0 });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [txKind, setTxKind] = useState("all");
  const [range, setRange] = useState("month");
  const [pickOpen, setPickOpen] = useState(false);
  const [rangeMenu, setRangeMenu] = useState(false);
  const rangeBoxRef = useRef(null);

  useEffect(() => {
    if (!rangeMenu) return undefined;
    const close = (event) => {
      if (rangeBoxRef.current && !rangeBoxRef.current.contains(event.target)) setRangeMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [rangeMenu]);
  const [pickStart, setPickStart] = useState("");
  const [pickEnd, setPickEnd] = useState("");
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState(false);

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [wStage, setWStage] = useState("form");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [amtErr, setAmtErr] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutResult, setPayoutResult] = useState(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(null);
  const [minPayout, setMinPayout] = useState(1000);

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await organizerApi.getEarnings();
      if (res?.status && res.data) {
        setEarnings({
          totalEarnings: res.data.totalEarnings || 0,
          payoutBalance: res.data.payoutBalance || 0,
          walletHistory: Array.isArray(res.data.walletHistory) ? res.data.walletHistory : [],
          payoutHistory: Array.isArray(res.data.payoutHistory) ? res.data.payoutHistory : [],
        });
        setSummary({
          available: Number(res.data.availableBalance ?? res.data.payoutBalance ?? 0),
          pending: Number(res.data.pending || 0),
          total: Number(res.data.totalBalance ?? res.data.payoutBalance ?? 0),
        });
        setBankAccounts(Array.isArray(res.data.bankAccounts) ? res.data.bankAccounts : []);
        if (res.data.minPayout) setMinPayout(Number(res.data.minPayout));
        if (res.data.analytics) {
          setAnalytics({
            earnings: Number(res.data.analytics.earnings || 0),
            deductions: Number(res.data.analytics.deductions || 0),
            netEarnings: Number(res.data.analytics.netEarnings || 0),
          });
        }
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

  useEffect(() => {
    document.title = "Earnings - Bondy";
  }, []);

  const money = (n) => {
    const v = Number(n) || 0;
    const sign = v < 0 ? "−" : "";
    return `${sign}₮${Math.abs(v).toLocaleString("en-US")}`;
  };

  const ymd = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const dot = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getMonth() + 1)}.${p(d.getDate())}.${d.getFullYear()}`;
  };

  const rangeQuery = (key, start, end) => {
    const now = new Date();
    if (key === "month") return { filterType: "this_month" };
    if (key === "d7") return { filterType: "last_7_days" };
    if (key === "prev") {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: ymd(s), endDate: ymd(e) };
    }
    if (key === "m6") {
      const s = new Date(now);
      s.setMonth(s.getMonth() - 6);
      return { startDate: ymd(s), endDate: ymd(now) };
    }
    if (key === "y1") {
      const s = new Date(now);
      s.setFullYear(s.getFullYear() - 1);
      return { startDate: ymd(s), endDate: ymd(now) };
    }
    if (key === "custom" && start && end) return { startDate: start, endDate: end };
    return {};
  };

  const rangeLabel = () => {
    const now = new Date();
    if (range === "month") {
      const p = (n) => String(n).padStart(2, "0");
      const m = p(now.getMonth() + 1);
      return `${m}.01.${now.getFullYear()} – ${m}.${p(now.getDate())}.${now.getFullYear()}`;
    }
    if (range === "prev") {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return `${dot(s)} – ${dot(e)}`;
    }
    if (range === "d7") {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return `${dot(s)} – ${dot(now)}`;
    }
    if (range === "m6") {
      const s = new Date(now);
      s.setMonth(s.getMonth() - 6);
      return `${dot(s)} – ${dot(now)}`;
    }
    if (range === "y1") {
      const s = new Date(now);
      s.setFullYear(s.getFullYear() - 1);
      return `${dot(s)} – ${dot(now)}`;
    }
    if (range === "custom" && pickStart && pickEnd) {
      return `${pickStart.replace(/-/g, ".")} – ${pickEnd.replace(/-/g, ".")}`;
    }
    return t("pyAllTime");
  };

  const loadPerf = useCallback(async (key, start, end) => {
    if (key === "custom" && (!start || !end)) return;
    try {
      setPerfLoading(true);
      setPerfError(false);
      const res = await organizerApi.getEarnings(rangeQuery(key, start, end));
      if (res?.status && res.data?.analytics) {
        setAnalytics({
          earnings: Number(res.data.analytics.earnings || 0),
          deductions: Number(res.data.analytics.deductions || 0),
          netEarnings: Number(res.data.analytics.netEarnings || 0),
        });
      } else {
        setPerfError(true);
      }
    } catch (err) {
      setPerfError(true);
    } finally {
      setPerfLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPerf(range, pickStart, pickEnd);
  }, [range, loadPerf]);

  const bank = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0] || null;
  const bankDetail = bank
    ? `${bank.bankName || t("pyBank")} •••• ${String(bank.accountNumber || "").slice(-4)}`
    : t("pyNoBank");
  const available = summary.available;
  const canWithdraw = Boolean(bank) && available >= minPayout;
  const minText = money(minPayout);

  const matchesKind = (item, kind) => {
    if (!item) return false;
    if (kind === "all") return true;

    const rawType = String(item.type || "").trim();
    const typeUpper = rawType.toUpperCase();
    const desc = String(item.description || "").toLowerCase();

    if (kind === "sale") {
      return (
        typeUpper.includes("SALE") ||
        typeUpper.includes("PURCHASE") ||
        rawType.includes("борлуулалт") ||
        rawType.includes("Худалдан авалт") ||
        desc.startsWith("ticket sale") ||
        desc.startsWith("course sale") ||
        desc.startsWith("тасалбар борлуулалт") ||
        desc.startsWith("сургалт борлуулалт")
      );
    }

    if (kind === "payout") {
      return (
        typeUpper.includes("PAYOUT") ||
        rawType.includes("Төлбөрийн хүсэлт") ||
        rawType.includes("Төлбөр буцаагдсан") ||
        Boolean(item.payoutId) ||
        desc.includes("payout") ||
        desc.includes("төлбөрийн хүсэлт")
      );
    }

    if (kind === "fee") {
      return (
        typeUpper.includes("DEDUCTION") ||
        typeUpper.includes("ADJUSTMENT") ||
        typeUpper.includes("FEE") ||
        rawType.includes("суутгал") ||
        rawType.includes("Зохицуулалт") ||
        rawType.includes("шимтгэл") ||
        desc.includes("deduction") ||
        desc.includes("adjustment") ||
        desc.includes("суутгал") ||
        desc.includes("зохицуулалт")
      );
    }

    if (kind === "refund") {
      return (
        typeUpper.includes("REFUND") ||
        typeUpper.includes("REJECT") ||
        rawType.includes("Буцаан олголт") ||
        rawType.includes("буцаагдсан") ||
        desc.includes("refund") ||
        desc.includes("rejected") ||
        desc.includes("буцаан") ||
        desc.includes("буцаагдсан") ||
        desc.includes("татгалз")
      );
    }

    if (kind === "promo") {
      return (
        typeUpper.includes("PROMO") ||
        typeUpper.includes("REFERRAL") ||
        typeUpper.includes("COMMISSION") ||
        rawType.includes("Урилгын шагнал") ||
        rawType.includes("Сурталчилгаа") ||
        rawType.includes("урилга") ||
        desc.includes("promo") ||
        desc.includes("promotion") ||
        desc.includes("referral") ||
        desc.includes("commission") ||
        desc.includes("урилга") ||
        desc.includes("сурталчил")
      );
    }

    return false;
  };

  const kindOf = (item) => {
    if (!item) return "other";
    const rawType = String(item.type || "").trim();
    const typeUpper = rawType.toUpperCase();
    const desc = String(item.description || "").toLowerCase();

    if (
      typeUpper.includes("PROMO") ||
      typeUpper.includes("REFERRAL") ||
      rawType.includes("Урилгын шагнал") ||
      rawType.includes("Сурталчилгаа") ||
      desc.includes("referral") ||
      (desc.includes("promo") && !desc.startsWith("ticket sale") && !desc.startsWith("course sale"))
    ) {
      return "promo";
    }

    if (
      typeUpper.includes("REFUND") ||
      rawType.includes("Буцаан олголт") ||
      typeUpper.includes("PAYOUT_REJECTED") ||
      rawType.includes("Payout Refunded") ||
      rawType.includes("Төлбөр буцаагдсан")
    ) {
      return "refund";
    }

    if (
      typeUpper.includes("PAYOUT") ||
      rawType.includes("Төлбөрийн хүсэлт") ||
      Boolean(item.payoutId)
    ) {
      return "payout";
    }

    if (
      typeUpper.includes("DEDUCTION") ||
      typeUpper.includes("ADJUSTMENT") ||
      typeUpper.includes("FEE") ||
      rawType.includes("суутгал") ||
      rawType.includes("Зохицуулалт")
    ) {
      return "fee";
    }

    if (
      typeUpper.includes("SALE") ||
      typeUpper.includes("PURCHASE") ||
      rawType.includes("борлуулалт") ||
      rawType.includes("Худалдан авалт") ||
      desc.startsWith("ticket sale") ||
      desc.startsWith("course sale")
    ) {
      return "sale";
    }

    return "other";
  };
  const getPayoutInfo = (item) => {
    if (!item) return null;
    const rawId = item.payoutId?._id || item.payoutId;
    const pId = rawId ? String(rawId) : null;
    let payout = null;
    if (pId && Array.isArray(earnings.payoutHistory)) {
      payout = earnings.payoutHistory.find((p) => String(p._id) === pId);
    }
    if (!payout && item.payoutId && typeof item.payoutId === "object") {
      payout = item.payoutId;
    }
    return payout;
  };

  const statusOf = (item) => {
    const type = String(item?.type || "").toLowerCase();
    const isPayoutRequest = type.includes("payout request") || type.includes("төлбөрийн хүсэлт");
    const isPayoutRefund =
      type.includes("payout refund") ||
      type.includes("payout reject") ||
      type.includes("буцаагдсан");

    if (isPayoutRefund) {
      return "refunded";
    }

    if (isPayoutRequest) {
      const payout = getPayoutInfo(item);
      const rawStatus = String(payout?.status || item?.payoutStatus || item?.status || "").toUpperCase();
      if (rawStatus === "PAID") return "paid";
      if (rawStatus === "CANCELLED" || rawStatus === "REJECTED") return "cancelled";
      return "pending";
    }

    const rawStatus = String(item?.status || "").toUpperCase();
    if (rawStatus === "CANCELLED" || rawStatus === "FAILED") return "cancelled";
    if (rawStatus === "PENDING") return "pending";
    return "paid";
  };

  const rangeOptions = [
    { value: "month", label: t("pyThisMonth") },
    { value: "prev", label: t("pyLastMonth") },
    { value: "d7", label: t("pyLast7") },
    { value: "m6", label: t("pyLast6") },
    { value: "y1", label: t("pyLastYear") },
    { value: "all", label: t("pyAllTime") },
    { value: "custom", label: t("pyChooseDate") },
  ];
  const txs = (earnings.walletHistory || []).filter((item) => matchesKind(item, txKind));
  const perfZero = !perfLoading && !perfError && analytics.earnings === 0 && analytics.deductions === 0 && analytics.netEarnings === 0;

  const amountError = (raw) => {
    const s = String(raw || "").trim().replace(/[\s,]/g, "");
    if (!s) return t("pyAmountNeed");
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return t("pyAmountNum");
    const n = Number(s);
    if (!(n > 0)) return t("pyAmountPos");
    if (n < minPayout) return t("pyAmountMin", { min: minText });
    if (n > available) return t("pyAmountMax", { available: money(available) });
    return "";
  };

  const openWithdraw = () => {
    setWStage("form");
    setPayoutAmount("");
    setAmtErr("");
    setPayoutResult(null);
    setShowPayoutModal(true);
  };

  const reviewWithdraw = () => {
    const err = amountError(payoutAmount);
    setAmtErr(err);
    if (!err) setWStage("confirm");
  };

  const submitWithdraw = async () => {
    const err = amountError(payoutAmount);
    if (err) {
      setAmtErr(err);
      setWStage("form");
      return;
    }
    setPayoutLoading(true);
    try {
      const res = await organizerApi.requestPayout(Number(String(payoutAmount).replace(/[\s,]/g, "")), bankDetail);
      if (res?.status) {
        setPayoutResult(res.data?.payout || res.data || {});
        setWStage("result");
        fetchEarnings();
        loadPerf(range, pickStart, pickEnd);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t("pyTxFail"));
    } finally {
      setPayoutLoading(false);
    }
  };

  const WalletIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="3.4" />
      <path d="M3 10.6h12.4a2.4 2.4 0 0 0 0 4.8H3" />
      <circle cx="17.6" cy="13" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
  const ClockIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6V12l3.2 1.9" />
    </svg>
  );
  const LayersIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.4 20.4 7.6 12 11.8 3.6 7.6Z" />
      <path d="M3.6 12.2 12 16.4l8.4-4.2" />
      <path d="M3.6 16.6 12 20.8l8.4-4.2" />
    </svg>
  );
  const BankIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.6 9.8 12 4.4l8.4 5.4" />
      <path d="M5.4 9.8v9.8M18.6 9.8v9.8M9.6 12.6v5.2M14.4 12.6v5.2" />
      <path d="M3.4 19.6h17.2" />
    </svg>
  );

  const chips = [
    ["all", "pyAll"],
    ["sale", "pySale"],
    ["payout", "pyPayout"],
    ["fee", "pyFee"],
    ["refund", "pyRefund"],
    ["promo", "pyPromo"],
  ];

  if (loading && !txs.length) {
    return <GlobalLoader fullScreen={false} />;
  }

  return (
    <div className="py-page">
      <nav className="py-crumb">
        <Link href="/Dashboard">{t("pyDash")}</Link>
        <span>/</span>
        <span>{t("pyTitle")}</span>
      </nav>

      {loading ? (
        <div className="py-bal">
          <div className="py-skel" style={{ height: 142 }} />
          <div className="py-skel" style={{ height: 142 }} />
          <div className="py-skel" style={{ height: 142 }} />
        </div>
      ) : (
        <div className="py-bal">
          <div className="py-balC py-balC-hi">
            <span className="py-balI"><WalletIcon /></span>
            <span className="py-balT"><span>{t("pyAvailable")}</span><b>{money(available)}</b></span>
          </div>
          <div className="py-balC py-balC-pend">
            <span className="py-balI"><ClockIcon /></span>
            <span className="py-balT"><span>{t("pyPending")}</span><b>{money(summary.pending)}</b></span>
          </div>
          <div className="py-balC">
            <span className="py-balI"><LayersIcon /></span>
            <span className="py-balT"><span>{t("pyTotal")}</span><b>{money(summary.total)}</b></span>
          </div>
        </div>
      )}

      <p className="py-info"><i className="py-infoI">i</i>{t("pyReviewNote")}</p>

      <section className="py-card">
        <div className="py-cardHead"><h2 className="py-h2">{t("pyAccount")}</h2></div>
        <div className="py-method">
          <span className="py-methodI"><BankIcon /></span>
          <span className="py-methodTxt">
            <b>{bank ? (bank.bankName || t("pyBank")) : t("pyBank")}</b>
            <i>{bankDetail}</i>
            <span className={`py-pill ${bank ? "is-ok" : "is-muted"}`}>{bank ? t("organizersVerified") : t("pyNoBank")}</span>
          </span>
          <button type="button" className="py-gh" onClick={() => setBankOpen(true)}>{t("pyChange")}</button>
        </div>
        <p className="py-hint">{t("pyMinHint", { min: minText })}</p>
        <div className="py-acts">
          <button type="button" className="py-go" disabled={!canWithdraw} onClick={openWithdraw}>{t("pyRequest")}</button>
        </div>
        {!canWithdraw && (
          <p className="py-hint py-warn">
            {bank ? t("pyLow", { min: minText }) : t("pyNeedBank")}
          </p>
        )}
      </section>

      <section className="py-card">
        <div className="py-cardHead">
          <h2 className="py-h2">{t("pySummary")}</h2>
          <span className="py-sel" ref={rangeBoxRef}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
            <button
              type="button"
              className="py-selBtn"
              aria-haspopup="listbox"
              aria-expanded={rangeMenu}
              aria-label={t("pyChooseDate")}
              onClick={() => setRangeMenu((open) => !open)}
            >
              {rangeOptions.find((item) => item.value === range)?.label}
            </button>
            {rangeMenu && (
              <span className="py-menu" role="listbox">
                {rangeOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="option"
                    aria-selected={item.value === range}
                    onClick={() => {
                      setRange(item.value);
                      setPickOpen(item.value === "custom");
                      setRangeMenu(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </span>
            )}
            {pickOpen && (
              <DateRangeCalendarPopover
                anchorRef={rangeBoxRef}
                initialFrom={pickStart}
                initialTo={pickEnd}
                language={language}
                t={t}
                onApply={(from, to) => {
                  setPickStart(from);
                  setPickEnd(to);
                  setPickOpen(false);
                  loadPerf("custom", from, to);
                }}
                onCancel={() => {
                  setPickOpen(false);
                  if (!pickStart || !pickEnd) setRange("month");
                }}
              />
            )}
          </span>
        </div>
        <p className="py-range">{rangeLabel()}</p>
        {perfLoading ? (
          <div className="py-3"><div className="py-skel" /><div className="py-skel" /><div className="py-skel" /></div>
        ) : perfError ? (
          <div className="py-state">
            <b>{t("pySumFail")}</b>
            <button type="button" className="py-go" onClick={() => loadPerf(range, pickStart, pickEnd)}>{t("pyRetry")}</button>
          </div>
        ) : perfZero ? (
          <div className="py-state">
            <b>{t("pyNoPeriod")}</b>
            <p>{t("pyNoPeriodBody")}</p>
          </div>
        ) : (
          <div className="py-3">
            <div className="py-met py-met-rev"><small>{t("revenue") || t("pyFromBookings")}</small><b>{money(analytics.earnings)}</b><span>{t("pyFromBookings")}</span></div>
            <div className="py-met py-met-ded"><small>{t("pyDeductions")}</small><b>{money(analytics.deductions)}</b><span>{t("pyFeesRefunds")}</span></div>
            <div className="py-met py-met-net"><small>{t("pyNet")}</small><b>{money(analytics.netEarnings)}</b><span>{t("pyAfterDed")}</span></div>
          </div>
        )}
      </section>

      <section className="py-card">
        <div className="py-cardHead">
          <h2 className="py-h2">{t("pyRecent")}</h2>
          <span className="py-hint">{loading ? "…" : t("pyTxCount", { count: txs.length })}</span>
        </div>
        <div className="py-chips">
          {chips.map(([id, key]) => (
            <button key={id} type="button" className="py-chip" aria-selected={txKind === id ? "true" : "false"} onClick={() => setTxKind(id)}>
              {t(key)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="py-txlist"><div className="py-skel" style={{ height: 62 }} /><div className="py-skel" style={{ height: 62 }} /></div>
        ) : txs.length === 0 ? (
          <div className="py-state">
            <b>{txKind === "all" ? t("pyNoTx") : t("pyNoKind")}</b>
            <p>{txKind === "all" ? t("pyNoTxBody") : t("pyClearFilters")}</p>
            {txKind !== "all" && <button type="button" className="py-gh" onClick={() => setTxKind("all")}>{t("pyClear")}</button>}
          </div>
        ) : (
          <div className="py-txlist">
            {txs.map((item) => {
              const kind = kindOf(item);
              const status = statusOf(item);
              const negative = Number(item.amount) < 0;
              const color = kind === "refund" ? "#FF6B60" : negative ? "#d0d0d0" : "#36CEC2";
              return (
                <button type="button" className="py-tx" key={item._id} onClick={() => setTxOpen(item)}>
                  <span className={`py-txI is-${kind}`}>{negative ? "−" : "+"}</span>
                  <span className="py-txTxt">
                    <b>{TYPE_LABEL[item.type] || item.type}</b>
                    <i>{formatDescription(item.description) || TYPE_LABEL[item.type] || item.type}</i>
                  </span>
                  <span className="py-txAmt">
                    <b style={{ color }}>{money(item.amount)}</b>
                    {kind === "payout" ? (
                      <span
                        className={`py-pill ${
                          status === "paid" || status === "refunded"
                            ? "is-ok"
                            : status === "cancelled"
                            ? "is-bad"
                            : "is-wait"
                        }`}
                      >
                        {status === "paid"
                          ? t("pyPaid")
                          : status === "cancelled"
                          ? t("pyCancelled") || t("cancelled")
                          : status === "refunded"
                          ? t("pyRefunded") || t("refunded")
                          : t("pyWaiting")}
                      </span>
                    ) : (status === "pending" || status === "failed" || status === "cancelled") && (
                      <span className={`py-pill ${status === "pending" ? "is-wait" : "is-bad"}`}>
                        {status === "pending" ? t("pyWaiting") : t("pyCancelled") || t("pyFailed")}
                      </span>
                    )}
                    <i>{formatDate(item.createdAt)}</i>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {showPayoutModal && (
        <div className="py-scrim" onClick={(e) => { if (e.target === e.currentTarget) setShowPayoutModal(false); }}>
          <div className="py-sheet">
            <div className="py-sheetHead">
              <div><b>{t("pyWithdrawTitle")}</b><span>{t("pyWithdrawSub")}</span></div>
              <button type="button" className="py-x" aria-label={t("close")} onClick={() => setShowPayoutModal(false)}>×</button>
            </div>
            {wStage === "form" && (
              <>
                <div className="py-method">
                  <span className="py-methodI"><WalletIcon /></span>
                  <span className="py-methodTxt"><b>{t("pyCanWithdraw")}</b><i>{money(available)}</i></span>
                </div>
                <label className="py-f">
                  <span className="py-lb">{t("pyAmount")} <i>*</i></span>
                  <input className="py-in" inputMode="decimal" maxLength={12} value={payoutAmount} placeholder={t("pyAmountPh")} aria-invalid={amtErr ? "true" : "false"} onChange={(e) => { setPayoutAmount(e.target.value); setAmtErr(""); }} />
                  {amtErr ? <span className="py-er">{amtErr}</span> : null}
                  <span className="py-hint">{t("pyAmountHint", { min: minText, available: money(available) })}</span>
                </label>
                <div className="py-f">
                  <span className="py-lb">{t("pyMethod")} <i>*</i></span>
                  <div className="py-method">
                    <span className="py-methodI"><BankIcon /></span>
                    <span className="py-methodTxt"><b>{bank?.bankName || t("pyBank")}</b><i>{bankDetail}</i></span>
                  </div>
                  <button type="button" className="py-gh" onClick={() => setBankOpen(true)}>{t("pyChange")}</button>
                </div>
                <p className="py-info"><i className="py-infoI">i</i>{t("pyReviewNote")}</p>
                <div className="py-acts">
                  <button type="button" className="py-go" onClick={reviewWithdraw}>{t("pyWithdrawTitle")}</button>
                  <button type="button" className="py-gh" onClick={() => setShowPayoutModal(false)}>{t("cancel")}</button>
                </div>
              </>
            )}
            {wStage === "confirm" && (
              <>
                <div className="py-kv"><span>{t("pyAmount")}</span><span>{money(payoutAmount)}</span></div>
                <div className="py-kv"><span>{t("pyMethod")}</span><span>{bankDetail}</span></div>
                <div className="py-kv"><span>{t("pyWait")}</span><span>{t("pyWaitVal")}</span></div>
                <div className="py-kv"><span>{t("pyAfter")}</span><span>{money(Math.max(0, available - Number(payoutAmount || 0)))}</span></div>
                <p className="py-hint">{t("pyConfirmNote")}</p>
                <div className="py-acts">
                  <button type="button" className="py-go" disabled={payoutLoading} onClick={submitWithdraw}>{payoutLoading ? "…" : t("pyConfirm")}</button>
                  <button type="button" className="py-gh" onClick={() => setWStage("form")}>{t("cancel")}</button>
                </div>
              </>
            )}
            {wStage === "result" && (
              <>
                <div className="py-res">
                  <b>{t("pyReceived")}</b>
                  <p>{t("pyReceivedNote")}</p>
                </div>
                <div className="py-kv"><span>{t("pyAmountWord")}</span><span>{money(payoutAmount)}</span></div>
                <div className="py-kv"><span>{t("pyMethodWord")}</span><span>{bankDetail}</span></div>
                <div className="py-kv"><span>{t("pyRequestNo")}</span><span>{payoutResult?._id || "—"}</span></div>
                <button type="button" className="py-go" onClick={() => setShowPayoutModal(false)}>{t("pyDone")}</button>
              </>
            )}
          </div>
        </div>
      )}

      {bankOpen && (
        <div className="py-scrim" onClick={(e) => { if (e.target === e.currentTarget) setBankOpen(false); }}>
          <div className="py-sheet py-sheet-sm">
            <div className="py-sheetHead">
              <div><b>{t("pyChange")}</b><span>{t("pySoonSub")}</span></div>
              <button type="button" className="py-x" aria-label={t("close")} onClick={() => setBankOpen(false)}>×</button>
            </div>
            <div className="py-res is-muted"><b>{t("pySoon")}</b><p>{t("pySoonBody")}</p></div>
            <Link href="/Verifiedprofile" className="py-gh">{t("pyViewBank")}</Link>
            <button type="button" className="py-gh" onClick={() => setBankOpen(false)}>{t("close")}</button>
          </div>
        </div>
      )}

      {txOpen && (() => {
        const pInfo = getPayoutInfo(txOpen);
        const st = statusOf(txOpen);
        const stLabel =
          st === "pending"
            ? t("pyWaiting")
            : st === "cancelled"
            ? t("pyCancelled") || t("cancelled")
            : st === "refunded"
            ? t("pyRefunded") || t("refunded")
            : st === "failed"
            ? t("pyFailed")
            : t("pyPaid");
        return (
          <div className="py-scrim" onClick={(e) => { if (e.target === e.currentTarget) setTxOpen(null); }}>
            <div className="py-sheet py-sheet-sm">
              <div className="py-sheetHead">
                <div>
                  <b>{TYPE_LABEL[txOpen.type] || txOpen.type}</b>
                  <span>{formatDescription(txOpen.description)}</span>
                </div>
                <button type="button" className="py-x" aria-label={t("close")} onClick={() => setTxOpen(null)}>×</button>
              </div>
              <div className="py-kv"><span>{t("pyAmountWord")}</span><span>{money(txOpen.amount)}</span></div>
              <div className="py-kv"><span>{t("pyKind")}</span><span>{t(chips.find(([id]) => id === kindOf(txOpen))?.[1] || "pySale")}</span></div>
              <div className="py-kv">
                <span>{t("pyStatus")}</span>
                <span
                  className={`py-pill ${
                    st === "paid" || st === "refunded"
                      ? "is-ok"
                      : st === "cancelled" || st === "failed"
                      ? "is-bad"
                      : "is-wait"
                  }`}
                  style={{ marginTop: 0 }}
                >
                  {stLabel}
                </span>
              </div>
              {pInfo?.paymentReference ? (
                <div className="py-kv"><span>{t("payoutRefLabel")}</span><span>{pInfo.paymentReference}</span></div>
              ) : null}
              {pInfo?.adminNote ? (
                <div className="py-kv"><span>{t("reason") || "Note"}</span><span>{pInfo.adminNote}</span></div>
              ) : null}
              {pInfo?.paidAt ? (
                <div className="py-kv"><span>{t("pyPaid")}</span><span>{formatDate(pInfo.paidAt)}</span></div>
              ) : null}
              <div className="py-kv"><span>{t("pyDate")}</span><span>{formatDate(txOpen.createdAt)}</span></div>
              <p className="py-hint">{t("pyViewOnly")}</p>
              <button type="button" className="py-gh" onClick={() => setTxOpen(null)}>{t("close")}</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Page;
