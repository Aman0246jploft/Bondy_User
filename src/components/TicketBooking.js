"use client";
import React, {useEffect, useState} from "react";
import {Container} from "react-bootstrap";
import EventTicketscart from "./EventTicketscart";
import PayNow from "./Modal/PayNow";
import bookingApi from "@/api/bookingApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function TicketBooking({item, type, scheduleId}) {
    const [step, setStep] = useState(1); // 1: Tickets, 2: Payment, 3: Review
    const [qty, setQty] = useState(1); // Default to 1
    const [selectedMethod, setSelectedMethod] = useState("card");
    const [modalShow, setModalShow] = useState(false);
    const [loading, setLoading] = useState(false);

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
    const [transactionId, setTransactionId] = useState(null); // Store initiated transaction ID

    const { t, language } = useLanguage();

    const formatPrice = (amount) => {
        if (amount == null || amount === undefined) return t("priceNotAvailable") || "N/A";
        try {
            const locale = language === "mn" ? "mn-MN" : "en-US";
            const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
            return `₮${formatted}`;
        } catch (e) {
            return `₮${amount}`;
        }
    };

    // Calculate booking details when qty or appliedPromoCode changes
    useEffect(() => {
        const fetchBreakdown = async () => {
            if (!item) return;
            try {
                const payload = {
                    qty: qty,
                    discountCode: appliedPromoCode,
                    bookingType: type,
                };

                if (type === "EVENT") {
                    payload.eventId = item._id;
                } else if (type === "COURSE") {
                    payload.courseId = item._id;
                    payload.scheduleId = scheduleId;
                }

                const res = await bookingApi.calculateBooking(payload);
                console.log("Booking breakdown response:", res);

                if (res.status) {
                    setPriceBreakdown({
                        basePrice: res.data.breakdown.basePrice,
                        taxes: res.data.breakdown.taxAmount,
                        discount: res.data.breakdown.discountAmount,
                        totalAmount: res.data.breakdown.totalAmount,
                        promoMessage: res.data.breakdown.promoMessage || null,
                        promoApplied: res.data.breakdown.promoApplied || false,
                    });
                }
            } catch (error) {
                console.error("Error calculating booking price:", error);
            }
        };

        fetchBreakdown();
    }, [item, qty, appliedPromoCode, type, scheduleId]);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            toast.error(t("pleaseEnterPromo"));
            return;
        }

        try {
            const payload = {
                qty: qty,
                discountCode: promoCode,
                bookingType: type,
            };

            if (type === "EVENT") {
                payload.eventId = item._id;
            } else if (type === "COURSE") {
                payload.courseId = item._id;
                payload.scheduleId = scheduleId;
            }

            const res = await bookingApi.calculateBooking(payload);

            if (res.status) {
                setPriceBreakdown({
                    basePrice: res.data.breakdown.basePrice,
                    taxes: res.data.breakdown.taxAmount,
                    discount: res.data.breakdown.discountAmount,
                    totalAmount: res.data.breakdown.totalAmount,
                    promoMessage: res.data.breakdown.promoMessage || null,
                    promoApplied: res.data.breakdown.promoApplied || false,
                });

                if (res.data.breakdown.promoApplied) {
                    setAppliedPromoCode(promoCode);
                    toast.success(res.data.breakdown.promoMessage || t("promoApplied"));
                } else {
                    setAppliedPromoCode("");
                    toast.error(res.data.breakdown.promoMessage || t("invalidPromo"));
                }
            } else {
                toast.error(res.message || t("invalidPromo"));
                setAppliedPromoCode("");
                setPriceBreakdown((prev) => ({
                    ...prev,
                    promoApplied: false,
                    promoMessage: res.message || t("invalidPromo"),
                }));
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
            const payload = {
                qty: qty,
                discountCode: appliedPromoCode,
                bookingType: type,
            };

            if (type === "EVENT") {
                payload.eventId = item._id;
            } else if (type === "COURSE") {
                payload.courseId = item._id;
                payload.scheduleId = scheduleId;
            }

            const initResponse = await bookingApi.initiateBooking(payload);

            if (initResponse.status) {
                setTransactionId(initResponse.data.transactionId);
                setStep(3); // Move to Review Step
                toast.success(t("bookingInitiated"));
            } else {
                toast.error(initResponse.message || t("bookingInitiationFailed")); // Reverted step logic removal
            }
        } catch (error) {
            console.error("Initiate booking error:", error);
            toast.error(t("failedToInitiateBooking"));
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
            const confirmResponse = await bookingApi.confirmPayment({
                transactionId: transactionId,
            });

            if (confirmResponse.status) {
                setModalShow(true); // Show success modal
            } else {
                toast.error(confirmResponse.message || t("paymentFailed"));
            }
        } catch (error) {
            console.error("Confirm payment error:", error);
            toast.error(t("paymentErrorGeneric"));
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="fade-in ">
                        <h5 className="fw-bold mb-3">{t("quantity")}</h5>
                        <div className="quantity-selector mb-5">
                            <button className="btn text-white fs-4" onClick={() => setQty(qty > 1 ? qty - 1 : 1)}>
                                −
                            </button>
                            <span className="fs-4 fw-bold">{qty}</span>
                            <button className="btn text-white fs-4" onClick={() => setQty(qty + 1)}>
                                +
                            </button>
                        </div>

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

                        <h5 className="text-start" style={{marginTop: "20px", display: "inline-block"}}>
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
                            <button className="common_btn  mt-4" onClick={() => setStep(2)}>
                                {t("payNow")}
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
                                    style={{cursor: "pointer"}}
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
                                    style={{cursor: "pointer"}}
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
                                    style={{cursor: "pointer"}}
                                >
                                    <div className="method_left">
                                        <div
                                            className={`radio_outer ${
                                                selectedMethod === "social" ? "active_radio" : ""
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
