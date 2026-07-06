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
        appliedTaxes: [],
    });

    const [showTaxTooltip, setShowTaxTooltip] = useState(false);

    const [promoCode, setPromoCode] = useState(""); // Input value
    const [appliedPromoCode, setAppliedPromoCode] = useState(""); // Validated/Applied value
    const [transactionId, setTransactionId] = useState(null); // Store initiated transaction ID (can be array for events)

    const { t, language } = useLanguage();

    const getBookingCutOffTime = (startDate, startTime, bookingCutOff) => {
        if (!startDate || !bookingCutOff) return null;
        try {
            const start = new Date(startDate);
            if (startTime) {
                const [hours, minutes] = startTime.split(":").map(Number);
                start.setHours(hours || 0, minutes || 0, 0, 0);
            }

            const match = bookingCutOff.match(/^(\d+)([hmdw])$/i);
            if (!match) return null;

            const value = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();

            let ms = 0;
            if (unit === "h") ms = value * 60 * 60 * 1000;
            else if (unit === "m") ms = value * 60 * 1000;
            else if (unit === "d") ms = value * 24 * 60 * 60 * 1000;
            else if (unit === "w") ms = value * 7 * 24 * 60 * 60 * 1000;

            return new Date(start.getTime() - ms);
        } catch (e) {
            return null;
        }
    };

    const isCutOff = () => {
        const startDate = item?.startDate || item?.currentSchedule?.startDate;
        const startTime = item?.original?.startTime || item?.currentSchedule?.startTime;
        const bookingCutOff = item?.bookingCutOff;
        if (!startDate || !bookingCutOff) return false;

        // If it's a fixedStart course, check batches
        if (type === "COURSE" && item?.enrollmentType === "fixedStart") {
            if (selectedBatchId) {
                const selectedBatch = item.batches?.find(b => b._id === selectedBatchId);
                return selectedBatch ? !!selectedBatch.bookingCutOffPassed : false;
            } else {
                const activeBatches = item.batches?.filter(b => b.status === "Active") || [];
                if (activeBatches.length === 0) return true;
                return activeBatches.every(b => !!b.bookingCutOffPassed);
            }
        }

        const cutoffTime = getBookingCutOffTime(startDate, startTime, bookingCutOff);
        if (!cutoffTime) return false;
        return Date.now() > cutoffTime.getTime();
    };

    const bookingCutOffPassed = isCutOff();

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
        if (amount === 0) return t("free") || "Free";
        if (amount == null || amount === undefined) return t("priceNotAvailable") || "N/A";
        try {
            const locale = language === "mn" ? "mn-MN" : "en-US";
            const formatted = new Intl.NumberFormat(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
            return `₮${formatted}`;
        } catch (e) {
            return `₮${amount}`;
        }
    };

    // For breakdown rows (taxes, discount, total) — shows ₮0 instead of "Free"
    const formatAmount = (amount) => {
        if (amount == null || amount === undefined || amount === 0) return "₮0";
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

    const renderServiceChargeRow = () => {
        const taxDescription = priceBreakdown.appliedTaxes?.[0]?.description;
        return (
            <div className="d-flex justify-content-between price_text align-items-center">
                <span className="d-flex align-items-center" style={{ gap: "6px" }}>
                    {t("serviceCharge") || "Service Charge"}
                    {taxDescription && (
                        <span
                            className="position-relative d-inline-flex align-items-center"
                            style={{ cursor: "help" }}
                            onMouseEnter={() => setShowTaxTooltip(true)}
                            onMouseLeave={() => setShowTaxTooltip(false)}
                        >
                            <span
                                style={{
                                    fontSize: "10px",
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    border: "1px solid rgba(255,255,255,0.4)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "rgba(255,255,255,0.6)",
                                    lineHeight: "1"
                                }}
                            >
                                i
                            </span>
                            <span
                                style={{
                                    visibility: showTaxTooltip ? "visible" : "hidden",
                                    opacity: showTaxTooltip ? 1 : 0,
                                    width: "160px",
                                    backgroundColor: "#222",
                                    color: "#fff",
                                    textAlign: "center",
                                    borderRadius: "6px",
                                    padding: "6px 8px",
                                    position: "absolute",
                                    zIndex: 99,
                                    bottom: "125%",
                                    left: "50%",
                                    marginLeft: "-80px",
                                    fontSize: "11px",
                                    border: "1px solid rgba(255, 255, 255, 0.15)",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                                    transition: "opacity 0.2s ease, visibility 0.2s ease",
                                    pointerEvents: "none",
                                }}
                            >
                                {taxDescription}
                            </span>
                        </span>
                    )}
                </span>
                <span>{formatAmount(priceBreakdown.taxes)}</span>
            </div>
        );
    };

    // Pre-populate ticket selections when event is loaded
    useEffect(() => {
        if (item && type === "EVENT" && item.original?.tickets) {
            const initial = {};
            const isFreeEvent = item.price === 0;
            item.original.tickets.forEach((ticket, idx) => {
                // If it is a free event, auto-select quantity 1 for the first ticket, else 0
                initial[ticket._id] = (isFreeEvent && idx === 0) ? 1 : 0;
            });
            setSelectedTickets(initial);
            if (isFreeEvent) {
                setQty(1);
            }
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
                            appliedTaxes: [],
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
                            appliedTaxes: res.data.appliedTaxes || [],
                        });
                    }
                } else if (type === "COURSE") {
                    let payload;
                    if (item?.enrollmentType === "Ongoing") {
                        const slots = Object.values(selectedSlots);
                        if (selectedPassType === "single" && slots.length === 0) {
                            setPriceBreakdown({
                                basePrice: 0, taxes: 0, discount: 0, totalAmount: 0,
                                promoApplied: false, promoMessage: null, appliedTaxes: [],
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
                                promoApplied: false, promoMessage: null, appliedTaxes: [],
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
                            appliedTaxes: res?.data?.appliedTaxes || [],
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
                    const slots = Object.values(selectedSlots);
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

    // Direct booking/enrollment for free events or courses
    const handleFreeEnrollment = async () => {
        if (!item) return;
        setLoading(true);
        try {
            let initResponse;
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
                initResponse = await bookingApi.initiateBooking(payload);
            } else if (type === "COURSE") {
                if (item?.enrollmentType === "Ongoing") {
                    const slotEntries = Object.values(selectedSlots);
                    if (selectedPassType === "single" && slotEntries.length === 0) {
                        toast.error(t("pleaseSelectBatchFirst") || "Please select at least one schedule");
                        setLoading(false);
                        return;
                    }
                    const ongoingSlots = slotEntries;
                    const payload = {
                        qty: qty,
                        discountCode: appliedPromoCode,
                        bookingType: type,
                        courseId: item._id,
                        ongoingSlots,
                        ...(selectedPassType !== "single" && { passType: selectedPassType }),
                    };
                    initResponse = await bookingApi.initiateBooking(payload);
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
                    initResponse = await bookingApi.initiateBooking(payload);
                }
            }

            if (initResponse && initResponse.status) {
                const txId = initResponse.data.transactionId;
                setTransactionId(txId);

                // If the transaction is already PAID, show success modal directly
                if (initResponse.data.transaction?.status === "PAID") {
                    setModalShow(true);
                    toast.success(t("bookingConfirmed") || "Booking confirmed successfully!");
                } else {
                    // Call confirmPayment automatically for free booking
                    if (Array.isArray(txId)) {
                        for (const subTxId of txId) {
                            const confirmResponse = await bookingApi.confirmPayment({
                                transactionId: subTxId,
                            });
                            if (!confirmResponse.status) {
                                throw new Error(confirmResponse.message || t("paymentFailed"));
                            }
                        }
                        setModalShow(true);
                        toast.success(t("bookingConfirmed") || "Booking confirmed successfully!");
                    } else {
                        const confirmResponse = await bookingApi.confirmPayment({
                            transactionId: txId,
                        });
                        if (confirmResponse.status) {
                            setModalShow(true);
                            toast.success(t("bookingConfirmed") || "Booking confirmed successfully!");
                        } else {
                            toast.error(confirmResponse.message || t("paymentFailed"));
                        }
                    }
                }
            } else {
                toast.error(initResponse?.message || t("bookingInitiationFailed"));
            }
        } catch (error) {
            console.error("Free enrollment booking error:", error);
            toast.error(error.message || t("failedToInitiateBooking"));
        } finally {
            setLoading(false);
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
                    const slotEntries = Object.values(selectedSlots);
                    if (selectedPassType === "single" && slotEntries.length === 0) {
                        toast.error(t("pleaseSelectBatchFirst") || "Please select at least one schedule");
                        setLoading(false);
                        return;
                    }
                    const ongoingSlots = slotEntries;
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

    const [activeDayKey, setActiveDayKey] = useState(null);

    useEffect(() => {
        if (item?.weeklySchedule) {
            const keys = Object.keys(item.weeklySchedule);
            if (keys.length > 0 && !activeDayKey) {
                setActiveDayKey(keys[0]);
            }
        }
    }, [item, activeDayKey]);

    const parseDayKey = (key) => {
        const dayPart = key.split(" ")[0]; // e.g. "Mon"
        const dateMatch = key.match(/\(([^)]+)\)/);
        let dateStr = "";
        if (dateMatch && dateMatch[1]) {
            try {
                const dateObj = new Date(dateMatch[1]);
                if (!isNaN(dateObj.getTime())) {
                    const dayNum = dateObj.getDate();
                    const monthName = dateObj.toLocaleString(language === "mn" ? "mn-MN" : "en-US", { month: "short" });
                    dateStr = `${dayNum} ${monthName}`;
                }
            } catch (e) {
                dateStr = dateMatch[1];
            }
        }
        return {
            dayName: dayPart,
            dateStr: dateStr || (key.includes("(") ? key.substring(key.indexOf("(")) : "")
        };
    };

    const renderOngoingSlots = (isPassChild = true) => {
        if (!item.weeklySchedule || Object.keys(item.weeklySchedule).length === 0) {
            return <p className="text-muted text-start ps-3" style={{ fontSize: "13px" }}>{t("noUpcomingClasses") || "No weekly schedule configured yet."}</p>;
        }

        const keys = Object.keys(item.weeklySchedule);
        const currentActiveKey = activeDayKey || keys[0];
        const activeDayData = item.weeklySchedule[currentActiveKey] || [];
        const slots = Array.isArray(activeDayData) ? activeDayData : (activeDayData.slots || []);

        return (
            <div className={isPassChild ? "mt-3 pt-3 border-top border-secondary" : ""} onClick={isPassChild ? (e) => e.stopPropagation() : undefined}>
                {/* Horizontal scrollable days list */}
                <div className="d-flex gap-2 overflow-auto pb-2 mb-3 no-scrollbar" style={{ scrollbarWidth: "none" }}>
                    {keys.map((dayKey) => {
                        const { dayName, dateStr } = parseDayKey(dayKey);
                        const isActive = dayKey === currentActiveKey;
                        // Count selected slots on this day
                        const dayData = item?.weeklySchedule?.[dayKey] || [];
                        const slotsOnThisDay = Array.isArray(dayData) ? dayData : (dayData.slots || []);
                        const selectedCountOnThisDay = slotsOnThisDay?.filter(s => !!selectedSlots[`${dayKey}_${s.batchId}`]).length;

                        return (
                            <button
                                key={dayKey}
                                className="d-flex flex-column align-items-center justify-content-center p-2 rounded-3 text-white position-relative"
                                onClick={() => setActiveDayKey(dayKey)}
                                style={{
                                    minWidth: "70px",
                                    height: "60px",
                                    backgroundColor: isActive ? "#23ada4" : "#1a1a1a",
                                    border: isActive ? "1px solid #23ada4" : "1px solid rgba(255,255,255,0.1)",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <span style={{ fontSize: "12px", fontWeight: "600", opacity: isActive ? 1 : 0.8 }}>
                                    {t(dayName) || dayName}
                                </span>
                                <span style={{ fontSize: "10px", opacity: isActive ? 0.9 : 0.6 }}>
                                    {dateStr}
                                </span>
                                {selectedCountOnThisDay > 0 && !isActive && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "9px" }}>
                                        {selectedCountOnThisDay}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <h6 className="fw-bold mb-2 text-start text-white" style={{ fontSize: "13px", opacity: 0.8 }}>
                    {t("availableTimes") || "Available times"}
                </h6>

                <div
                    className="rounded-3 overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#0c0c0c" }}
                >
                    {slots.map((slot, slotIdx) => {
                        const slotKey = `${currentActiveKey}_${slot.batchId}`;
                        const isSelected = !!selectedSlots[slotKey];
                        const isCancelled = slot.isCancelled;
                        const isFull = !isCancelled && (slot.isFull || slot.availableSeats <= 0);
                        return (
                            <div
                                key={`${currentActiveKey}-${slot.batchId}-${slotIdx}`}
                                className="p-3 d-flex justify-content-between align-items-center"
                                onClick={() => {
                                    if (isCancelled) return;
                                    if (!isFull) {
                                        const slotBatchId = slot.batchId?.toString();
                                        setSelectedSlots(prev => {
                                            const next = { ...prev };
                                            if (next[slotKey]) {
                                                delete next[slotKey];
                                            } else {
                                                next[slotKey] = {
                                                    batchId: slotBatchId,
                                                    selectedDay: currentActiveKey,
                                                    selectedDate: slot.date || null
                                                };
                                            }
                                            return next;
                                        });
                                        if (qty > slot.availableSeats) setQty(slot.availableSeats);
                                    }
                                }}
                                style={{
                                    cursor: isCancelled ? "not-allowed" : isFull ? "not-allowed" : "pointer",
                                    opacity: isCancelled || isFull ? 0.6 : 1,
                                    borderBottom: slotIdx < slots.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                                    backgroundColor: isSelected ? "rgba(35,173,164,0.08)" : "transparent",
                                    transition: "background-color 0.2s ease"
                                }}
                            >
                                <div className="d-flex align-items-center gap-4">
                                    <span className="text-white" style={{ fontSize: "14px", fontWeight: "500" }}>
                                        {slot.startTime} – {slot.endTime}
                                    </span>
                                    <span className="text-muted" style={{ fontSize: "12px" }}>
                                        {isCancelled ? (
                                            <span className="text-danger fw-bold">{t("cancelled") || "Cancelled"}</span>
                                        ) : isFull ? (
                                            t("full") || "Full"
                                        ) : (
                                            `${slot.availableSeats} ${t("seatsLeft") || "seats left"}`
                                        )}
                                    </span>
                                </div>
                                <div>
                                    {isCancelled ? (
                                        <span className="text-danger fw-bold" style={{ fontSize: "12px" }}>❌</span>
                                    ) : isSelected ? (
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
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="fade-in ">
                        {/* {bookingCutOffPassed && (
                            <div className="alert alert-danger text-center mb-4 fw-bold p-3 rounded-3" style={{ border: "1px solid rgba(220, 53, 69, 0.2)", backgroundColor: "rgba(220, 53, 69, 0.05)", color: "#ea868f" }}>
                                ❌ {t("bookingClosedPassed") || "Booking is closed for this event/course because the booking cut-off time has passed."}
                            </div>
                        )} */}
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
                                                    {ticket.price !== 0 && (
                                                        <span className="text-muted" style={{ fontSize: "12px" }}>
                                                            {t("available") || "Available"}: {availableQty}
                                                        </span>
                                                    )}
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
                                                        style={{ width: "24px", height: "24px", lineHeight: "20px", opacity: (bookingCutOffPassed || ticketQty === 0) ? 0.4 : 1, cursor: (bookingCutOffPassed || ticketQty === 0) ? "not-allowed" : "pointer" }}
                                                        disabled={bookingCutOffPassed || ticketQty === 0}
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
                                                        style={{ width: "24px", height: "24px", lineHeight: "20px", opacity: (bookingCutOffPassed || !isSalesActive || ticketQty >= availableQty || availableQty <= 0) ? 0.4 : 1, cursor: (bookingCutOffPassed || !isSalesActive || ticketQty >= availableQty || availableQty <= 0) ? "not-allowed" : "pointer" }}
                                                        disabled={bookingCutOffPassed || !isSalesActive || ticketQty >= availableQty || availableQty <= 0}
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
                                    <div className="mb-4">
                                        <h5 className="fw-bold mb-3 text-start text-white" style={{ fontSize: "16px", letterSpacing: "0.5px" }}>
                                            {t("selectYourPlan") || "Select your plan"}
                                        </h5>
                                        <div className="d-flex flex-column gap-3">
                                            {/* Single Session Card */}
                                            <div
                                                className="p-3 rounded-3 text-start position-relative"
                                                onClick={() => setSelectedPassType("single")}
                                                style={{
                                                    backgroundColor: selectedPassType === "single" ? "rgba(35, 173, 164, 0.05)" : "#0f0f0f",
                                                    border: selectedPassType === "single" ? "1.5px solid #23ada4" : "1px solid rgba(255,255,255,0.1)",
                                                    cursor: "pointer",
                                                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                                }}
                                            >
                                                {selectedPassType === "single" && (
                                                    <span className="position-absolute top-0 start-100 translate-middle d-flex align-items-center justify-content-center" style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#23ada4", border: "2px solid #0f0f0f", zIndex: 10 }}>
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    </span>
                                                )}
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: "48px", height: "48px", backgroundColor: "rgba(35, 173, 164, 0.12)" }}>
                                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <rect x="2" y="5" width="20" height="14" rx="2" stroke="#23ada4" strokeWidth="2" />
                                                                <path d="M6 10H10V14H6V10Z" fill="#ff4c8b" />
                                                                <circle cx="2" cy="12" r="2" fill="#0f0f0f" />
                                                                <circle cx="22" cy="12" r="2" fill="#0f0f0f" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-bold mb-1 text-white" style={{ fontSize: "15px" }}>
                                                                {t("singleSessionPerlass") || "Single Session / per class"}
                                                            </h6>
                                                            <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                                                                {t("singleSessionDesc") || "Book one specific session only"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <span className="fw-bold" style={{ fontSize: "16px", color: selectedPassType === "single" ? "#23ada4" : "#fff" }}>
                                                            {formatPrice(item.price * Math.max(1, Object.keys(selectedSlots).length))}
                                                        </span>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: selectedPassType === "single" ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "#666" }}>
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </div>
                                                </div>
                                                {selectedPassType === "single" && renderOngoingSlots()}
                                            </div>

                                            {/* 1 Month Pass Card */}
                                            {item.oneMonthPassEnabled && (
                                                <div className="position-relative w-100">
                                                    <div className="position-absolute" style={{ top: "-10px", left: "20px", zIndex: 2 }}>
                                                        <span className="px-2 py-0.5 rounded-pill" style={{ backgroundColor: "#23ada4", color: "#000", fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                            {t("mostPopular") || "Most Popular"}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="p-3 rounded-3 text-start position-relative"
                                                        onClick={() => setSelectedPassType("1_month")}
                                                        style={{
                                                            backgroundColor: selectedPassType === "1_month" ? "rgba(35, 173, 164, 0.05)" : "#0f0f0f",
                                                            border: selectedPassType === "1_month" ? "1.5px solid #23ada4" : "1px solid rgba(255,255,255,0.1)",
                                                            cursor: "pointer",
                                                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        }}
                                                    >
                                                        {selectedPassType === "1_month" && (
                                                            <span className="position-absolute top-0 start-100 translate-middle d-flex align-items-center justify-content-center" style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#23ada4", border: "2px solid #0f0f0f", zIndex: 10 }}>
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                </svg>
                                                            </span>
                                                        )}
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: "48px", height: "48px", backgroundColor: "rgba(35, 173, 164, 0.12)" }}>
                                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#23ada4" strokeWidth="2" />
                                                                        <line x1="3" y1="9" x2="21" y2="9" stroke="#23ada4" strokeWidth="2" />
                                                                        <line x1="8" y1="2" x2="8" y2="5" stroke="#23ada4" strokeWidth="2" />
                                                                        <line x1="16" y1="2" x2="16" y2="5" stroke="#23ada4" strokeWidth="2" />
                                                                        <circle cx="8" cy="13" r="1.5" fill="#23ada4" />
                                                                        <circle cx="12" cy="13" r="1.5" fill="#23ada4" />
                                                                        <circle cx="16" cy="13" r="1.5" fill="#23ada4" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <h6 className="fw-bold mb-1 text-white" style={{ fontSize: "15px" }}>
                                                                        {t("oneMonthPass") || "1-Month Pass"}
                                                                    </h6>
                                                                    <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                                                                        {t("oneMonthPassDesc") || "Valid for 30 days from check-in"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <span className="fw-bold" style={{ fontSize: "16px", color: selectedPassType === "1_month" ? "#23ada4" : "#fff" }}>
                                                                    {formatPrice(item.oneMonthPassPrice)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3 Month Pass Card */}
                                            {item.threeMonthPassEnabled && (
                                                <div
                                                    className="p-3 rounded-3 text-start position-relative"
                                                    onClick={() => setSelectedPassType("3_month")}
                                                    style={{
                                                        backgroundColor: selectedPassType === "3_month" ? "rgba(35, 173, 164, 0.05)" : "#0f0f0f",
                                                        border: selectedPassType === "3_month" ? "1.5px solid #23ada4" : "1px solid rgba(255,255,255,0.1)",
                                                        cursor: "pointer",
                                                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    }}
                                                >
                                                    {selectedPassType === "3_month" && (
                                                        <span className="position-absolute top-0 start-100 translate-middle d-flex align-items-center justify-content-center" style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#23ada4", border: "2px solid #0f0f0f", zIndex: 10 }}>
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        </span>
                                                    )}
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: "48px", height: "48px", backgroundColor: "rgba(35, 173, 164, 0.12)" }}>
                                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z" stroke="#23ada4" strokeWidth="2" strokeLinejoin="round" fill="none" />
                                                                    <path d="M5 3L6 5L8 6L6 7L5 9L4 7L2 6L4 5L5 3Z" fill="#23ada4" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h6 className="fw-bold mb-1 text-white" style={{ fontSize: "15px" }}>
                                                                    {t("threeMonthPass") || "3-Month Pass"}
                                                                </h6>
                                                                <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                                                                    {t("threeMonthPassDesc") || "Valid for 90 days from check-in"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <span className="fw-bold" style={{ fontSize: "16px", color: selectedPassType === "3_month" ? "#23ada4" : "#fff" }}>
                                                                {formatPrice(item.threeMonthPassPrice)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : item.enrollmentType === "Ongoing" ? (
                                    <>
                                        <h5 className="fw-bold mb-3 text-start text-white" style={{ fontSize: "16px", letterSpacing: "0.5px" }}>
                                            {t("selectWeeklySchedule") || "Select Weekly Schedule"}
                                        </h5>
                                        {renderOngoingSlots(false)}
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
                                                        if (!isFull && !batch.bookingCutOffPassed) {
                                                            setSelectedBatchId(batch._id);
                                                            if (qty > batch.availableSeats) setQty(batch.availableSeats);
                                                        }
                                                    }}
                                                    style={{
                                                        backgroundColor: isSelected ? "rgba(35, 173, 164, 0.1)" : "#111",
                                                        border: isSelected ? "1px solid #23ada4" : "1px solid rgba(255,255,255,0.1)",
                                                        cursor: (isFull || batch.bookingCutOffPassed) ? "not-allowed" : "pointer",
                                                        opacity: (isFull || batch.bookingCutOffPassed) ? 0.6 : 1,
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
                                                            {batch.bookingCutOffPassed ? (
                                                                <span className="badge bg-danger" style={{ fontSize: "12px" }}>
                                                                    {t("bookingClosed") || "Closed"}
                                                                </span>
                                                            ) : (
                                                                <span className={`badge ${isFull ? "bg-danger" : "bg-success"}`} style={{ fontSize: "12px" }}>
                                                                    {isFull ? t("full") || "Full" : `${batch.availableSeats} ${t("seatsLeft") || "seats left"}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                                }


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
                                                    const maxQty = item?.enrollmentType === "Ongoing"
                                                        ? Math.min(...Object.values(selectedSlots).map((info) => {
                                                            const dayData = item.weeklySchedule?.[info.selectedDay];
                                                            const slotsArray = Array.isArray(dayData) ? dayData : (dayData?.slots || []);
                                                            const s = slotsArray.find(sl => sl.batchId?.toString() === info.batchId?.toString());
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
                                <span className="">{formatAmount(priceBreakdown.basePrice)}</span>
                            </div>
                            {renderServiceChargeRow()}

                            <div className="d-flex justify-content-between  price_text">
                                <span>{t("discount")}</span>
                                <span className="text-info">-{formatAmount(priceBreakdown.discount)}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center price_text">
                                <span>{t("total")}</span>
                                <span className="text-info">{formatAmount(priceBreakdown.totalAmount)}</span>
                            </div>
                        </div>
                        <div className="tickets_btn">
                            <button
                                className="common_btn  mt-4"
                                onClick={item.price === 0 ? handleFreeEnrollment : () => setStep(2)}
                                disabled={loading || bookingCutOffPassed || (type === "EVENT"
                                    ? qty === 0
                                    : item?.enrollmentType === "Ongoing"
                                        ? qty === 0 || (selectedPassType === "single" && Object.keys(selectedSlots).length === 0)
                                        : qty === 0 || !selectedBatchId)}
                            >
                                {loading ? (t("loading") || "Loading...") : (bookingCutOffPassed ? (t("bookingClosed") || "Booking Closed") : (type === "EVENT"
                                    ? (item.price === 0 ? (t("enrollNow") || "Enroll Now") : (t("chooseTicket") || "Choose Ticket"))
                                    : (item.price === 0 ? (t("enrollNow") || "Enroll Now") : t("payNow"))))}
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
                                    <span className="">{formatAmount(priceBreakdown.basePrice)}</span>
                                </div>
                                {renderServiceChargeRow()}
                                <div className="d-flex justify-content-between  price_text">
                                    <span className="">{t("discount")}</span>
                                    <span className="">-{formatAmount(priceBreakdown.discount)}</span>
                                </div>
                                <div className="d-flex justify-content-between price_text">
                                    <span className="">{t("total")}</span>
                                    <span className="">{formatAmount(priceBreakdown.totalAmount)}</span>
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
                                    <span className="">{formatAmount(priceBreakdown.basePrice)}</span>
                                </div>
                                {renderServiceChargeRow()}
                                <div className="d-flex justify-content-between  price_text">
                                    <span className="">{t("discount")}</span>
                                    <span className="">-{formatAmount(priceBreakdown.discount)}</span>
                                </div>
                                <div className="d-flex justify-content-between price_text">
                                    <span className="">{t("total")}</span>
                                    <span className="">{formatAmount(priceBreakdown.totalAmount)}</span>
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
