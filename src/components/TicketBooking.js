"use client";
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import EventTicketscart from "./EventTicketscart";
import PayNow from "./Modal/PayNow";
import bookingApi from "@/api/bookingApi";
import toast from "react-hot-toast";

export default function TicketBooking({ event }) {
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
  });

  const [promoCode, setPromoCode] = useState(""); // Input value
  const [appliedPromoCode, setAppliedPromoCode] = useState(""); // Validated/Applied value
  const [promoMessage, setPromoMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [transactionId, setTransactionId] = useState(null); // Store initiated transaction ID

  // Calculate booking details when qty or appliedPromoCode changes
  useEffect(() => {
    const fetchBreakdown = async () => {
      if (!event) return;
      try {
        const res = await bookingApi.calculateBooking({
          eventId: event._id,
          qty: qty,
          discountCode: appliedPromoCode,
        });

        if (res.status) {
          setPriceBreakdown({
            basePrice: res.data.breakdown.basePrice,
            taxes: res.data.breakdown.taxAmount,
            discount: res.data.breakdown.discountAmount,
            totalAmount: res.data.breakdown.totalAmount,
          });
        }
      } catch (error) {
        console.error("Error calculating booking price:", error);
      }
    };

    fetchBreakdown();
  }, [event, qty, appliedPromoCode]);

  const handleApplyPromo = async () => {
    setPromoMessage(null);
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    try {
      const res = await bookingApi.calculateBooking({
        eventId: event._id,
        qty: qty,
        discountCode: promoCode,
      });

      if (res.status) {
        setAppliedPromoCode(promoCode);
        setPriceBreakdown({
          basePrice: res.data.breakdown.basePrice,
          taxes: res.data.breakdown.taxAmount,
          discount: res.data.breakdown.discountAmount,
          totalAmount: res.data.breakdown.totalAmount,
        });
        setPromoMessage({ type: "success", text: "Promo code applied!" });
        toast.success("Promo code applied!");
      } else {
        toast.error(res.message || "Invalid promo code");
        setAppliedPromoCode(""); // Reset if invalid
        setPromoMessage({
          type: "error",
          text: res.message || "Invalid promo code",
        });
      }
    } catch (error) {
      console.error("Promo code error:", error);
      const msg = error?.response?.data?.message || "Invalid promo code";
      toast.error(msg);
      setAppliedPromoCode("");
      setPromoMessage({ type: "error", text: msg });
    }
  };

  // Step 2 -> Step 3: Initiate Booking
  const handleInitiateBooking = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const initResponse = await bookingApi.initiateBooking({
        eventId: event._id,
        qty: qty,
        discountCode: appliedPromoCode,
      });

      if (initResponse.status) {
        setTransactionId(initResponse.data.transactionId);
        setStep(3); // Move to Review Step
        toast.success("Booking initiated, please review.");
      } else {
        toast.error(initResponse.message || "Booking initiation failed");
      }
    } catch (error) {
      console.error("Initiate booking error:", error);
      toast.error("Failed to initiate booking");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> Finish: Confirm Payment
  const handleConfirmBooking = async () => {
    if (!transactionId) {
      toast.error("No booking to confirm. Please restart.");
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
        toast.error(confirmResponse.message || "Payment failed");
      }
    } catch (error) {
      console.error("Confirm payment error:", error);
      toast.error("Something went wrong during payment");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="fade-in ">
            <h5 className="fw-bold mb-3">Quantity</h5>
            <div className="quantity-selector mb-5">
              <button
                className="btn text-white fs-4"
                onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
              >
                −
              </button>
              <span className="fs-4 fw-bold">{qty}</span>
              <button
                className="btn text-white fs-4"
                onClick={() => setQty(qty + 1)}
              >
                +
              </button>
            </div>

            <h5 className="text-start">Discount Code</h5>
            <div className="promo-group mb-2">
              <input
                type="text"
                placeholder="Enter code here"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button className="common_btn" onClick={handleApplyPromo}>
                APPLY
              </button>
            </div>
            {promoMessage && (
              <div
                className={`mb-4 ${promoMessage.type === "success"
                  ? "text-success"
                  : "text-danger"
                  }`}
              >
                {promoMessage.text}
              </div>
            )}

            <h5 className="text-start">Price Details</h5>
            <div className="price_box">
              <div className="d-flex justify-content-between price_text">
                <span className="">Ticket Price</span>
                <span className="">${priceBreakdown.basePrice}</span>
              </div>
              <div className="d-flex justify-content-between  price_text">
                <span className="">Taxes</span>
                <span className="">$ {priceBreakdown.taxes}</span>
              </div>

              <div className="d-flex justify-content-between  price_text">
                <span>Discount</span>
                <span className="text-info">-{priceBreakdown.discount}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center price_text">
                <span>Total</span>
                <span className="text-info">${priceBreakdown.totalAmount}</span>
              </div>
            </div>
            <div className="tickets_btn">
              <button className="common_btn  mt-4" onClick={() => setStep(2)}>
                Pay Now
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="payment_container">
            <div className="payment_card_wrapper">
              <div className="price_box">
                <h5 className="text-start">Price Details</h5>
                <div className="d-flex justify-content-between price_text">
                  <span className="">Ticket Price</span>
                  <span className="">${priceBreakdown.basePrice}</span>
                </div>
                <div className="d-flex justify-content-between  price_text">
                  <span className="">Taxes</span>
                  <span className="">$ {priceBreakdown.taxes}</span>
                </div>
                <div className="d-flex justify-content-between  price_text">
                  <span className="">Discount</span>
                  <span className="">-{priceBreakdown.discount}</span>
                </div>
                <div className="d-flex justify-content-between price_text">
                  <span className="">Total</span>
                  <span className="">${priceBreakdown.totalAmount}</span>
                </div>
              </div>

              <div className="payment_card_add">
                <h2 className="">Payment Method</h2>
                <div
                  className="payment_method_item"
                  onClick={() => setSelectedMethod("card")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="method_left">
                    <div
                      className={`radio_outer ${selectedMethod === "card" ? "active_radio" : ""
                        }`}
                    >
                      {selectedMethod === "card" && (
                        <div className="radio_inner"></div>
                      )}
                    </div>
                    <div className="card_logo_bg">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                        width="25"
                        alt="mastercard"
                      />
                    </div>
                    <div className="method_info">
                      <h6>Card</h6>
                      <span>... 3455</span>
                    </div>
                  </div>
                  <button
                    className="edit_btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    EDIT
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
                      className={`radio_outer ${selectedMethod === "qpay" ? "active_radio" : ""
                        }`}
                    >
                      {selectedMethod === "qpay" && (
                        <div className="radio_inner"></div>
                      )}
                    </div>
                    <div className="method_info">
                      <h6>Qh6ay</h6>
                      <span>Fund your wallet</span>
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
                      {selectedMethod === "social" && (
                        <div className="radio_inner"></div>
                      )}
                    </div>
                    <div className="method_info">
                      <h6>Socialh6ay</h6>
                      <span>Fund your wallet</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="tickets_btn">
                <button
                  className="common_btn  mt-4"
                  onClick={handleInitiateBooking}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Pay Now"}
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
                <h5 className="text-start">Price Details</h5>
                <div className="d-flex justify-content-between price_text">
                  <span className="">Ticket Price</span>
                  <span className="">${priceBreakdown.basePrice}</span>
                </div>
                <div className="d-flex justify-content-between  price_text">
                  <span className="">Taxes</span>
                  <span className="">$ {priceBreakdown.taxes}</span>
                </div>
                <div className="d-flex justify-content-between  price_text">
                  <span className="">Discount</span>
                  <span className="">-{priceBreakdown.discount}</span>
                </div>
                <div className="d-flex justify-content-between price_text">
                  <span className="">Total</span>
                  <span className="">${priceBreakdown.totalAmount}</span>
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
                  <h4>FanProtect : every order is 100% guaranteed</h4>
                </div>

                <div className="refund_row">
                  <img src="/img/dollaricon.svg" />
                  <div className="refund_content">
                    <h4>Easy Refund</h4>
                    <p>
                      Change of plans? Get your money back up to 24 hours before
                      the event.
                    </p>
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
                {loading ? "Processing..." : "Pay Now"}
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
              <span
                className={`step-item ${step >= 1 ? "active" : ""}`}
                onClick={() => setStep(1)}
              >
                {" "}
                <img src="/img/tickets_icon.svg" /> Tickets
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
              <span
                className={`step-item ${step >= 2 ? "active" : ""}`}
                onClick={() => setStep(2)}
              >
                <img src="/img/payment_icon.svg" /> Payment
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
              <span
                className={`step-item ${step === 3 ? "active" : ""}`}
                onClick={() => setStep(3)}
              >
                <img src="/img/review_icon.svg" /> Review
              </span>
            </div>

            <div className="row g-5">
              <div className="col-lg-5 ">
                <EventTicketscart event={event} />
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
