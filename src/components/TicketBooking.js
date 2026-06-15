"use client";
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import EventTicketscart from "./EventTicketscart";
import PayNow from "./Modal/PayNow";
import bookingApi from "@/api/bookingApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";


export default function TicketBooking({ item, type, scheduleId }) {
    const [step, setStep] = useState(1); // 1: Tickets, 2: Payment, 3: Review
    const [selectedTickets, setSelectedTickets] = useState({});
    const [qty, setQty] = useState(type === "EVENT" ? 0 : 1);
    const [selectedMethod, setSelectedMethod] = useState("card");
    const [modalShow, setModalShow] = useState(false);
    const [loading, setLoading] = useState(false);

    // Selected batch state for fixedStart courses
    const [selectedBatchId, setSelectedBatchId] = useState(scheduleId || "");
    // Per-day selection for Ongoing courses: { Mon: "batchId", Wed: "batchId2" }
    const [selectedSlots, setSelectedSlots] = useState({});
    // State for selected pass type: "single", "1_month", "3_month"
    const [selectedPassType, setSelectedPassType] = useState("single");

    // New state for price breakdown
    const [priceBreakdown, setPriceBreakdown] = useState({
        basePrice: 0,
        taxes: 0,
        discount: 0,
        totalAmount: 0,
        promoApplied: false,
        promoMessage: null,
    });

    const [promoCode, setPromoCode] = useState(""); // Input value
    const [appliedPromoCode, setAppliedPromoCode] = useState(""); // Validated/Applied value
    const [transactionId, setTransactionId] = useState(null); // Store initiated transaction ID (can be array for events)

    const { t, language } = useLanguage();

    // Auto-select preselected batch or first available batch
    useEffect(() => {
        if (item && type === "COURSE" && item.batches) {
            const preselected = item.batches.find(b => b._id === scheduleId);
            if (preselected) {
                if (preselected.availableSeats > 0) {
                    setSelectedBatchId(scheduleId);
                } else {
                    toast.error(t("selectedBatchFull") || "Selected batch is full. Please choose another.");
                    setSelectedBatchId("");
                }
            } else if (item.batches.length === 1 && item.batches[0].availableSeats > 0) {
                setSelectedBatchId(item.batches[0]._id);
            }
        }
    }, [item, type, scheduleId, t]);

    const formatPrice = (amount) => {
        if (amount == null || amount === undefined) return t("priceNotAvailable") || "N/A";
        try {
            const locale = language === "mn" ? "mn-MN" : "en-US";
            const formatted = new Intl.NumberFormat(locale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).format(amount);
            return `₮${formatted}`;
        } catch (e) {
            return `₮${amount}`;
        }
    };

    // Pre-populate ticket selections when event is loaded
    useEffect(() => {
        if (item && type === "EVENT" && item.original?.tickets) {
            const initial = {};
            item.original.tickets.forEach(ticket => {
                initial[ticket._id] = 0;
            });
            setSelectedTickets(initial);
        }
    }, [item, type]);

    // Calculate booking details when qty, selectedTickets or appliedPromoCode changes
    useEffect(() => {
        const fetchBreakdown = async () => {
            if (!item) return;
            try {
                if (type === "EVENT") {
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
                        });
                        return;
                    }

                    const payload = {
                        tickets: activeTickets,
                        discountCode: appliedPromoCode,
                        bookingType: "EVENT",
                        eventId: item._id,
                    };
                    const res = await bookingApi.calculateBooking(payload);
                    if (res?.status) {
                        setPriceBreakdown({
                            basePrice: res.data.breakdown.basePrice,
                            taxes: res.data.breakdown.taxAmount,
                            discount: res.data.breakdown.discountAmount,
                            totalAmount: res.data.breakdown.totalAmount,
                            promoApplied: res.data.breakdown.promoApplied,
                            promoMessage: res.data.breakdown.promoMessage,
                        });
                    }
                } else if (type === "COURSE") {
                    let payload;
                    if (item?.enrollmentType === "Ongoing") {
                        const slots = Object.entries(selectedSlots).map(([day, batchId]) => ({
                            batchId,
                            selectedDay: day,
                        }));
                        if (selectedPassType === "single" && slots.length === 0) {
                            setPriceBreakdown({
                                basePrice: 0, taxes: 0, discount: 0, totalAmount: 0,
                                promoApplied: false, promoMessage: null,
                            });
                            return;
                        }
                        payload = {
                            qty: qty,
                            discountCode: appliedPromoCode,
                            bookingType: type,
                            courseId: item._id,
                            ongoingSlots: slots,
                            ...(selectedPassType !== "single" && { passType: selectedPassType }),
                        };
                    } else {
                        if (!selectedBatchId) {
                            setPriceBreakdown({
                                basePrice: 0, taxes: 0, discount: 0, totalAmount: 0,
                                promoApplied: false, promoMessage: null,
                            });
                            return;
                        }
                        payload = {
                            qty: qty,
                            discountCode: appliedPromoCode,
                            bookingType: type,
                            courseId: item._id,
                            batchId: selectedBatchId,
                        };
                    }

                    const res = await bookingApi.calculateBooking(payload);
                    console.log("Booking breakdown response:", res);

                    if (res?.status) {
                        setPriceBreakdown({
                            basePrice: res?.data?.breakdown?.basePrice,
                            taxes: res?.data?.breakdown?.taxAmount,
                            discount: res?.data?.breakdown?.discountAmount,
                            totalAmount: res?.data?.breakdown?.totalAmount,
                            promoMessage: res?.data?.breakdown?.promoMessage || null,
                            promoApplied: res?.data?.breakdown?.promoApplied || false,
                        });
                    }
                }
            } catch (error) {
                console.error("Error calculating booking price:", error);
            }
        };

        fetchBreakdown();
    }, [item, qty, selectedTickets, appliedPromoCode, type, selectedBatchId, selectedSlots, selectedPassType]);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            toast.error(t("pleaseEnterPromo"));
            return;
        }

        try {
            if (type === "EVENT") {
                const activeTickets = Object.entries(selectedTickets)
                    .filter(([_, q]) => q > 0)
                    .map(([ticketId, q]) => ({ ticketId, qty: q }));
                if (activeTickets.length === 0) {
                    toast.error(t("pleaseSelectTickets") || "Please select at least one ticket first");
                    return;
                }

                const payload = {
                    tickets: activeTickets,
                    discountCode: promoCode,
                    bookingType: "EVENT",
                    eventId: item._id,
                };
                const res = await bookingApi.calculateBooking(payload);
                if (res?.status) {
                    setPriceBreakdown({
                        basePrice: res.data.breakdown.basePrice,
                        taxes: res.data.breakdown.taxAmount,
                        discount: res.data.breakdown.discountAmount,
                        totalAmount: res.data.breakdown.totalAmount,
                        promoApplied: res.data.breakdown.promoApplied,
                        promoMessage: res.data.breakdown.promoMessage,
                    });

                    if (res.data.breakdown.promoApplied) {
                        setAppliedPromoCode(promoCode);
                        toast.success(res.data.breakdown.promoMessage || t("promoApplied"));
                    } else {
                        setAppliedPromoCode("");
                        toast.error(res.data.breakdown.promoMessage || t("invalidPromo"));
                    }
                }
            } else if (type === "COURSE") {
                let payload;
                if (item?.enrollmentType === "Ongoing") {
                    const slots = Object.entries(selectedSlots).map(([day, batchId]) => ({
                        batchId,
                        selectedDay: day,
                    }));
                    if (selectedPassType === "single" && slots.length === 0) {
                        toast.error(t("pleaseSelectBatchFirst") || "Please select at least one schedule first");
                        return;
                    }
                    payload = {
                        qty: qty,
                        discountCode: promoCode,
                        bookingType: type,
                        courseId: item._id,
                        ongoingSlots: slots,
                        ...(selectedPassType !== "single" && { passType: selectedPassType }),
                    };
                } else {
                    if (!selectedBatchId) {
                        toast.error(t("pleaseSelectBatchFirst") || "Please select a batch/schedule first");
                        return;
                    }
                    payload = {
                        qty: qty,
                        discountCode: promoCode,
                        bookingType: type,
                        courseId: item._id,
                        batchId: selectedBatchId,
                    };
                }

                const res = await bookingApi.calculateBooking(payload);

                if (res.status) {
                    setPriceBreakdown({
                        basePrice: res?.data?.breakdown?.basePrice,
                        taxes: res?.data?.breakdown?.taxAmount,
                        discount: res?.data?.breakdown?.discountAmount,
                        totalAmount: res?.data?.breakdown?.totalAmount,
                        promoMessage: res?.data?.breakdown?.promoMessage || null,
                        promoApplied: res?.data?.breakdown?.promoApplied || false,
                    });

                    if (res?.data?.breakdown?.promoApplied) {
                        setAppliedPromoCode(promoCode);
                        toast.success(res?.data?.breakdown?.promoMessage || t("promoApplied"));
                    } else {
                        setAppliedPromoCode("");
                        toast.error(res?.data?.breakdown?.promoMessage || t("invalidPromo"));
                    }
                } else {
                    toast.error(res?.message || t("invalidPromo"));
                    setAppliedPromoCode("");
                    setPriceBreakdown((prev) => ({
                        ...prev,
                        promoApplied: false,
                        promoMessage: res?.message || t("invalidPromo"),
                    }));
                }
            }
        } catch (error) {
            console.error("Promo code error:", error);
            const msg = error?.response?.data?.message || t("invalidPromo");
            toast.error(msg);
            setAppliedPromoCode("");
            setPriceBreakdown((prev) => ({
                ...prev,
                promoApplied: false,
                promoMessage: msg,
            }));
        }
    };

    // Step 2 -> Step 3: Initiate Booking
    const handleInitiateBooking = async () => {
        if (!item) return;
        setLoading(true);
        try {
            if (type === "EVENT") {
                const activeTickets = Object.entries(selectedTickets)
                    .filter(([_, q]) => q > 0)
                    .map(([ticketId, q]) => ({ ticketId, qty: q }));
                if (activeTickets.length === 0) {
                    toast.error(t("pleaseSelectTickets") || "Please select at least one ticket");
                    setLoading(false);
                    return;
                }

                const payload = {
                    tickets: activeTickets,
                    discountCode: appliedPromoCode,
                    bookingType: "EVENT",
                    eventId: item._id,
                };
                const initResponse = await bookingApi.initiateBooking(payload);
                if (initResponse.status) {
                    setTransactionId(initResponse.data.transactionId);
                    if (initResponse.data.transaction?.status === "PAID") {
                        setModalShow(true);
                        toast.success(t("bookingConfirmed") || "Booking confirmed successfully!");
                    } else {
                        setStep(3);
                        toast.success(t("bookingInitiated"));
                    }
                } else {
                    toast.error(initResponse.message || t("bookingInitiationFailed"));
                }
            } else if (type === "COURSE") {
                if (item?.enrollmentType === "Ongoing") {
                    const slotEntries = Object.entries(selectedSlots);
                    if (selectedPassType === "single" && slotEntries.length === 0) {
                        toast.error(t("pleaseSelectBatchFirst") || "Please select at least one schedule");
                        setLoading(false);
                        return;
                    }
                    const ongoingSlots = slotEntries.map(([day, batchId]) => ({
                        batchId,
                        selectedDay: day,
                    }));
                    const payload = {
                        qty: qty,
                        discountCode: appliedPromoCode,
                        bookingType: type,
                        courseId: item._id,
                        ongoingSlots,
                        ...(selectedPassType !== "single" && { passType: selectedPassType }),
                    };
                    const initResponse = await bookingApi.initiateBooking(payload);
                    if (initResponse.status) {
                        setTransactionId(initResponse.data.transactionId);
                        if (initResponse.data.transaction?.status === "PAID") {
                            setModalShow(true);
                            toast.success(t("bookingConfirmed") || "Booking confirmed successfully!");
                        } else {
                            setStep(3);
                            toast.success(t("bookingInitiated"));
                        }
                    } else {
                        toast.error(initResponse.message || t("bookingInitiationFailed"));
                    }
                } else {
                    if (!selectedBatchId) {
                        toast.error(t("pleaseSelectBatchFirst") || "Please select a batch/schedule first");
                        setLoading(false);
                        return;
                    }
                    const payload = {
                        qty: qty,
                        discountCode: appliedPromoCode,
                        bookingType: type,
                        courseId: item._id,
                        batchId: selectedBatchId,
                    };
                    const initResponse = await bookingApi.initiateBooking(payload);
                    if (initResponse.status) {
                        setTransactionId(initResponse.data.transactionId);
                        if (initResponse.data.transaction?.status === "PAID") {
                            setModalShow(true);
                            toast.success(t("bookingConfirmed") || "Booking confirmed successfully!");
                        } else {
                            setStep(3);
                            toast.success(t("bookingInitiated"));
                        }
                    } else {
                        toast.error(initResponse.message || t("bookingInitiationFailed"));
                    }
                }
            }
        } catch (error) {
            console.error("Initiate booking error:", error);
            toast.error(error.message || t("failedToInitiateBooking"));
        } finally {
            setLoading(false);
        }
    };

    // Step 3 -> Finish: Confirm Payment
    const handleConfirmBooking = async () => {
        if (!transactionId) {
            toast.error(t("noBookingToConfirm"));
            return;
        }
        setLoading(true);
        try {
            if (Array.isArray(transactionId)) {
                for (const txId of transactionId) {
                    const confirmResponse = await bookingApi.confirmPayment({
                        transactionId: txId,
                    });
                    if (!confirmResponse.status) {
                        throw new Error(confirmResponse.message || t("paymentFailed"));
                    }
                }
                setModalShow(true);
            } else {
                const confirmResponse = await bookingApi.confirmPayment({
                    transactionId: transactionId,
                });

                if (confirmResponse.status) {
                    setModalShow(true); // Show success modal
                } else {
                    toast.error(confirmResponse.message || t("paymentFailed"));
                }
            }
        } catch (error) {
            console.error("Confirm payment error:", error);
            toast.error(error.message || t("paymentErrorGeneric"));
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="fade-in ">
                        {type === "EVENT" ? (
                            <div className="d-flex flex-column gap-3 mb-4">
                                <h5 className="fw-bold mb-1 text-start">{t("selectTickets") || "Select Tickets"}</h5>
                                {item.original?.tickets?.map((ticket) => {
                                    const ticketQty = selectedTickets[ticket._id] || 0;
                                    const availableQty = ticket.availableQty !== undefined ? ticket.availableQty : ticket.qty;
                                    const now = new Date();
                                    const salesStarted = ticket.salesStart ? now >= new Date(ticket.salesStart) : true;
                                    const salesEnded = ticket.salesEnd ? now > new Date(ticket.salesEnd) : false;
                                    const isSalesActive = salesStarted && !salesEnded;
                                    return (
                                        <div
                                            key={ticket._id}
                                            className="p-3 rounded-3 text-start"
                                            style={{
                                                backgroundColor: "#111",
                                                border: "1px solid rgba(35, 173, 164, 0.2)",
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <h6 className="fw-bold mb-1 text-white" style={{ fontSize: "16px" }}>{ticket.ticketName}</h6>
                                                    <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>{ticket.ticketShortDesc || t("standardEntry")}</p>
                                                </div>
                                                <h5 className="fw-bold text-white mb-0" style={{ color: "#23ada4" }}>{formatPrice(ticket.price)}</h5>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <div className="d-flex flex-column gap-1">
                                                    <span className="text-muted" style={{ fontSize: "12px" }}>
                                                        {t("available") || "Available"}: {availableQty}
                                                    </span>
                                                    {!salesStarted && (
                                                        <span className="text-info" style={{ fontSize: "12px", fontWeight: "500" }}>
                                                            🕒 {t("salesStartOn") || "Sales start on"}: {new Date(ticket.salesStart).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {salesEnded && (
                                                        <span className="text-danger" style={{ fontSize: "12px", fontWeight: "500" }}>
                                                            ❌ {t("salesEnded") || "Sales ended"}
                                                        </span>
                                                    )}
                                                    {isSalesActive && availableQty <= 10 && availableQty > 0 && (
                                                        <span className="text-warning" style={{ fontSize: "12px", fontWeight: "500" }}>
                                                            ⚠️ {t("onlyLeft") || "Only"} {availableQty} {t("left") || "left"}
                                                        </span>
                                                    )}
                                                    {availableQty <= 0 && (
                                                        <span className="text-danger" style={{ fontSize: "12px", fontWeight: "500" }}>
                                                            🚫 {t("soldOut") || "Sold Out"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="d-flex align-items-center gap-3 bg-dark rounded-pill px-2 py-1" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                                                    <button
                                                        className="btn btn-sm text-white p-0 border-0 fs-5"
                                                        style={{ width: "24px", height: "24px", lineHeight: "20px", opacity: ticketQty === 0 ? 0.4 : 1, cursor: ticketQty === 0 ? "not-allowed" : "pointer" }}
                                                        disabled={ticketQty === 0}
                                                        onClick={() => {
                                                            const newQty = Math.max(0, ticketQty - 1);
                                                            setSelectedTickets(prev => ({ ...prev, [ticket._id]: newQty }));
                                                            setQty(Object.values({ ...selectedTickets, [ticket._id]: newQty }).reduce((a, b) => a + b, 0));
                                                        }}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="text-white fw-bold" style={{ minWidth: "16px", textAlign: "center" }}>{ticketQty}</span>
                                                    <button
                                                        className="btn btn-sm text-white p-0 border-0 fs-5"
                                                        style={{ width: "24px", height: "24px", lineHeight: "20px", opacity: (!isSalesActive || ticketQty >= availableQty || availableQty <= 0) ? 0.4 : 1, cursor: (!isSalesActive || ticketQty >= availableQty || availableQty <= 0) ? "not-allowed" : "pointer" }}
                                                        disabled={!isSalesActive || ticketQty >= availableQty || availableQty <= 0}
                                                        onClick={() => {
                                                            const newQty = Math.min(availableQty, ticketQty + 1);
                                                            setSelectedTickets(prev => ({ ...prev, [ticket._id]: newQty }));
                                                            setQty(Object.values({ ...selectedTickets, [ticket._id]: newQty }).reduce((a, b) => a + b, 0));
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <>
                                {item.enrollmentType === "Ongoing" && (item.oneMonthPassEnabled || item.threeMonthPassEnabled) ? (
                                    /* Passes are enabled: slot selection is nested inside Single Session */
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-2 text-start text-white" style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            {t("selectAccessType") || "Select Access Pass Type"}
                                        </h6>
                                        <div className="d-flex flex-column gap-3">
                                            {/* Single Session Card */}
                                            <div
                                                className="p-3 rounded-3 text-start"
                                                onClick={() => setSelectedPassType("single")}
                                                style={{
                                                    backgroundColor: selectedPassType === "single" ? "rgba(35, 173, 164, 0.1)" : "#111",
                                                    border: selectedPassType === "single" ? "1px solid #23ada4" : "1px solid rgba(255,255,255,0.1)",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="fw-bold mb-1 text-white" style={{ fontSize: "15px" }}>
                                                            {t("singleSession") || "Single Session"}
                                                        </h6>
                                                        <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                                                            {t("singleSessionDesc") || "Pay per session. Valid only for the selected slot day."}
                                                        </p>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <span className="fw-bold text-white" style={{ color: "#23ada4" }}>{formatPrice(item.price)}</span>
                                                        {selectedPassType === "single" ? (
                                                            <div className="d-flex align-items-center justify-content-center" style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#23ada4" }}>
                                                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fff" }} />
                                                            </div>
                                                        ) : (
                                                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Dropdown list of slots nested under Single Session */}
                                                {selectedPassType === "single" && (
                                                    <div className="mt-3 pt-3 border-top border-secondary" onClick={(e) => e.stopPropagation()}>
                                                        <h6 className="fw-bold mb-3 text-start text-white" style={{ fontSize: "13px" }}>
                                                            {t("selectWeeklySchedule") || "Select Weekly Schedule *"}
                                                        </h6>
                                                        {item.weeklySchedule && Object.keys(item.weeklySchedule).length > 0 ? (
                                                            <div className="d-flex flex-column gap-3">
                                                                {Object.entries(item.weeklySchedule).map(([day, dayData]) => {
                                                                    const slots = Array.isArray(dayData) ? dayData : (dayData.slots || []);
                                                                    const dateStr = dayData.date || "";
                                                                    return (
                                                                        <div key={day} className="mb-1">
                                                                            <h6
                                                                                className="fw-bold mb-2 text-start text-white"
                                                                                style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#23ada4" }}
                                                                            >
                                                                                {(() => {
                                                                                    const dayPrefix = day.split(" ")[0];
                                                                                    const datePart = dateStr ? ` (${dateStr})` : (day.includes("(") ? day.substring(day.indexOf("(")) : "");
                                                                                    return (dayPrefix === "Mon" ? "Monday" :
                                                                                        dayPrefix === "Tue" ? "Tuesday" :
                                                                                            dayPrefix === "Wed" ? "Wednesday" :
                                                                                                dayPrefix === "Thu" ? "Thursday" :
                                                                                                    dayPrefix === "Fri" ? "Friday" :
                                                                                                        dayPrefix === "Sat" ? "Saturday" : "Sunday") + datePart;
                                                                                })()}
                                                                            </h6>
                                                                            <div
                                                                                className="rounded-3 overflow-hidden"
                                                                                style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#080808" }}
                                                                            >
                                                                                {slots.map((slot, slotIdx) => {
                                                                                    const isSelected = selectedSlots[day] === slot.batchId?.toString();
                                                                                    const isFull = slot.isFull || slot.availableSeats <= 0;
                                                                                    return (
                                                                                        <div
                                                                                            key={`${day}-${slot.batchId}-${slotIdx}`}
                                                                                            className="p-3 d-flex justify-content-between align-items-center"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                if (!isFull) {
                                                                                                    const slotBatchId = slot.batchId?.toString();
                                                                                                    setSelectedSlots(prev => {
                                                                                                        const next = { ...prev };
                                                                                                        if (next[day] === slotBatchId) {
                                                                                                            delete next[day];
                                                                                                        } else {
                                                                                                            next[day] = slotBatchId;
                                                                                                        }
                                                                                                        return next;
                                                                                                    });
                                                                                                    if (qty > slot.availableSeats) setQty(slot.availableSeats);
                                                                                                }
                                                                                            }}
                                                                                            style={{
                                                                                                cursor: isFull ? "not-allowed" : "pointer",
                                                                                                opacity: isFull ? 0.6 : 1,
                                                                                                borderBottom: slotIdx < slots.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                                                                                                backgroundColor: isSelected ? "rgba(35,173,164,0.12)" : "transparent",
                                                                                                transition: "background-color 0.2s ease"
                                                                                            }}
                                                                                        >
                                                                                            <div className="d-flex align-items-center gap-3">
                                                                                                <span className="text-white" style={{ fontSize: "14px", fontWeight: "500" }}>
                                                                                                    {slot.startTime} – {slot.endTime}
                                                                                                </span>
                                                                                                <span className="text-muted" style={{ fontSize: "12px" }}>
                                                                                                    {isFull
                                                                                                        ? t("full") || "Full"
                                                                                                        : `${slot.availableSeats} left`}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div>
                                                                                                {isSelected ? (
                                                                                                    <div
                                                                                                        className="d-flex align-items-center justify-content-center"
                                                                                                        style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#23ada4" }}
                                                                                                    >
                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                                                                        </svg>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} />
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-muted text-start" style={{ fontSize: "12px" }}>{t("noUpcomingClasses") || "No weekly schedule configured yet."}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 1 Month Pass Card */}
                                            {item.oneMonthPassEnabled && (
                                                <div
                                                    className="p-3 rounded-3 text-start"
                                                    onClick={() => {
                                                        setSelectedPassType("1_month");
                                                        setSelectedSlots({});
                                                    }}
                                                    style={{
                                                        backgroundColor: selectedPassType === "1_month" ? "rgba(35, 173, 164, 0.1)" : "#111",
                                                        border: selectedPassType === "1_month" ? "1px solid #23ada4" : "1px solid rgba(255,255,255,0.1)",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <h6 className="fw-bold mb-1 text-white" style={{ fontSize: "15px" }}>
                                                                {t("oneMonthPass") || "1 Month Pass"}
                                                            </h6>
                                                            <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                                                                {t("oneMonthPassDesc") || "Unlimited access to selected slot days for 30 days."}
                                                            </p>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <span className="fw-bold text-white" style={{ color: "#23ada4" }}>{formatPrice(item.oneMonthPassPrice)}</span>
                                                            {selectedPassType === "1_month" ? (
                                                                <div className="d-flex align-items-center justify-content-center" style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#23ada4" }}>
                                                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fff" }} />
                                                                </div>
                                                            ) : (
                                                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3 Month Pass Card */}
                                            {item.threeMonthPassEnabled && (
                                                <div
                                                    className="p-3 rounded-3 text-start"
                                                    onClick={() => {
                                                        setSelectedPassType("3_month");
                                                        setSelectedSlots({});
                                                    }}
                                                    style={{
                                                        backgroundColor: selectedPassType === "3_month" ? "rgba(35, 173, 164, 0.1)" : "#111",
                                                        border: selectedPassType === "3_month" ? "1px solid #23ada4" : "1px solid rgba(255,255,255,0.1)",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <h6 className="fw-bold mb-1 text-white" style={{ fontSize: "15px" }}>
                                                                {t("threeMonthPass") || "3 Month Pass"}
                                                            </h6>
                                                            <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                                                                {t("threeMonthPassDesc") || "Unlimited access to selected slot days for 90 days."}
                                                            </p>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <span className="fw-bold text-white" style={{ color: "#23ada4" }}>{formatPrice(item.threeMonthPassPrice)}</span>
                                                            {selectedPassType === "3_month" ? (
                                                                <div className="d-flex align-items-center justify-content-center" style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#23ada4" }}>
                                                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fff" }} />
                                                                </div>
                                                            ) : (
                                                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Passes are NOT enabled: render slots list normally at root level */
                                    item.enrollmentType === "Ongoing" ? (
                                        <>
                                            <h5 className="fw-bold mb-3 text-start">
                                                {t("selectWeeklySchedule") || "Select Weekly Schedule"}
                                            </h5>
                                            {item.weeklySchedule && Object.keys(item.weeklySchedule).length > 0 ? (
                                                <div className="d-flex flex-column gap-3 mb-4">
                                                    {Object.entries(item.weeklySchedule).map(([day, dayData]) => {
                                                        const slots = Array.isArray(dayData) ? dayData : (dayData.slots || []);
                                                        const dateStr = dayData.date || "";
                                                        return (
                                                            <div key={day} className="mb-1">
                                                                <h6
                                                                    className="fw-bold mb-2 text-start text-white"
                                                                    style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                                                                >
                                                                    {(() => {
                                                                        const dayPrefix = day.split(" ")[0];
                                                                        const datePart = dateStr ? ` (${dateStr})` : (day.includes("(") ? day.substring(day.indexOf("(")) : "");
                                                                        return (dayPrefix === "Mon" ? "Monday" :
                                                                            dayPrefix === "Tue" ? "Tuesday" :
                                                                                dayPrefix === "Wed" ? "Wednesday" :
                                                                                    dayPrefix === "Thu" ? "Thursday" :
                                                                                        dayPrefix === "Fri" ? "Friday" :
                                                                                            dayPrefix === "Sat" ? "Saturday" : "Sunday") + datePart;
                                                                    })()}
                                                                </h6>
                                                                <div
                                                                    className="rounded-3 overflow-hidden"
                                                                    style={{ border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "#111" }}
                                                                >
                                                                    {slots.map((slot, slotIdx) => {
                                                                        const isSelected = selectedSlots[day] === slot.batchId?.toString();
                                                                        const isFull = slot.isFull || slot.availableSeats <= 0;
                                                                        return (
                                                                            <div
                                                                                key={`${day}-${slot.batchId}-${slotIdx}`}
                                                                                className="p-3 d-flex justify-content-between align-items-center"
                                                                                onClick={() => {
                                                                                    if (!isFull) {
                                                                                        const slotBatchId = slot.batchId?.toString();
                                                                                        setSelectedSlots(prev => {
                                                                                            const next = { ...prev };
                                                                                            if (next[day] === slotBatchId) {
                                                                                                delete next[day];
                                                                                            } else {
                                                                                                next[day] = slotBatchId;
                                                                                            }
                                                                                            return next;
                                                                                        });
                                                                                        if (qty > slot.availableSeats) setQty(slot.availableSeats);
                                                                                    }
                                                                                }}
                                                                                style={{
                                                                                    cursor: isFull ? "not-allowed" : "pointer",
                                                                                    opacity: isFull ? 0.6 : 1,
                                                                                    borderBottom: slotIdx < slots.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                                                                                    backgroundColor: isSelected ? "rgba(35,173,164,0.08)" : "transparent",
                                                                                    transition: "background-color 0.2s ease"
                                                                                }}
                                                                            >
                                                                                <div className="d-flex align-items-center gap-4">
                                                                                    <span className="text-white" style={{ fontSize: "15px", fontWeight: "500" }}>
                                                                                        {slot.startTime} – {slot.endTime}
                                                                                    </span>
                                                                                    <span className="text-muted" style={{ fontSize: "13px" }}>
                                                                                        {isFull
                                                                                            ? t("full") || "Full"
                                                                                            : `${slot.availableSeats} ${t("seatsLeft") || "seats left"}`}
                                                                                    </span>
                                                                                </div>
                                                                                <div>
                                                                                    {isSelected ? (
                                                                                        <div
                                                                                            className="d-flex align-items-center justify-content-center"
                                                                                            style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#23ada4" }}
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                                                            </svg>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-muted text-start">{t("noUpcomingClasses") || "No weekly schedule configured yet."}</p>
                                            )}
                                        </>
                                    ) : (
                                        /* ── Fixed Start: batch list ── */
                                        <div className="d-flex flex-column gap-3 mb-4">
                                            {item.batches?.map((batch) => {
                                                const isSelected = selectedBatchId === batch._id;
                                                const isFull = batch.availableSeats <= 0;
                                                return (
                                                    <div
                                                        key={batch._id}
                                                        className="p-3 rounded-3 text-start"
                                                        onClick={() => {
                                                            if (!isFull) {
                                                                setSelectedBatchId(batch._id);
                                                                if (qty > batch.availableSeats) setQty(batch.availableSeats);
                                                            }
                                                        }}
                                                        style={{
                                                            backgroundColor: isSelected ? "rgba(35, 173, 164, 0.1)" : "#111",
                                                            border: isSelected ? "1px solid #23ada4" : "1px solid rgba(255,255,255,0.1)",
                                                            cursor: isFull ? "not-allowed" : "pointer",
                                                            opacity: isFull ? 0.6 : 1,
                                                            transition: "all 0.2s ease",
                                                        }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="fw-bold mb-1 text-white" style={{ fontSize: "16px" }}>
                                                                    {batch.batchName || "Schedule Slot"}
                                                                </h6>
                                                                <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>
                                                                    {batch.days?.join(", ")} • {batch.startTime} – {batch.endTime}
                                                                </p>
                                                            </div>
                                                            <div className="text-end">
                                                                <span className={`badge ${isFull ? "bg-danger" : "bg-success"}`} style={{ fontSize: "12px" }}>
                                                                    {isFull ? t("full") || "Full" : `${batch.availableSeats} ${t("seatsLeft") || "seats left"}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                )}


                                {type !== "COURSE" && (
                                    <>
                                        <h5 className="fw-bold mb-3 text-start">{t("quantity")}</h5>
                                        <div className="quantity-selector mb-5">
                                            <button
                                                className="btn text-white fs-4"
                                                onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
                                                disabled={item?.enrollmentType === "Ongoing" ? Object.keys(selectedSlots).length === 0 : !selectedBatchId}
                                            >
                                                −
                                            </button>
                                            <span className="fs-4 fw-bold">{qty}</span>
                                            <button
                                                className="btn text-white fs-4"
                                                onClick={() => {
                                                    // For Ongoing, cap by min available across selected slots
                                                    const maxQty = item?.enrollmentType === "Ongoing"
                                                        ? Math.min(...Object.entries(selectedSlots).map(([d, bId]) => {
                                                            const s = item.weeklySchedule?.[d]?.find(sl => sl.batchId?.toString() === bId);
                                                            return s ? s.availableSeats : 1;
                                                        }))
                                                        : (item.batches?.find(b => b._id === selectedBatchId)?.availableSeats ?? 1);
                                                    if (qty < maxQty) {
                                                        setQty(qty + 1);
                                                    } else {
                                                        toast.error(t("maxSeatsReached") || "Cannot select more seats than available");
                                                    }
                                                }}
                                                disabled={item?.enrollmentType === "Ongoing" ? Object.keys(selectedSlots).length === 0 : !selectedBatchId}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        <h5 className="text-start">{t("discountCode")}</h5>
                        <div className="promo-group mb-2">
                            <input
                                type="text"
                                placeholder={t("enterPromoPlaceholder")}
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                            />
                            <button className="common_btn" onClick={handleApplyPromo}>
                                {t("apply")}
                            </button>
                        </div>
                        {priceBreakdown?.promoMessage && (
                            <div className={`mb-4 ${priceBreakdown?.promoApplied ? "text-success" : "text-danger"}`}>
                                {priceBreakdown?.promoMessage}
                            </div>
                        )}

                        <h5 className="text-start" style={{ marginTop: "20px", display: "inline-block" }}>
                            {t("priceDetails")}
                        </h5>
                        <div className="price_box">
                            <div className="d-flex justify-content-between price_text">
                                <span className="">{t("ticketPrice")}</span>
                                <span className="">{formatPrice(priceBreakdown.basePrice)}</span>
                            </div>
                            <div className="d-flex justify-content-between  price_text">
                                <span className="">{t("taxes")}</span>
                                <span className="">{formatPrice(priceBreakdown.taxes)}</span>
                            </div>

                            <div className="d-flex justify-content-between  price_text">
                                <span>{t("discount")}</span>
                                <span className="text-info">-{formatPrice(priceBreakdown.discount)}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center price_text">
                                <span>{t("total")}</span>
                                <span className="text-info">{formatPrice(priceBreakdown.totalAmount)}</span>
                            </div>
                        </div>
                        <div className="tickets_btn">
                            <button
                                className="common_btn  mt-4"
                                onClick={() => setStep(2)}
                                disabled={type === "EVENT"
                                    ? qty === 0
                                    : item?.enrollmentType === "Ongoing"
                                        ? qty === 0 || (selectedPassType === "single" && Object.keys(selectedSlots).length === 0)
                                        : qty === 0 || !selectedBatchId}
                            >
                                {type === "EVENT" ? (t("chooseTicket") || "Choose Ticket") : t("payNow")}
                            </button>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="payment_container">
                        <div className="payment_card_wrapper">
                            <div className="price_box">
                                <h5 className="text-start">{t("priceDetails")}</h5>
                                <div className="d-flex justify-content-between price_text">
                                    <span className="">{t("ticketPrice")}</span>
                                    <span className="">{formatPrice(priceBreakdown.basePrice)}</span>
                                </div>
                                <div className="d-flex justify-content-between  price_text">
                                    <span className="">{t("taxes")}</span>
                                    <span className="">{formatPrice(priceBreakdown.taxes)}</span>
                                </div>
                                <div className="d-flex justify-content-between  price_text">
                                    <span className="">{t("discount")}</span>
                                    <span className="">-{formatPrice(priceBreakdown.discount)}</span>
                                </div>
                                <div className="d-flex justify-content-between price_text">
                                    <span className="">{t("total")}</span>
                                    <span className="">{formatPrice(priceBreakdown.totalAmount)}</span>
                                </div>
                            </div>

                            <div className="payment_card_add">
                                <h2 className="">{t("paymentMethod")}</h2>
                                <div
                                    className="payment_method_item"
                                    onClick={() => setSelectedMethod("card")}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="method_left">
                                        <div
                                            className={`radio_outer ${selectedMethod === "card" ? "active_radio" : ""}`}
                                        >
                                            {selectedMethod === "card" && <div className="radio_inner"></div>}
                                        </div>
                                        <div className="card_logo_bg">
                                            <img
                                                src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                                                width="25"
                                                alt="mastercard"
                                            />
                                        </div>
                                        <div className="method_info">
                                            <h6>{t("card")}</h6>
                                            <span>... 3455</span>
                                        </div>
                                    </div>
                                    <button className="edit_btn" onClick={(e) => e.stopPropagation()}>
                                        {t("edit")}
                                    </button>
                                </div>

                                <hr className="divider_line" />

                                <div
                                    className="payment_method_item"
                                    onClick={() => setSelectedMethod("qpay")}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="method_left">
                                        <div
                                            className={`radio_outer ${selectedMethod === "qpay" ? "active_radio" : ""}`}
                                        >
                                            {selectedMethod === "qpay" && <div className="radio_inner"></div>}
                                        </div>
                                        <div className="method_info">
                                            <h6>{t("qpay")}</h6>
                                            <span>{t("fundYourWallet")}</span>
                                        </div>
                                    </div>
                                </div>

                                <hr className="divider_line" />

                                <div
                                    className="payment_method_item"
                                    onClick={() => setSelectedMethod("social")}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="method_left">
                                        <div
                                            className={`radio_outer ${selectedMethod === "social" ? "active_radio" : ""
                                                }`}
                                        >
                                            {selectedMethod === "social" && <div className="radio_inner"></div>}
                                        </div>
                                        <div className="method_info">
                                            <h6>{t("socialPay")}</h6>
                                            <span>{t("fundYourWallet")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="tickets_btn">
                                <button className="common_btn  mt-4" onClick={handleInitiateBooking} disabled={loading}>
                                    {loading ? t("processing") : t("payNow")}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="payment_container review_sec">
                        <div className="payment_card_wrapper">
                            <div className="price_box">
                                <h5 className="text-start">{t("priceDetails")}</h5>
                                <div className="d-flex justify-content-between price_text">
                                    <span className="">{t("ticketPrice")}</span>
                                    <span className="">{formatPrice(priceBreakdown.basePrice)}</span>
                                </div>
                                <div className="d-flex justify-content-between  price_text">
                                    <span className="">{t("taxes")}</span>
                                    <span className="">{formatPrice(priceBreakdown.taxes)}</span>
                                </div>
                                <div className="d-flex justify-content-between  price_text">
                                    <span className="">{t("discount")}</span>
                                    <span className="">-{formatPrice(priceBreakdown.discount)}</span>
                                </div>
                                <div className="d-flex justify-content-between price_text">
                                    <span className="">{t("total")}</span>
                                    <span className="">{formatPrice(priceBreakdown.totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="profile_container">
                            <div className="info_list">
                                <div className="info_item">
                                    <img src="/img/user_icon01.svg" />
                                    <span className="info_text">Negar khosravi</span>
                                </div>

                                <div className="info_item">
                                    <img src="/img/call_icon02.svg" />
                                    <span className="info_text">785423349</span>
                                </div>

                                <div className="info_item">
                                    <img src="/img/envelope_icon03.svg" />
                                    <span className="info_text">negarkhosravi1995@gmail.com</span>
                                </div>
                            </div>

                            {/* Lower Section: FanProtect Card */}
                            <div className="protection_card">
                                <div className="guarantee_row refund_content">
                                    <img src="/img/white_shield.svg" />
                                    <h4>{t("fanProtectTitle")}</h4>
                                </div>
                                <div className="refund_row">
                                    <img src="/img/dollaricon.svg" />
                                    <div className="refund_content">
                                        <h4>{t("easyRefundTitle")}</h4>
                                        <p>{t("easyRefundDesc")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="tickets_btn">
                            <button
                                className="common_btn  mt-4"
                                onClick={handleConfirmBooking} // Call confirm booking
                                disabled={loading}
                            >
                                {loading ? t("processing") : t("payNow")}
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            <div className="Tickets_booking_sec">
                <Container>
                    <div className="booking-wrapper">
                        <div className="stepper-container">
                            <span className={`step-item ${step >= 1 ? "active" : ""}`} onClick={() => setStep(1)}>
                                {" "}
                                <img src="/img/tickets_icon.svg" /> {t("tickets")}
                            </span>
                            <span className={`step-divider ${step >= 2 ? "active" : ""}`}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M8.51192 4.43057C8.82641 4.161 9.29989 4.19743 9.56946 4.51192L15.5695 11.5119C15.8102 11.7928 15.8102 12.2072 15.5695 12.4881L9.56946 19.4881C9.29989 19.8026 8.82641 19.839 8.51192 19.5695C8.19743 19.2999 8.161 18.8264 8.43057 18.5119L14.0122 12L8.43057 5.48811C8.161 5.17361 8.19743 4.70014 8.51192 4.43057Z"
                                        fill="white"
                                    />
                                </svg>
                            </span>
                            <span className={`step-item ${step >= 2 ? "active" : ""}`} onClick={() => setStep(2)}>
                                <img src="/img/payment_icon.svg" /> {t("paymentLabel")}
                            </span>
                            <span className={`step-divider ${step >= 3 ? "active" : ""}`}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M8.51192 4.43057C8.82641 4.161 9.29989 4.19743 9.56946 4.51192L15.5695 11.5119C15.8102 11.7928 15.8102 12.2072 15.5695 12.4881L9.56946 19.4881C9.29989 19.8026 8.82641 19.839 8.51192 19.5695C8.19743 19.2999 8.161 18.8264 8.43057 18.5119L14.0122 12L8.43057 5.48811C8.161 5.17361 8.19743 4.70014 8.51192 4.43057Z"
                                        fill="white"
                                    />
                                </svg>
                            </span>
                            <span className={`step-item ${step === 3 ? "active" : ""}`} onClick={() => setStep(3)}>
                                <img src="/img/review_icon.svg" /> {t("reviewLabel")}
                            </span>
                        </div>

                        <div className="row g-5">
                            <div className="col-lg-5 ">
                                <EventTicketscart item={item} />
                            </div>
                            <div className="col-lg-7 ">{renderStep()}</div>
                        </div>
                    </div>
                </Container>
            </div>

            <PayNow show={modalShow} onHide={() => setModalShow(false)} />
        </>
    );
}
