"use client";
import Link from "next/link";
import React, { useEffect, useState, Suspense, useRef } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import bookingApi from "@/api/bookingApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import QRCode from "react-qr-code";
import { useLanguage } from "@/context/LanguageContext";

function TicketDetailsContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [ticketInfo, setTicketInfo] = useState(null);
  const [ticketInfoFull, setTicketInfoFull] = useState(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchTicketDetail(id);
    }
  }, [id]);

  const fetchTicketDetail = async (transactionId) => {
    setLoading(true);
    try {
      const res = await bookingApi.getTicketDetail(transactionId);
      if (res.status && res.data) {
        setTicketInfo(res?.data?.ticket);
        setTicketInfoFull(res?.data);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async () => {
    try {
      if (!ticketRef.current) return;
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#1a1a1a",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ticket-${ticketInfo?.bookingId || "details"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID":
        return <span className="status-badge complete">{t("confirmed")}</span>;
      case "PENDING":
        return <span className="status-badge pending">{t("pending")}</span>;
      case "CANCELLED":
      case "FAILED":
      case "REFUND_INITIATED":
        return <span className="status-badge cancel">{t(status.toLowerCase()) || status}</span>;
      default:
        return <span className="status-badge pending">{status}</span>;
    }
  };

  const formatEventDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatEventTime = (time) => {
    if (!time) return "";
    try {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return time;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Spinner animation="border" variant="teal" />
      </div>
    );
  }

  if (!ticketInfo) {
    return (
      <div className="text-center py-5">
        <h3>{t("noTicketFound") || "Ticket not found"}</h3>
        <Link href="/MyTickets" className="common_btn mt-3">
          {t("backToTicket") || "Back to My Tickets"}
        </Link>
      </div>
    );
  }

  return (
    <div className="ticket-details">
      <div className="d-flex gap-3 align-items-center justify-content-between mb-4">
        <Link href="/MyTickets" className="back-btn mb-0">
          <img src="/img/arrow-left-white.svg" alt="Back" className="me-2" />
          {t("backToTicket") || "Back to Tickets"}
        </Link>
        <button className="common_btn d-flex align-items-center" type="button">
          <img src="/img/share-icon.svg" className="me-2" alt="" />
          {t("share") || "Share"}
        </button>
      </div>

      <div ref={ticketRef} className="cards">
        <Row className="g-4">
          <Col lg={4} xl={3}>
            <div className="ticket-dtl-card">
              <div className="ticket-dtl-card-img">
                <img
                  src={getFullImageUrl(ticketInfo?.eventId?.posterImage?.[0])}
                  alt={ticketInfo?.eventId?.eventTitle}
                />
              </div>
              <h3>{ticketInfo?.eventId?.eventTitle}</h3>
              <div className="mt-3">
                {getStatusBadge(ticketInfo?.status)}
              </div>
            </div>
          </Col>

          <Col lg={8} xl={9}>
            <div className="ticket-dtl-main">
              <div className="tickt-dtl-info">
                <h4>{t("ticketDetails") || "Ticket Information"}</h4>
                <div className="tickt-dtl-info-btns" data-html2canvas-ignore="true">
                  <button
                    className="common_btn d-flex align-items-center"
                    type="button"
                    onClick={handleDownloadTicket}
                  >
                    <img src="/img/download-arrow.svg" className="me-2" alt="" />
                    {t("downloadTicket") || "Download PDF"}
                  </button>
                </div>
              </div>

              <div className="tickt-dtl-bottom">
                <div>
                  <h6>{t("orderTrackingCode") || "Booking ID"}</h6>
                  <p>{ticketInfo?.bookingId}</p>
                </div>
                <div>
                  <h6>{t("orderDate") || "Booking Date"}</h6>
                  <p>{formatEventDate(ticketInfo?.createdAt)}</p>
                </div>
                <div>
                    <h6>{t("ticketCount") || "Quantity"}</h6>
                    <p>{ticketInfo?.qty} {t("ticketsSuffix") || "Tickets"}</p>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <div className="event-dtl mt-5">
          <h4 className="line-title">
            <span>{t("eventDetails") || "Event Details"}</span>
          </h4>
          <div className="event-dtl-innr">
            <div>
              <h6>
                <img src="/img/Map-Point.svg" alt="" />
                {t("location") || "Location"}
              </h6>
              <p>
                {ticketInfo?.eventId?.venueAddress?.address && `${ticketInfo?.eventId?.venueAddress?.address}, `}
                {ticketInfo?.eventId?.venueAddress?.city}, {ticketInfo?.eventId?.venueAddress?.state}
                <br />
                {ticketInfo?.eventId?.venueAddress?.country}
              </p>
            </div>

            <div>
              <h6>
                <img src="/img/white-calendar.svg" alt="" /> 
                {t("eventTime") || "Date & Time"}
              </h6>
              <p>
                <strong>{formatEventDate(ticketInfo?.eventId?.startDate)}</strong>
                <br />
                <span>{formatEventTime(ticketInfo?.eventId?.startTime)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="payment-dtl mt-5">
          <h4 className="line-title">
            <span>{t("paymentSummary") || "Payment Summary"}</span>
          </h4>
          <ul className="payment-dtl-innr">
            <li>
              <div>
                <h6>{t("paidBy") || "Customer Name"}</h6>
                <p>
                  {ticketInfo?.userId?.firstName} {ticketInfo?.userId?.lastName}
                </p>
              </div>
              <div>
                <h6>{t("paymentMethod") || "Payment Method"}</h6>
                <p>Stripe</p>
              </div>
            </li>
            <li>
              <div>
                <h6>{t("ticketPrice") || "Price per Ticket"}</h6>
                <p>${ticketInfo?.eventId?.ticketPrice}</p>
              </div>
              <div>
                <h6>{t("totalPaid") || "Total Amount"}</h6>
                <p className="text-primary-teal" style={{ color: "var(--primary-teal)", fontSize: "1.5rem" }}>
                  ${ticketInfoFull?.ticket?.totalAmount}
                </p>
              </div>
            </li>
            <li className="justify-content-center border-0 bg-transparent">
                {ticketInfoFull?.ticket?.qrCodeData ? (
                  <div className="qr-section">
                    <QRCode
                      value={ticketInfoFull.ticket.qrCodeData}
                      size={180}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                    />
                    <p>{t("scanToVerify") || "Scan to Verify Ticket"}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <img src="/img/barcode-ticket.svg" alt="Barcode" style={{ maxWidth: "300px" }} />
                  </div>
                )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-5 text-center">Loading...</div>}>
      <TicketDetailsContent />
    </Suspense>
  );
}
