"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PayNow from "@/components/Modal/PayNow";
import { useLanguage } from "@/context/LanguageContext";
import eventApi from "@/api/eventApi";
import courseApi from "@/api/courseApi";
import bookingApi from "@/api/bookingApi";
import toast from "react-hot-toast";
import { getFullImageUrl } from "@/utils/imageHelper";

function formatDateBilingual(dateStr, startTime, endTime, lang) {
  if (!dateStr) return lang === "mn" ? "Тун удахгүй" : "Coming soon";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return lang === "mn" ? "Тун удахгүй" : "Coming soon";

  const mnMonths = ["1-р", "2-р", "3-р", "4-р", "5-р", "6-р", "7-р", "8-р", "9-р", "10-р", "11-р", "12-р"];
  const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mnDays = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
  const enDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const m = d.getMonth();
  const dayNum = d.getDate();
  const dayName = lang === "mn" ? mnDays[d.getDay()] : enDays[d.getDay()];
  const monthName = lang === "mn" ? `${mnMonths[m]} сарын ${dayNum}` : `${enMonths[m]} ${dayNum}`;

  let timePart = "";
  if (startTime) {
    const s = String(startTime);
    const e = endTime ? String(endTime) : "";
    timePart = e ? ` · ${s} – ${e}` : ` · ${s}`;
  }

  return `${monthName}, ${dayName}${timePart}`;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");
  const courseId = searchParams.get("id") || searchParams.get("courseId");
  const scheduleId = searchParams.get("scheduleId");

  const [bookingItem, setBookingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState(null); // "EVENT" | "COURSE"

  // Ticket quantities: { [ticketId]: number }
  const [selectedTickets, setSelectedTickets] = useState({});
  const [qty, setQty] = useState(1);

  // Course batch & schedule selection
  const [selectedBatchId, setSelectedBatchId] = useState(scheduleId || "");
  const [selectedSlots, setSelectedSlots] = useState({});
  const [selectedPassType, setSelectedPassType] = useState("single");
  const [activeDayKey, setActiveDayKey] = useState("");

  // Promo code & Pricing breakdown
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState({
    basePrice: 0,
    taxes: 0,
    discount: 0,
    totalAmount: 0,
    promoApplied: false,
    promoMessage: null,
    appliedTaxes: [],
  });

  // Payment method & QPay
  const [selectedMethod, setSelectedMethod] = useState("qpay");
  const [transactionId, setTransactionId] = useState(null);
  const [qpayData, setQpayData] = useState(null);
  const [qpayPolling, setQpayPolling] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  const { t, language } = useLanguage();

  // Fetch Item (Event or Course)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (eventId) {
          const res = await eventApi.getEventDetails(eventId);
          if (res?.status && res?.data?.event) {
            const evt = res.data.event;
            setBookingType("EVENT");
            setBookingItem(evt);

            // Pre-seed tickets
            const initial = {};
            const isFree = evt.ticketPrice === 0 || evt.isFreeEvent;
            if (evt.tickets && evt.tickets.length > 0) {
              evt.tickets.forEach((tk, idx) => {
                initial[tk._id || idx] = isFree && idx === 0 ? 1 : 0;
              });
            }
            setSelectedTickets(initial);
          }
        } else if (courseId) {
          const res = await courseApi.getCourseDetails(courseId);
          if (res?.data) {
            const crs = res.data;
            setBookingType("COURSE");
            setBookingItem(crs);

            // Set active day for ongoing
            if (crs.weeklySchedule) {
              const keys = Object.keys(crs.weeklySchedule);
              if (keys.length > 0) setActiveDayKey(keys[0]);
            }

            // Set preselected batch
            if (scheduleId) {
              setSelectedBatchId(scheduleId);
            } else if (crs.batches && crs.batches.length > 0) {
              const firstAvail = crs.batches.find((b) => b.availableSeats > 0);
              if (firstAvail) setSelectedBatchId(firstAvail._id);
            }
          }
        }
      } catch (err) {
        console.error("Error loading item details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId || courseId) {
      fetchData();
    }
  }, [eventId, courseId, scheduleId]);

  // Set document title
  useEffect(() => {
    if (bookingItem?.eventTitle || bookingItem?.courseTitle || bookingItem?.title) {
      const name = bookingItem.eventTitle || bookingItem.courseTitle || bookingItem.title;
      document.title = `${name} · ${language === "mn" ? "Захиалга" : "Checkout"} · Bondy`;
    }
  }, [bookingItem, language]);

  // Calculate pricing breakdown via API
  const calculatePricing = useCallback(async () => {
    if (!bookingItem) return;
    try {
      if (bookingType === "EVENT") {
        const activeTickets = Object.entries(selectedTickets)
          .filter(([_, q]) => q > 0)
          .map(([ticketId, q]) => ({ ticketId, qty: q }));

        if (activeTickets.length === 0) {
          setPriceBreakdown({
            basePrice: 0,
            taxes: 0,
            discount: 0,
            totalAmount: 0,
            promoApplied: false,
            promoMessage: null,
            appliedTaxes: [],
          });
          return;
        }

        const payload = {
          tickets: activeTickets,
          discountCode: appliedPromoCode,
          bookingType: "EVENT",
          eventId: bookingItem._id,
        };

        const res = await bookingApi.calculateBooking(payload);
        if (res?.status && res?.data?.breakdown) {
          setPriceBreakdown({
            basePrice: res.data.breakdown.basePrice || 0,
            taxes: res.data.breakdown.taxAmount || 0,
            discount: res.data.breakdown.discountAmount || 0,
            totalAmount: res.data.breakdown.totalAmount || 0,
            promoApplied: res.data.breakdown.promoApplied || false,
            promoMessage: res.data.breakdown.promoMessage || null,
            appliedTaxes: res.data.appliedTaxes || [],
          });
        }
      } else if (bookingType === "COURSE") {
        let payload;
        if (bookingItem?.enrollmentType === "Ongoing") {
          const slots = selectedPassType === "single" ? Object.values(selectedSlots) : [];
          if (selectedPassType === "single" && slots.length === 0) {
            setPriceBreakdown({
              basePrice: 0,
              taxes: 0,
              discount: 0,
              totalAmount: 0,
              promoApplied: false,
              promoMessage: null,
              appliedTaxes: [],
            });
            return;
          }
          payload = {
            qty: qty,
            discountCode: appliedPromoCode,
            bookingType: "COURSE",
            courseId: bookingItem._id,
            ongoingSlots: slots,
            ...(selectedPassType !== "single" && { passType: selectedPassType }),
          };
        } else {
          if (!selectedBatchId) {
            setPriceBreakdown({
              basePrice: 0,
              taxes: 0,
              discount: 0,
              totalAmount: 0,
              promoApplied: false,
              promoMessage: null,
              appliedTaxes: [],
            });
            return;
          }
          payload = {
            qty: qty,
            discountCode: appliedPromoCode,
            bookingType: "COURSE",
            courseId: bookingItem._id,
            batchId: selectedBatchId,
          };
        }

        const res = await bookingApi.calculateBooking(payload);
        if (res?.status && res?.data?.breakdown) {
          setPriceBreakdown({
            basePrice: res.data.breakdown.basePrice || 0,
            taxes: res.data.breakdown.taxAmount || 0,
            discount: res.data.breakdown.discountAmount || 0,
            totalAmount: res.data.breakdown.totalAmount || 0,
            promoApplied: res.data.breakdown.promoApplied || false,
            promoMessage: res.data.breakdown.promoMessage || null,
            appliedTaxes: res.data.appliedTaxes || [],
          });
        }
      }
    } catch (err) {
      console.error("Calculate booking error:", err);
    }
  }, [bookingItem, bookingType, selectedTickets, appliedPromoCode, qty, selectedBatchId, selectedPassType, selectedSlots]);

  useEffect(() => {
    calculatePricing();
  }, [calculatePricing]);

  // Stepper handlers
  const handleTicketStep = (ticketId, delta, maxAvailable) => {
    setSelectedTickets((prev) => {
      const cur = prev[ticketId] || 0;
      const next = Math.max(0, Math.min(maxAvailable, cur + delta));
      return { ...prev, [ticketId]: next };
    });
  };

  // Promo code apply
  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      setAppliedPromoCode("");
      return;
    }
    setApplyingPromo(true);
    setAppliedPromoCode(code);
    setTimeout(() => {
      setApplyingPromo(false);
    }, 400);
  };

  // QPay Polling loop
  useEffect(() => {
    let intervalId;
    const POLL_TIMEOUT_MS = 300000; // 5 mins
    const startTime = Date.now();

    if (qpayPolling && transactionId) {
      intervalId = setInterval(async () => {
        if (Date.now() - startTime > POLL_TIMEOUT_MS) {
          setQpayPolling(false);
          clearInterval(intervalId);
          toast.error(language === "mn" ? "Төлбөр төлөх хугацаа дууслаа." : "Payment timed out.");
          return;
        }

        try {
          const res = await bookingApi.checkQpayStatus({
            transactionId: Array.isArray(transactionId) ? transactionId[0] : transactionId,
          });
          if (res?.status) {
            if (res.data?.status === "PAID") {
              setQpayPolling(false);
              setModalShow(true);
              clearInterval(intervalId);
            } else if (res.data?.status === "REFUND_INITIATED") {
              setQpayPolling(false);
              toast.error(language === "mn" ? "Төлбөр буцаагдлаа." : "Refund initiated.");
              clearInterval(intervalId);
            }
          }
        } catch (e) {
          console.error("QPay poll error:", e);
        }
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [qpayPolling, transactionId, language]);

  // Manual payment status check button
  const handleManualCheckPayment = async () => {
    if (!transactionId || checkingPayment) return;
    setCheckingPayment(true);
    try {
      const res = await bookingApi.checkQpayStatus({
        transactionId: Array.isArray(transactionId) ? transactionId[0] : transactionId,
      });
      if (res?.status && res.data?.status === "PAID") {
        setQpayPolling(false);
        setModalShow(true);
      } else {
        toast(language === "mn" ? "Төлбөр хүлээгдэж байна…" : "Waiting for payment confirmation…", { icon: "⏳" });
      }
    } catch (e) {
      console.error("Manual payment check error:", e);
    } finally {
      setCheckingPayment(false);
    }
  };

  // Checkout submission
  const handleCheckout = async () => {
    if (!bookingItem || payLoading) return;

    // Validation
    const isEvent = bookingType === "EVENT";
    let activeTickets = [];
    if (isEvent) {
      activeTickets = Object.entries(selectedTickets)
        .filter(([_, q]) => q > 0)
        .map(([ticketId, q]) => ({ ticketId, qty: q }));

      if (activeTickets.length === 0) {
        toast.error(language === "mn" ? "Тасалбараа сонгоно уу" : "Please select tickets");
        return;
      }
    } else {
      if (bookingItem?.enrollmentType === "Ongoing") {
        const slots = selectedPassType === "single" ? Object.values(selectedSlots) : [];
        if (selectedPassType === "single" && slots.length === 0) {
          toast.error(language === "mn" ? "Хуваариа сонгоно уу" : "Please select a schedule");
          return;
        }
      } else if (!selectedBatchId) {
        toast.error(language === "mn" ? "Ангиа сонгоно уу" : "Please select a schedule batch");
        return;
      }
    }

    setPayLoading(true);

    try {
      let payload;
      if (isEvent) {
        payload = {
          tickets: activeTickets,
          discountCode: appliedPromoCode,
          bookingType: "EVENT",
          eventId: bookingItem._id,
        };
      } else {
        payload = {
          qty: qty,
          discountCode: appliedPromoCode,
          bookingType: "COURSE",
          courseId: bookingItem._id,
          batchId: selectedBatchId,
          ...(bookingItem?.enrollmentType === "Ongoing" && {
            ongoingSlots: selectedPassType === "single" ? Object.values(selectedSlots) : [],
            passType: selectedPassType,
          }),
        };
      }

      // Initiate booking transaction
      const initRes = await bookingApi.initiateBooking(payload);
      if (!initRes?.status) {
        toast.error(initRes?.message || (language === "mn" ? "Захиалга үүсгэхэд алдаа гарлаа" : "Failed to initiate booking"));
        setPayLoading(false);
        return;
      }

      const txId = initRes.data?.transactionId;
      setTransactionId(txId);

      const isFree = priceBreakdown.totalAmount === 0;

      if (isFree) {
        // Free enrollment confirmation
        if (Array.isArray(txId)) {
          for (const subTx of txId) {
            await bookingApi.confirmPayment({ transactionId: subTx });
          }
        } else if (txId) {
          await bookingApi.confirmPayment({ transactionId: txId });
        }
        setModalShow(true);
        toast.success(language === "mn" ? "Бүртгэл амжилттай баталгаажлаа!" : "Registration confirmed!");
      } else {
        // QPay Payment Flow
        const qp = initRes.data?.qpay || initRes.data?.transaction?.qpayData;
        if (qp) {
          setQpayData(qp);
          setQpayPolling(true);
          toast.success(language === "mn" ? "QPay QR үүслээ. Банкны аппаараа уншуулна уу." : "QPay QR generated. Scan with your banking app.");
        } else {
          // If qpay object not directly in initiate, request initiateQpay
          try {
            const qpayRes = await bookingApi.initiateQpay({
              transactionId: Array.isArray(txId) ? txId[0] : txId,
            });
            if (qpayRes?.status && qpayRes?.data) {
              setQpayData(qpayRes.data);
              setQpayPolling(true);
            }
          } catch (qErr) {
            console.error("QPay initiate error:", qErr);
          }
        }
      }
    } catch (err) {
      console.error("Checkout submission failed:", err);
      toast.error(err?.response?.data?.message || (language === "mn" ? "Алдаа гарлаа. Дахин оролдоно уу." : "An error occurred. Please try again."));
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ width: "100%", background: "var(--bd-ink-900, #0D0D0D)", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span className="op-spin" style={{ width: 24, height: 24, borderWidth: 3 }} />
          <span>{language === "mn" ? "Уншиж байна…" : "Loading…"}</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!bookingItem) {
    return (
      <div style={{ width: "100%", background: "var(--bd-ink-900, #0D0D0D)", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <span style={{ fontSize: 18, color: "var(--bd-gray-400)" }}>
            {language === "mn" ? "Мэдээлэл олдсонгүй" : "Item not found"}
          </span>
          <Link
            href="/Explore"
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              background: "var(--acc)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {language === "mn" ? "Нүүр хуудас руу буцах" : "Back to Home"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isEvent = bookingType === "EVENT";
  const itemTitle = bookingItem.eventTitle || bookingItem.courseTitle || bookingItem.title || "";
  const rawPoster = Array.isArray(bookingItem.posterImage) ? bookingItem.posterImage[0] : bookingItem.posterImage;
  const posterUrl = rawPoster ? getFullImageUrl(rawPoster) : "/img/sidebar-logo.svg";
  const formattedDate = isEvent
    ? formatDateBilingual(bookingItem.startDate, bookingItem.startTime, bookingItem.endTime, language)
    : (bookingItem.currentSchedule ? `${bookingItem.currentSchedule.days?.join(", ") || ""} · ${bookingItem.currentSchedule.startTime || ""}` : (bookingItem.duration || ""));
  const venueText = bookingItem.venueName || (bookingItem.venueAddress?.city ? `${bookingItem.venueAddress.city}${bookingItem.venueAddress.address ? `, ${bookingItem.venueAddress.address}` : ""}` : (bookingItem.venueAddress?.address || "Улаанбаатар"));
  const backUrl = isEvent ? `/eventDetails?id=${bookingItem._id}` : `/programDetails?id=${bookingItem._id}`;

  const isFree = priceBreakdown.totalAmount === 0 && (isEvent ? Object.values(selectedTickets).some((q) => q > 0) : true);
  const totalQuantity = isEvent ? Object.values(selectedTickets).reduce((a, b) => a + b, 0) : qty;
  const canProceed = totalQuantity > 0;

  return (
    <div style={{ width: "100%", background: "var(--bd-ink-900, #0D0D0D)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Scoped CSS exactly matching Bondy Checkout.dc.html */}
      <style jsx global>{`
        :root {
          --acc: var(--bd-teal-500, #23ADA4);
          --acc-bright: var(--bd-teal-400, #36CEC2);
          --bd-font-ui: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .ck-opt {
          display: flex; align-items: center; gap: 14px; padding: 15px 16px;
          border-radius: 16px; background: var(--bd-ink-800, #1A1A1A);
          border: 1px solid var(--bd-border, rgba(255,255,255,.08));
          cursor: pointer; transition: border-color 200ms ease, background 200ms ease;
        }
        .ck-opt:hover { border-color: var(--bd-border-strong, #363636); }
        .ck-dot {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid var(--bd-gray-600, #979797);
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .ck-fill { width: 8px; height: 8px; border-radius: 50%; background: transparent; }

        .ck-mobbar { display: none; }
        .ck-paybar { display: none; }

        @media (max-width: 760px) {
          .ck-paybar {
            display: flex; align-items: center; justify-content: space-between; gap: 14px;
            position: fixed; left: 0; right: 0; bottom: 0; z-index: 70; box-sizing: border-box;
            padding: 11px 16px calc(11px + env(safe-area-inset-bottom, 0px));
            background: rgba(11, 11, 11, .95); backdrop-filter: blur(20px) saturate(140%);
            border-top: 1px solid var(--bd-border, rgba(255,255,255,.08));
            box-shadow: 0 -12px 30px rgba(0, 0, 0, .45);
          }
          .ck-paybar-l { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
          .ck-paybar-k { font-size: 11px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--bd-gray-600, #979797); }
          .ck-paybar-v { font-family: var(--bd-font-ui); font-size: 20px; font-weight: 700; letter-spacing: -.02em; color: var(--bd-white, #FFFFFF); }
          .ck-paybar-b {
            flex: 0 0 auto; width: 47%; max-width: 210px; height: 50px; padding: 0 20px; box-sizing: border-box;
            border: none; border-radius: 14px; background: var(--acc); color: #04211F;
            font-family: var(--bd-font-ui); font-size: 15px; font-weight: 700; cursor: pointer;
            transition: background 200ms ease, opacity 200ms ease;
          }
          .ck-paybar-b:disabled { background: var(--bd-ink-700, #222222); color: var(--bd-gray-600, #979797); cursor: not-allowed; }

          main[data-screen-label="Checkout"] { padding-bottom: 104px !important; }
          .bd-book { display: none !important; }
          main[data-screen-label="Checkout"] { padding-left: 16px !important; padding-right: 16px !important; padding-top: 0 !important; }
          main[data-screen-label="Checkout"] > nav.bd-crumb { display: none !important; }

          .ck-mobbar {
            display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 30;
            margin: 0 -16px 14px; padding: 12px 16px;
            background: rgba(11, 11, 11, .92); backdrop-filter: blur(20px) saturate(140%);
            border-bottom: 1px solid var(--bd-border-soft, rgba(255,255,255,.08));
          }
          .ck-mobback {
            display: inline-flex; align-items: center; justify-content: center;
            width: 38px; height: 38px; flex-shrink: 0; padding: 0;
            border: 1px solid var(--bd-border, rgba(255,255,255,.08));
            border-radius: 999px; background: var(--bd-ink-850, #161616);
            color: var(--bd-white, #FFFFFF); cursor: pointer; text-decoration: none;
          }
          .ck-mobbarT {
            flex: 1; min-width: 0; text-align: center; font-family: var(--bd-font-ui);
            font-size: 15.5px; font-weight: 700; color: var(--bd-white, #FFFFFF);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .ck-mobbar-sp { width: 38px; height: 38px; flex-shrink: 0; }
        }
      `}</style>

      {/* Main Header */}
      <Header />

      <main
        id="top"
        data-screen-label="Checkout"
        style={{
          maxWidth: 1224,
          margin: "0 auto",
          padding: "clamp(24px, 2.6vw, 32px) clamp(20px, 4vw, 32px) clamp(56px, 5vw, 80px)",
        }}
      >
        {/* Mobile Sticky Bar */}
        <div className="ck-mobbar">
          <Link href={backUrl} className="ck-mobback" aria-label="Буцах">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="ck-mobbarT">
            {isEvent ? (language === "mn" ? "Тасалбар сонгох" : "Select Tickets") : (language === "mn" ? "Төлбөр төлөх" : "Checkout")}
          </span>
          <span className="ck-mobbar-sp" />
        </div>

        {/* Breadcrumb Navigation */}
        <nav
          className="bd-crumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--bd-gray-600, #979797)",
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ color: "var(--bd-gray-600, #979797)", textDecoration: "none" }}>
            {language === "mn" ? "Нүүр" : "Home"}
          </Link>
          <span>/</span>
          <Link href={backUrl} style={{ color: "var(--bd-gray-600, #979797)", textDecoration: "none" }}>
            {isEvent ? (language === "mn" ? "Эвент" : "Events") : (language === "mn" ? "Сургалт" : "Courses")}
          </Link>
          <span>/</span>
          <span style={{ color: "var(--bd-gray-400, #BCC8C8)" }}>
            {language === "mn" ? "Захиалга" : "Checkout"}
          </span>
        </nav>

        {/* Page Title */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: "clamp(20px, 2.4vw, 28px)" }}>
          <h1
            className="bd-h1"
            style={{
              margin: 0,
              fontFamily: "var(--bd-font-ui)",
              fontSize: "clamp(28px, 3vw, 38px)",
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: "-.022em",
              color: "var(--bd-white, #FFFFFF)",
            }}
          >
            {isEvent ? (language === "mn" ? "Тасалбар сонгох" : "Select Tickets") : (language === "mn" ? "Төлбөр төлөх" : "Checkout")}
          </h1>
        </div>

        {/* Main Grid: Details (Left) + Sticky Summary (Right) */}
        <div
          className="bd-detail"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 372px",
            gap: "clamp(24px, 3vw, 40px)",
            alignItems: "start",
          }}
        >
          {/* ════ LEFT COLUMN ══════════════════════════════════════════════════ */}
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "clamp(20px, 2.2vw, 26px)" }}>

            {/* 1. Item Summary Card */}
            <section
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
                padding: 20,
                borderRadius: 20,
                background: "var(--bd-ink-850, #161616)",
                border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
              }}
            >
              <img
                src={posterUrl}
                alt={itemTitle}
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 16,
                  flexShrink: 0,
                  border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
                  objectFit: "cover",
                  background: "var(--bd-ink-800, #1A1A1A)",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/img/sidebar-logo.svg";
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, minWidth: 180 }}>
                <b style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.25, color: "var(--bd-white, #FFFFFF)" }}>
                  {itemTitle}
                </b>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 7, fontSize: 13.5, color: "var(--bd-gray-400, #BCC8C8)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--acc-bright)" }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formattedDate}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--acc-bright)" }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {venueText}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Selection / Tickets Card */}
            <section
              style={{
                padding: 20,
                borderRadius: 20,
                background: "var(--bd-ink-850, #161616)",
                border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, margin: "0 0 14px" }}>
                <h2 style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", color: "var(--bd-white, #FFFFFF)" }}>
                  {isEvent ? (language === "mn" ? "Тасалбар сонгох" : "Select Tickets") : (language === "mn" ? "Сонгосон анги" : "Select Schedule")}
                </h2>
              </div>

              {/* Event Ticket Tiers */}
              {isEvent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {bookingItem.tickets && bookingItem.tickets.length > 0 ? (
                    bookingItem.tickets.map((ticket, idx) => {
                      const tkId = ticket._id || idx;
                      const q = selectedTickets[tkId] || 0;
                      const totalSeats = ticket.qty || 0;
                      const available = ticket.availableQty !== undefined ? ticket.availableQty : totalSeats;
                      const isSoldOut = available <= 0;
                      const priceNum = Number(ticket.price) || 0;
                      const priceLabel = priceNum === 0 ? (language === "mn" ? "Үнэгүй" : "Free") : `₮${priceNum.toLocaleString()}`;
                      const isSelected = q > 0;

                      return (
                        <div
                          key={tkId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            flexWrap: "wrap",
                            padding: "15px 16px",
                            borderRadius: 16,
                            background: isSelected ? "rgba(35,173,164,.09)" : "var(--bd-ink-800, #1A1A1A)",
                            border: isSelected ? "1px solid var(--acc, #23ADA4)" : "1px solid var(--bd-border, rgba(255,255,255,.08))",
                            transition: "border-color 200ms ease, background 200ms ease",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 120 }}>
                            <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white, #FFFFFF)" }}>
                              {ticket.ticketName}
                            </b>
                            <span style={{ fontSize: 12.5, color: "var(--bd-gray-600, #979797)" }}>
                              {ticket.ticketShortDesc || (isSoldOut ? (language === "mn" ? "Дууссан" : "Sold out") : (language === "mn" ? "Суудал чөлөөтэй" : "Free seating"))}
                            </span>
                            {available > 0 && available <= 12 && (
                              <span style={{ fontSize: 12.5, color: "#FFA143", fontWeight: 600 }}>
                                {language === "mn" ? `Ердөө ${available} үлдлээ` : `Only ${available} left`}
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 9, flexShrink: 0, marginLeft: "auto" }}>
                            <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white, #FFFFFF)", whiteSpace: "nowrap" }}>
                              {priceLabel}
                            </b>

                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: 4, borderRadius: 999, background: "var(--bd-ink-850, #161616)", border: "1px solid var(--bd-border, rgba(255,255,255,.08))" }}>
                              <button
                                type="button"
                                onClick={() => handleTicketStep(tkId, -1, available)}
                                disabled={q <= 0}
                                aria-label="Decrease"
                                style={{
                                  width: 34,
                                  height: 34,
                                  border: "none",
                                  borderRadius: "50%",
                                  background: "transparent",
                                  color: "var(--bd-white)",
                                  fontSize: 18,
                                  lineHeight: 1,
                                  cursor: q > 0 ? "pointer" : "default",
                                  opacity: q > 0 ? 1 : 0.35,
                                }}
                              >
                                −
                              </button>
                              <b style={{ minWidth: 26, textAlign: "center", fontSize: 16, fontWeight: 700, color: "var(--bd-white)" }}>
                                {q}
                              </b>
                              <button
                                type="button"
                                onClick={() => handleTicketStep(tkId, 1, available)}
                                disabled={isSoldOut || q >= available}
                                aria-label="Increase"
                                style={{
                                  width: 34,
                                  height: 34,
                                  border: "none",
                                  borderRadius: "50%",
                                  background: "transparent",
                                  color: "var(--acc-bright)",
                                  fontSize: 18,
                                  lineHeight: 1,
                                  cursor: !isSoldOut && q < available ? "pointer" : "default",
                                  opacity: !isSoldOut && q < available ? 1 : 0.35,
                                }}
                              >
                                +
                              </button>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: "16px", borderRadius: 16, background: "var(--bd-ink-800)", textAlign: "center", color: "var(--bd-gray-400)" }}>
                      {language === "mn" ? "Энгийн тасалбар захиалга" : "General admission"}
                    </div>
                  )}
                </div>
              )}

              {/* Course Batch / Passes Options */}
              {!isEvent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {bookingItem.batches && bookingItem.batches.length > 0 ? (
                    bookingItem.batches.map((batch) => {
                      const isSelected = selectedBatchId === batch._id;
                      const isFull = batch.availableSeats <= 0;
                      return (
                        <div
                          key={batch._id}
                          className="ck-opt"
                          onClick={() => {
                            if (!isFull) setSelectedBatchId(batch._id);
                          }}
                          style={{
                            borderColor: isSelected ? "var(--acc)" : "var(--bd-border)",
                            background: isSelected ? "rgba(35,173,164,.09)" : "var(--bd-ink-800)",
                            opacity: isFull ? 0.5 : 1,
                            cursor: isFull ? "not-allowed" : "pointer",
                          }}
                        >
                          <span
                            className="ck-dot"
                            style={{
                              borderColor: isSelected ? "var(--acc)" : "var(--bd-gray-600)",
                            }}
                          >
                            <span
                              className="ck-fill"
                              style={{ background: isSelected ? "var(--acc)" : "transparent" }}
                            />
                          </span>
                          <span className="ck-txt">
                            <b className="ck-name">{batch.batchName || "Schedule"}</b>
                            <span className="ck-sub">
                              {batch.days?.join(", ")} · {batch.startTime} – {batch.endTime}
                            </span>
                          </span>
                          <b style={{ fontSize: 13, color: isFull ? "#FF5A5A" : "var(--acc-bright)" }}>
                            {isFull
                              ? (language === "mn" ? "Дүүрсэн" : "Full")
                              : (language === "mn" ? `${batch.availableSeats} суудал үлдсэн` : `${batch.availableSeats} seats left`)}
                          </b>
                        </div>
                      );
                    })
                  ) : (
                    <div className="ck-opt" style={{ borderColor: "var(--acc)", background: "rgba(35,173,164,.09)" }}>
                      <span className="ck-dot" style={{ borderColor: "var(--acc)" }}>
                        <span className="ck-fill" style={{ background: "var(--acc)" }} />
                      </span>
                      <span className="ck-txt">
                        <b className="ck-name">{bookingItem.courseTitle}</b>
                        <span className="ck-sub">{bookingItem.duration || ""}</span>
                      </span>
                      <b className="ck-price">
                        {bookingItem.price === 0 ? (language === "mn" ? "Үнэгүй" : "Free") : `₮${(bookingItem.price || 0).toLocaleString()}`}
                      </b>
                    </div>
                  )}

                  {/* Course Quantity Stepper */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--bd-border-soft, rgba(255,255,255,.08))" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>
                      {language === "mn" ? "Оролцогчийн тоо" : "Participants"}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: 4, borderRadius: 999, background: "var(--bd-ink-800)", border: "1px solid var(--bd-border)" }}>
                      <button
                        type="button"
                        onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                        disabled={qty <= 1}
                        style={{ width: 34, height: 34, border: "none", borderRadius: "50%", background: "transparent", color: "#fff", fontSize: 18, cursor: qty > 1 ? "pointer" : "default", opacity: qty > 1 ? 1 : 0.35 }}
                      >
                        −
                      </button>
                      <b style={{ minWidth: 26, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                        {qty}
                      </b>
                      <button
                        type="button"
                        onClick={() => setQty((prev) => prev + 1)}
                        style={{ width: 34, height: 34, border: "none", borderRadius: "50%", background: "transparent", color: "var(--acc-bright)", fontSize: 18, cursor: "pointer" }}
                      >
                        +
                      </button>
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Coupon Code Section */}
            <section
              style={{
                padding: 20,
                borderRadius: 20,
                background: "var(--bd-ink-850, #161616)",
                border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
              }}
            >
              <h2 style={{ margin: "0 0 14px", fontFamily: "var(--bd-font-ui)", fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", color: "var(--bd-white, #FFFFFF)" }}>
                {isEvent ? (language === "mn" ? "Купон код" : "Coupon code") : (language === "mn" ? "Промо код" : "Promo code")}
              </h2>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                    minWidth: 200,
                    height: 48,
                    padding: "0 16px",
                    borderRadius: 14,
                    background: "var(--bd-ink-800, #1A1A1A)",
                    border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
                    cursor: "text",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--acc-bright)" }}>
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                    <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
                  </svg>
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="BONDY10"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "var(--bd-white)",
                      fontFamily: "var(--bd-font-ui)",
                      fontSize: 15,
                      textTransform: "uppercase",
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={applyingPromo}
                  style={{
                    height: 48,
                    padding: "0 22px",
                    borderRadius: 999,
                    border: "1px solid var(--bd-border-strong, #363636)",
                    background: "transparent",
                    color: "var(--bd-white)",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "border-color 200ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bd-border-strong)")}
                >
                  {applyingPromo
                    ? (language === "mn" ? "Шалгаж байна…" : "Checking…")
                    : (language === "mn" ? "Ашиглах" : "Apply")}
                </button>
              </div>

              {priceBreakdown.promoMessage && (
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 13,
                    color: priceBreakdown.promoApplied ? "var(--acc-bright)" : "#FF5A5A",
                    fontWeight: 600,
                  }}
                >
                  {priceBreakdown.promoMessage}
                </p>
              )}
            </section>

            {/* 4. Payment Method Section (Shown when price > 0) */}
            {!isFree && (
              <section
                style={{
                  padding: 20,
                  borderRadius: 20,
                  background: "var(--bd-ink-850, #161616)",
                  border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
                }}
              >
                <h2 style={{ margin: "0 0 14px", fontFamily: "var(--bd-font-ui)", fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", color: "var(--bd-white, #FFFFFF)" }}>
                  {language === "mn" ? "Төлбөрийн хэлбэр" : "Payment Method"}
                </h2>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "15px 16px",
                    borderRadius: 16,
                    background: "var(--bd-ink-800, #1A1A1A)",
                    border: "1px solid var(--acc, #23ADA4)",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedMethod("qpay")}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      borderRadius: 12,
                      background: "rgba(35, 173, 164, .13)",
                      color: "var(--acc-bright)",
                    }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 15, fontWeight: 700, color: "var(--bd-white)" }}>QPay</b>
                    <span style={{ fontSize: 12.5, color: "var(--bd-gray-600)" }}>
                      {language === "mn" ? "Банкны аппаараа QR уншуулж төлнө" : "Scan QR code via your banking app"}
                    </span>
                  </div>
                </div>

                {/* Live QPay QR Code Display */}
                {qpayData && (
                  <div
                    style={{
                      marginTop: 18,
                      padding: 20,
                      borderRadius: 18,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      textAlign: "center",
                    }}
                  >
                    <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--bd-white)" }}>
                      {language === "mn" ? "QPay QR уншуулах" : "Scan QPay QR"}
                    </h4>
                    <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--bd-gray-400)" }}>
                      {language === "mn" ? "Банкны аппликейшнээрээ доорх QR кодыг уншуулж төлбөрөө төлнө үү" : "Open your banking app and scan the QR code to complete payment"}
                    </p>

                    {/* QR Image */}
                    {qpayData.qr_image && (
                      <div
                        style={{
                          display: "inline-block",
                          padding: 12,
                          background: "#fff",
                          borderRadius: 14,
                          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                          marginBottom: 14,
                        }}
                      >
                        <img
                          src={`data:image/png;base64,${qpayData.qr_image}`}
                          alt="QPay QR"
                          style={{ width: 200, height: 200, display: "block" }}
                        />
                      </div>
                    )}

                    {/* Polling status */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                      <span className="op-spin" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      <span style={{ fontSize: 13, color: "var(--acc-bright)", fontWeight: 600 }}>
                        {language === "mn" ? "Төлбөр хүлээгдэж байна…" : "Waiting for payment confirmation…"}
                      </span>
                    </div>

                    {/* Manual Check Button */}
                    <button
                      type="button"
                      onClick={handleManualCheckPayment}
                      disabled={checkingPayment}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 999,
                        background: "#FF8A33",
                        border: "none",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {checkingPayment
                        ? (language === "mn" ? "Шалгаж байна…" : "Checking…")
                        : (language === "mn" ? "Төлбөр шалгах" : "Check Status")}
                    </button>

                    {/* 23 Banking Apps Links */}
                    {qpayData.urls && qpayData.urls.length > 0 && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--bd-border-soft, rgba(255,255,255,.08))" }}>
                        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--bd-gray-400)", marginBottom: 10 }}>
                          {language === "mn" ? "Банкны аппууд (23 Банк):" : "Supported Banking Apps:"}
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxHeight: 180, overflowY: "auto" }}>
                          {qpayData.urls.map((bank, idx) => (
                            <a
                              key={idx}
                              href={bank.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: 10,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                fontSize: 12,
                                textDecoration: "none",
                              }}
                            >
                              {bank.logo && (
                                <img
                                  src={bank.logo}
                                  alt=""
                                  style={{ width: 18, height: 18, borderRadius: 4, objectFit: "contain" }}
                                />
                              )}
                              <span>{bank.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ════ RIGHT COLUMN: STICKY BREAKDOWN SIDEBAR ═══════════════════════ */}
          <aside
            className="bd-book"
            style={{
              position: "sticky",
              top: 88,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: 22,
              borderRadius: 24,
              background: "var(--bd-ink-850, #161616)",
              border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
              boxShadow: "0 24px 60px rgba(0,0,0,.32)",
            }}
          >
            <h2 style={{ margin: 0, fontFamily: "var(--bd-font-ui)", fontSize: 19, fontWeight: 700, color: "var(--bd-white, #FFFFFF)" }}>
              {language === "mn" ? "Төлбөрийн задаргаа" : "Price breakdown"}
            </h2>

            {/* Line Items */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {isEvent ? (
                Object.entries(selectedTickets).filter(([_, q]) => q > 0).length > 0 ? (
                  Object.entries(selectedTickets).filter(([_, q]) => q > 0).map(([tkId, q]) => {
                    const tk = bookingItem.tickets?.find((t, i) => (t._id || i) === tkId);
                    const tkName = tk ? tk.ticketName : (language === "mn" ? "Тасалбар" : "Ticket");
                    const price = tk ? (Number(tk.price) || 0) : 0;
                    return (
                      <div
                        key={tkId}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: 16,
                          padding: "11px 0",
                          borderBottom: "1px solid var(--bd-border-soft, rgba(255,255,255,.08))",
                        }}
                      >
                        <span style={{ fontSize: 14, color: "var(--bd-gray-400)" }}>
                          {q} × {tkName}
                        </span>
                        <b style={{ fontSize: 14, fontWeight: 700, color: "var(--bd-white)" }}>
                          {price === 0 ? (language === "mn" ? "Үнэгүй" : "Free") : `₮${(price * q).toLocaleString()}`}
                        </b>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "11px 0",
                      borderBottom: "1px solid var(--bd-border-soft, rgba(255,255,255,.08))",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "var(--bd-gray-500)" }}>
                      {language === "mn" ? "Тасалбар сонгоогүй" : "No tickets selected"}
                    </span>
                    <b style={{ fontSize: 14, fontWeight: 700, color: "var(--bd-white)" }}>₮0</b>
                  </div>
                )
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "11px 0",
                    borderBottom: "1px solid var(--bd-border-soft, rgba(255,255,255,.08))",
                  }}
                >
                  <span style={{ fontSize: 14, color: "var(--bd-gray-400)" }}>
                    {qty} × {bookingItem.courseTitle || (language === "mn" ? "Сургалт" : "Course")}
                  </span>
                  <b style={{ fontSize: 14, fontWeight: 700, color: "var(--bd-white)" }}>
                    {priceBreakdown.basePrice === 0 ? (language === "mn" ? "Үнэгүй" : "Free") : `₮${priceBreakdown.basePrice.toLocaleString()}`}
                  </b>
                </div>
              )}

              {/* Service Charge / Taxes */}
              {priceBreakdown.taxes > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "11px 0",
                    borderBottom: "1px solid var(--bd-border-soft, rgba(255,255,255,.08))",
                  }}
                >
                  <span style={{ fontSize: 14, color: "var(--bd-gray-400)" }}>
                    {language === "mn" ? "Үйлчилгээний шимтгэл" : "Service charge"}
                  </span>
                  <b style={{ fontSize: 14, fontWeight: 700, color: "var(--bd-white)" }}>
                    ₮{priceBreakdown.taxes.toLocaleString()}
                  </b>
                </div>
              )}

              {/* Discount Row */}
              {priceBreakdown.discount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "11px 0",
                    borderBottom: "1px solid var(--bd-border-soft, rgba(255,255,255,.08))",
                  }}
                >
                  <span style={{ fontSize: 14, color: "var(--acc-bright)" }}>
                    {language === "mn" ? "Хөнгөлөлт" : "Discount"}
                  </span>
                  <b style={{ fontSize: 14, fontWeight: 700, color: "var(--acc-bright)" }}>
                    −₮{priceBreakdown.discount.toLocaleString()}
                  </b>
                </div>
              )}
            </div>

            {/* Total Row */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
              <span style={{ fontSize: 15, color: "var(--bd-gray-300)" }}>
                {language === "mn" ? "Нийт" : "Total"}
              </span>
              <b style={{ fontFamily: "var(--bd-font-ui)", fontSize: 28, fontWeight: 700, letterSpacing: "-.02em", color: "var(--bd-white)" }}>
                {isFree ? (language === "mn" ? "Үнэгүй" : "Free") : `₮${priceBreakdown.totalAmount.toLocaleString()}`}
              </b>
            </div>

            <p style={{ margin: 0, fontSize: 12.5, color: "var(--bd-gray-500)" }}>
              {language === "mn" ? "НӨАТ багтсан болно." : "VAT included."}
            </p>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!canProceed || payLoading}
              style={{
                width: "100%",
                height: 48,
                marginTop: 6,
                border: "none",
                borderRadius: 14,
                background: canProceed ? "var(--acc)" : "var(--bd-ink-700)",
                color: canProceed ? "#04211F" : "var(--bd-gray-600)",
                fontFamily: "var(--bd-font-ui)",
                fontSize: 15.5,
                fontWeight: 700,
                letterSpacing: "-.01em",
                cursor: canProceed && !payLoading ? "pointer" : "not-allowed",
                transition: "background 200ms ease, opacity 200ms ease",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {payLoading ? (
                <>
                  <span className="op-spin" style={{ width: 16, height: 16 }} />
                  <span>{language === "mn" ? "Боловсруулж байна…" : "Processing…"}</span>
                </>
              ) : isFree ? (
                language === "mn" ? "Үнэгүй бүртгэлээ баталгаажуулах" : "Confirm Free Registration"
              ) : canProceed ? (
                language === "mn" ? `₮${priceBreakdown.totalAmount.toLocaleString()} төлөх` : `Pay ₮${priceBreakdown.totalAmount.toLocaleString()}`
              ) : (
                language === "mn" ? "Тасалбар сонгоно уу" : "Select Tickets"
              )}
            </button>

            <p style={{ margin: "2px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--bd-gray-600)" }}>
              {language === "mn"
                ? "Төлбөр баталгаажмагц тасалбар «Миний захиалга» хэсэгт үүснэ."
                : "Your ticket will be available in 'My Tickets' upon confirmation."}
            </p>
          </aside>
        </div>

        {/* Mobile Persistent Bottom Payment Bar */}
        <div className="ck-paybar">
          <div className="ck-paybar-l">
            <span className="ck-paybar-k">{language === "mn" ? "Нийт" : "Total"}</span>
            <b className="ck-paybar-v">
              {isFree ? (language === "mn" ? "Үнэгүй" : "Free") : `₮${priceBreakdown.totalAmount.toLocaleString()}`}
            </b>
          </div>
          <button
            type="button"
            className="ck-paybar-b"
            onClick={handleCheckout}
            disabled={!canProceed || payLoading}
          >
            {payLoading ? (
              <span className="op-spin" style={{ width: 16, height: 16 }} />
            ) : isFree ? (
              language === "mn" ? "Үнэгүй бүртгүүлэх" : "Register Free"
            ) : canProceed ? (
              language === "mn" ? `₮${priceBreakdown.totalAmount.toLocaleString()} төлөх` : `Pay ₮${priceBreakdown.totalAmount.toLocaleString()}`
            ) : (
              language === "mn" ? "Сонгох" : "Select"
            )}
          </button>
        </div>
      </main>

      {/* Confirmation Success Modal */}
      <PayNow show={modalShow} onHide={() => setModalShow(false)} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ width: "100%", minHeight: "100vh", background: "var(--bd-ink-900, #0D0D0D)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading…
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
