"use client";
import React, { useEffect, useState, Suspense, useRef } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import bookingApi from "@/api/bookingApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import QRCode from "react-qr-code";
import { useLanguage } from "@/context/LanguageContext";

const ExpandableText = ({ text, limit = 100 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  if (!text) return null;
  if (text.length <= limit) return <p>{text}</p>;

  return (
    <div>
      <p>
        {isExpanded ? text : `${text.substring(0, limit)}...`}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-link-teal ms-2"
          style={{
            background: "none",
            border: "none",
            color: "var(--primary-teal)",
            fontSize: "0.875rem",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          {isExpanded ? t("viewLess") || "View Less" : t("viewMore") || "View More"}
        </button>
      </p>
    </div>
  );
};

function PublicTicketContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const shouldDownload = searchParams.get("download") === "true";

  const [ticketInfo, setTicketInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchPublicTicketDetail(id);
    }
  }, [id]);

  useEffect(() => {
    if (ticketInfo && shouldDownload && !downloadTriggered && !loading) {
      // Small delay to ensure rendering is complete before PDF generation
      const timer = setTimeout(() => {
        handleDownloadTicket();
        setDownloadTriggered(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [ticketInfo, shouldDownload, downloadTriggered, loading]);

  const fetchPublicTicketDetail = async (transactionId) => {
    setLoading(true);
    try {
      const res = await bookingApi.getPublicTicketDetail(transactionId);
      if (res.data && res.data.status && res.data.data) {
        setTicketInfo(res.data.data.ticket);
      } else if (res.status && res.data) {
        // Handle case where apiClient returns data directly or wrapped differently
        setTicketInfo(res.data.ticket || res.data);
      }
    } catch (error) {
      console.error("Error fetching public ticket details:", error);
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
    const locale = language === "mn" ? "mn-MN" : "en-US";
    return new Date(date).toLocaleDateString(locale, {
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
      const locale = language === "mn" ? "mn-MN" : "en-US";
      return date.toLocaleTimeString(locale, {
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "#000" }}>
        <Spinner animation="border" variant="teal" />
      </div>
    );
  }

  if (!ticketInfo) {
    return (
      <div className="text-center py-5" style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
        <h3>{t("noTicketFound") || "Ticket not found or link has expired"}</h3>
      </div>
    );
  }

  const isEvent = ticketInfo.bookingType === "EVENT";
  const item = isEvent ? ticketInfo.eventId : ticketInfo.courseId;
  const title = isEvent ? item?.eventTitle : item?.courseTitle;
  const selectedSchedule = !isEvent && item?.schedules?.find(s => s._id === ticketInfo.scheduleId);

  const fullAddress = [
    item?.venueAddress?.address,
    item?.venueAddress?.city,
    item?.venueAddress?.state,
    item?.venueAddress?.country
  ].filter(Boolean).join(", ");

  return (
    <div className="ticket-details-wrapper public-view" style={{ background: "#000", minHeight: "100vh", padding: "2rem 1rem" }}>
      <div className="container" style={{ maxWidth: "1000px" }}>
        <div ref={ticketRef} className="cards p-0 overflow-hidden mb-4" style={{ background: "#1a1a1a", borderRadius: "1.5rem", border: "1px solid #333" }}>
          <div className="p-4 p-md-5">
            <Row className="g-4">
              <Col lg={4} xl={3}>
                <div className="ticket-dtl-card text-center text-lg-start">
                  <div className="ticket-dtl-card-img mx-auto mx-lg-0 mb-4">
                    <img
                      src={getFullImageUrl(item?.posterImage?.[0])}
                      alt={title}
                      className="img-fluid"
                      style={{ borderRadius: "1rem", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "/img/sidebar-logo.svg";
                      }}
                    />
                  </div>
                  <h3 style={{ color: "#fff" }}>{title}</h3>
                  <div className="mt-3">
                    {getStatusBadge(ticketInfo?.status)}
                  </div>
                </div>
              </Col>

              <Col lg={8} xl={9}>
                <div className="ticket-dtl-main h-100 d-flex flex-column">
                  <div className="tickt-dtl-info d-flex justify-content-between align-items-center mb-5">
                    <h4 className="mb-0" style={{ color: "#fff" }}>{t("ticketDetails") || "Ticket Information"}</h4>
                    <div className="tickt-dtl-info-btns" data-html2canvas-ignore="true">
                      <button
                        className="common_btn d-flex align-items-center"
                        type="button"
                        onClick={handleDownloadTicket}
                        style={{ background: "var(--primary-teal)", border: "none" }}
                      >
                        <img src="/img/download-arrow.svg" className="me-2" alt="" />
                        {t("downloadTicket") || "Download PDF"}
                      </button>
                    </div>
                  </div>

                  <div className="tickt-dtl-bottom mt-auto">
                    <Row className="g-4">
                      <Col md={3} sm={6}>
                        <h6 style={{ color: "#888" }}>{t("orderTrackingCode") || "Booking ID"}</h6>
                        <p className="text-truncate text-white" title={ticketInfo?.bookingId}>{ticketInfo?.bookingId}</p>
                      </Col>
                      <Col md={3} sm={6}>
                        <h6 style={{ color: "#888" }}>{t("orderDate") || "Booking Date"}</h6>
                        <p className="text-white">{formatEventDate(ticketInfo?.createdAt)}</p>
                      </Col>
                      <Col md={3} sm={6}>
                        <h6 style={{ color: "#888" }}>{t("ticketType") || "Ticket"}</h6>
                        <p className="text-white">{item?.ticketName || item?.enrollmentType || "General"}</p>
                      </Col>
                      <Col md={3} sm={6}>
                        <h6 style={{ color: "#888" }}>{t("quantity") || "Qty"}</h6>
                        <p className="text-white">{ticketInfo?.qty} {t("ticketsSuffix") || "Tickets"}</p>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Col>
            </Row>

            <div className="event-dtl mt-5 pt-4 border-top border-secondary">
              <h4 className="line-title">
                <span style={{ color: "var(--primary-teal)" }}>{isEvent ? t("eventDetails") : t("courseDetails")}</span>
              </h4>
              <Row className="g-4 mt-2">
                <Col md={6}>
                  <div className="info-box">
                    <h6 style={{ color: "#888" }}>
                      <img src="/img/Map-Point.svg" alt="" className="me-2" />
                      {t("location") || "Location"}
                    </h6>
                    <div style={{ color: "#fff" }}>
                      <ExpandableText text={fullAddress} />
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="info-box">
                    <h6 style={{ color: "#888" }}>
                      <img src="/img/white-calendar.svg" alt="" className="me-2" />
                      {t("timeSlots") || "Time Slots"}
                    </h6>
                    {isEvent ? (
                      <p style={{ color: "#fff" }}>
                        <strong>{formatEventDate(item?.startDate)}</strong>
                        <br />
                        <span>{formatEventTime(item?.startTime)} - {formatEventTime(item?.endTime)}</span>
                      </p>
                    ) : (
                      <p style={{ color: "#fff" }}>
                        {selectedSchedule ? (
                          <>
                            <strong>{formatEventDate(selectedSchedule.startDate)} - {formatEventDate(selectedSchedule.endDate)}</strong>
                            <br />
                            <span>{formatEventTime(selectedSchedule.startTime)} - {formatEventTime(selectedSchedule.endTime)}</span>
                          </>
                        ) : (
                          <span>{t("multipleSchedules") || "Check course schedule"}</span>
                        )}
                      </p>
                    )}
                  </div>
                </Col>

                <Col md={12}>
                  <div className="info-box">
                    <h6 style={{ color: "#888" }}>{t("description") || "Description"}</h6>
                    <div style={{ color: "#fff" }}>
                      <ExpandableText text={item?.shortdesc || item?.longdesc} limit={200} />
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            <div className="ticket-footer mt-5 pt-4 border-top border-secondary">
              <Row className="align-items-center">
                <Col md={6}>
                  <div className="customer-info-simple">
                    <h6 className="text-secondary mb-1 text-uppercase small letter-spacing-1">{t("customer") || "Customer"}</h6>
                    <h4 className="mb-0 text-white">{ticketInfo?.userId?.firstName} {ticketInfo?.userId?.lastName}</h4>
                    <p className="text-secondary small mt-1">{t("totalPaid") || "Total Paid"}: <span className="text-white fw-bold">₮{ticketInfo?.totalAmount}</span></p>
                  </div>
                </Col>
                <Col md={6} className="text-md-end mt-4 mt-md-0">
                  <div className="qr-container p-0 bg-transparent border-0 d-inline-block">
                    {ticketInfo?.qrCodeData ? (
                      <div className="qr-wrapper">
                        <div className="qr-box p-2 bg-white rounded-3 shadow-lg" style={{ width: "140px", height: "140px" }}>
                          <QRCode
                            value={ticketInfo.qrCodeData}
                            size={120}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                          />
                        </div>
                        <p className="mt-2 text-secondary small text-center">{t("scanToVerify") || "Scan to Verify"}</p>
                      </div>
                    ) : (
                      <img src="/img/barcode-ticket.svg" alt="Barcode" className="img-fluid" style={{ maxWidth: "200px" }} />
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-secondary small">© {new Date().getFullYear()} Bondy. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-5 text-center" style={{ background: "#000", minHeight: "100vh", color: "#fff" }}>Loading...</div>}>
      <PublicTicketContent />
    </Suspense>
  );
}
