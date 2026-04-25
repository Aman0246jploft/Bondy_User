"use client";
import Link from "next/link";
import React, { useEffect, useState, Suspense, useRef } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import bookingApi from "@/api/bookingApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import QRCode from "react-qr-code";
import { useLanguage } from "@/context/LanguageContext";
import { formatTime } from "@/utils/timeHelper";
import toast from "react-hot-toast";

const ExpandableText = ({ text, limit = 100, forceExpanded = false, hideToggle = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  if (!text) return null;
  if (text.length <= limit) return <p>{text}</p>;

  const expanded = forceExpanded || isExpanded;

  return (
    <div>
      <p>
        {expanded ? text : `${text.substring(0, limit)}...`}
        {!hideToggle && (
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
        )}
      </p>
    </div>
  );
};

function TicketDetailsContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [ticketInfo, setTicketInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchTicketDetail(id);
    }
  }, [id]);

  useEffect(() => {
    document.title = "Ticket Details - Bondy";
  }, []);

  const fetchTicketDetail = async (transactionId) => {
    setLoading(true);
    try {
      const res = await bookingApi.getTicketDetail(transactionId);
      if (res.status && res.data) {
        setTicketInfo(res?.data?.ticket);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTicketImage = async () => {
    try {
      if (!ticketRef.current) return;
      const html2canvas = (await import("html2canvas")).default;

      setIsSharingImage(true);
      await new Promise((resolve) => setTimeout(resolve, 80));

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#1a1a1a",
      });

      const imageUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `Ticket-${ticketInfo?.bookingId || "details"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t("ticketImageDownloaded") || "Ticket image downloaded");
    } catch (error) {
      console.error("Error generating ticket image:", error);
      toast.error(t("shareLinkCopyFailed") || "Could not download ticket");
    } finally {
      setIsSharingImage(false);
    }
  };

  const handleDownloadTicket = async () => {
    await downloadTicketImage();
  };

  const handleShare = async () => {
    try {
      await downloadTicketImage();
    } catch (error) {
      console.error("Error sharing ticket:", error);
    }
  };

  const handleDownloadLink = async () => {
    try {
      const res = await bookingApi.getShareAndDownloadUrls(id);
      if (res.status && res.data) {
        const downloadUrl = res.data.downloadUrl;
        await navigator.clipboard.writeText(downloadUrl);
        toast.success(t("downloadLinkCopied") || "Download link copied to clipboard!");
        window.open(downloadUrl, "_blank");
      }
    } catch (error) {
      console.error("Error generating download link:", error);
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
        <Link href="/MyTicketsOrganiser" className="common_btn mt-3">
          {t("backToTicket") || "Back to My Tickets"}
        </Link>
      </div>
    );
  }

  const isEvent = ticketInfo.bookingType === "EVENT";
  const item = isEvent ? ticketInfo.eventId : ticketInfo.courseId;
  const title = isEvent ? item?.eventTitle : item?.courseTitle;

  // For courses, find the specific schedule if available
  const selectedSchedule = !isEvent && item?.schedules?.find(s => s._id === ticketInfo.scheduleId);

  const fullAddress = [
    item?.venueAddress?.address,
    item?.venueAddress?.city,
    item?.venueAddress?.state,
    item?.venueAddress?.country
  ].filter(Boolean).join(", ");

  return (
    <div className="ticket-details-wrapper">
      <div className="d-flex gap-3 align-items-center justify-content-between mb-4">
        <Link href="/MyTicketsOrganiser" className="back-btn mb-0">
          <img src="/img/arrow-left-white.svg" alt="Back" className="me-2" />
          {t("backToTicket") || "Back to Tickets"}
        </Link>
        <div className="d-flex align-items-center gap-3">
          <button
            className="common_btn d-flex align-items-center"
            type="button"
            onClick={handleShare}
          >
            <img src="/img/share-icon.svg" className="me-2" alt="" />
            {t("share") || "Share"}
          </button>
        </div>
      </div>

      <div ref={ticketRef} className="cards p-0 overflow-hidden">
        <div className="p-4 p-md-5">
          <Row className="g-4">
            <Col lg={4} xl={3}>
              <div className="ticket-dtl-card text-center text-lg-start">
                <div className="ticket-dtl-card-img mx-auto mx-lg-0 mb-4">
                  <img
                    src={getFullImageUrl(item?.posterImage?.[0])}
                    alt={title || "Ticket poster"}
                    className="img-fluid"
                    onError={(e) => {
                      e.target.src = "/img/sidebar-logo.svg";
                    }}
                  />
                </div>
                <h3 className="ticket-title-wrap">{title || "N/A"}</h3>
                <div className="mt-3">
                  {getStatusBadge(ticketInfo?.status)}
                </div>
              </div>
            </Col>

            <Col lg={8} xl={9}>
              <div className="ticket-dtl-main h-100 d-flex flex-column">
                <div className="tickt-dtl-info d-flex justify-content-between align-items-center mb-5">
                  <h4 className="mb-0">{t("ticketDetails") || "Ticket Information"}</h4>
                  <div className="tickt-dtl-info-btns" data-html2canvas-ignore="true">
                    <div className="d-flex gap-2">
                      <button
                        className="common_btn d-flex align-items-center"
                        type="button"
                        onClick={handleDownloadTicket}
                      >
                        <img src="/img/download-arrow.svg" className="me-2" alt="" />
                        {t("downloadTicket") || "Download PDF"}
                      </button>
                      {/* <button
                        className="btn-link-teal d-flex align-items-center p-2 border rounded"
                        type="button"
                        onClick={handleDownloadLink}
                        title={t("getDownloadLink") || "Get Public Download Link"}
                        style={{ background: "rgba(0, 128, 128, 0.1)", border: "1px solid var(--primary-teal)" }}
                      >
                        <img src="/img/link-icon.svg" width="18" height="18" alt="Link" />
                      </button> */}
                    </div>
                  </div>
                </div>

                <div className="tickt-dtl-bottom mt-3"  >
                  <Row className="g-4">
                    <Col md={3} sm={6}>
                      <h6>{t("orderTrackingCode") || "Booking ID"}</h6>
                      <p className="ticket-text-wrap" title={ticketInfo?.bookingId}>{ticketInfo?.bookingId}</p>
                    </Col>
                    <Col md={3} sm={6}>
                      <h6>{t("orderDate") || "Booking Date"}</h6>
                      <p>{formatEventDate(ticketInfo?.createdAt)}</p>
                    </Col>
                    <Col md={3} sm={6}>
                      <h6>{t("ticketType") || "Ticket"}</h6>
                      <p className="ticket-text-wrap">{item?.ticketName || item?.enrollmentType || "General"}</p>
                    </Col>
                    <Col md={3} sm={6}>
                      <h6>{t("quantity") || "Qty"}</h6>
                      <p>{ticketInfo?.qty} {t("ticketsSuffix") || "Tickets"}</p>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>

          <div className="event-dtl mt-5 pt-4 border-top border-secondary">
            <h4 className="line-title">
              <span>{isEvent ? t("eventDetails") : t("courseDetails")}</span>
            </h4>
            <Row className="g-4 mt-2">
              <Col md={6}>
                <div className="info-box">
                  <h6>
                    <img src="/img/Map-Point.svg" alt="" className="me-2" />
                    {t("location") || "Location"}
                  </h6>
                  <ExpandableText text={fullAddress} forceExpanded={isSharingImage} hideToggle={isSharingImage} />
                </div>
              </Col>

              <Col md={6}>
                <div className="info-box">
                  <h6>
                    <img src="/img/white-calendar.svg" alt="" className="me-2" />
                    {t("timeSlots") || "Time Slots"}
                  </h6>
                  {isEvent ? (
                    <p>
                      <strong>{formatEventDate(item?.startDate)}</strong>
                      <br />
                      <span>{formatTime(item?.startTime, true, language)} - {formatTime(item?.endTime, true, language)}</span>
                    </p>
                  ) : (
                    <p>
                      {selectedSchedule ? (
                        <>
                          <strong>{formatEventDate(selectedSchedule.startDate)} - {formatEventDate(selectedSchedule.endDate)}</strong>
                          <br />
                          <span>{formatTime(selectedSchedule.startTime, true, language)} - {formatTime(selectedSchedule.endTime, true, language)}</span>
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
                  <h6>{t("description") || "Description"}</h6>
                  <ExpandableText text={item?.shortdesc || item?.longdesc} limit={200} forceExpanded={isSharingImage} hideToggle={isSharingImage} />
                </div>
              </Col>

              {isEvent && (
                <>
                  {item?.ageRestriction && (
                    <Col md={6}>
                      <div className="info-box">
                        <h6>{t("ageRestriction") || "Age Restriction"}</h6>
                        <p>{item.ageRestriction.type === "MIN_AGE" ? `${t("minAge") || "Min age"}: ${item.ageRestriction.minAge}+` : t("noRestriction")}</p>
                      </div>
                    </Col>
                  )}
                  {item?.dressCode && (
                    <Col md={6}>
                      <div className="info-box">
                        <h6>{t("dressCode") || "Dress Code"}</h6>
                        <p className="ticket-text-wrap">{item.dressCode}</p>
                      </div>
                    </Col>
                  )}
                  {item?.addOns && (
                    <Col md={12}>
                      <div className="info-box">
                        <h6>{t("addOns") || "Add-ons"}</h6>
                        <ExpandableText text={item.addOns} limit={150} forceExpanded={isSharingImage} hideToggle={isSharingImage} />
                      </div>
                    </Col>
                  )}
                </>
              )}

              {!isEvent && item?.whatYouWillLearn && (
                <Col md={12}>
                  <div className="info-box">
                    <h6>{t("whatYouWillLearn") || "What you will learn"}</h6>
                    <ExpandableText text={item.whatYouWillLearn} limit={200} forceExpanded={isSharingImage} hideToggle={isSharingImage} />
                  </div>
                </Col>
              )}
            </Row>
          </div>

          {/* Simple Clean Footer instead of Merchant Rubbish */}
          <div className="ticket-footer mt-5 pt-4 border-top border-secondary">
            <Row className="align-items-center">
              <Col md={6}>
                <div className="customer-info-simple">
                  <h6 className="text-secondary mb-1 text-uppercase small letter-spacing-1">{t("customer") || "Customer"}</h6>
                  <h4 className="mb-0 ticket-text-wrap">{ticketInfo?.userId?.firstName} {ticketInfo?.userId?.lastName}</h4>
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
      <style jsx>{`
        .ticket-title-wrap,
        .ticket-text-wrap,
        :global(.ticket-details-wrapper .info-box p),
        :global(.ticket-details-wrapper .info-box span),
        :global(.ticket-details-wrapper .tickt-dtl-bottom p),
        :global(.ticket-details-wrapper .tickt-dtl-bottom h6) {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        :global(.ticket-details-wrapper .ticket-dtl-card),
        :global(.ticket-details-wrapper .ticket-dtl-main),
        :global(.ticket-details-wrapper .tickt-dtl-bottom .col-md-3),
        :global(.ticket-details-wrapper .info-box) {
          min-width: 0;
        }

        @media (max-width: 991px) {
          :global(.ticket-details-wrapper .ticket-dtl-card) {
            text-align: left !important;
          }

          :global(.ticket-details-wrapper .tickt-dtl-info) {
            flex-direction: column;
            align-items: flex-start;
          }

          :global(.ticket-details-wrapper .tickt-dtl-info-btns),
          :global(.ticket-details-wrapper .tickt-dtl-info-btns > div) {
            width: 100%;
          }

          :global(.ticket-details-wrapper .tickt-dtl-info-btns .common_btn) {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
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
