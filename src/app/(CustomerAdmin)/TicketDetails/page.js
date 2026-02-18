"use client";
import Link from "next/link";
import React, { useEffect, useState, Suspense } from "react";
import { Col, Row } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import bookingApi from "@/api/bookingApi";

import { getFullImageUrl } from "@/utils/imageHelper";
import QRCode from "react-qr-code";

function TicketDetails() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [ticketInfo, setTicketInfo] = useState(null);
  const [ticketInfoFull, setTicketInfoFull] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketDetail(id);
    }
  }, [id]);

  const fetchTicketDetail = async (transactionId) => {
    setLoading(true);
    try {
      const res = await bookingApi.getTicketDetail(transactionId);
      console.log("Ticket Detail Response:", res);
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

  const ticketRef = React.useRef(null);

  const handleDownloadTicket = async () => {
    try {
      if (!ticketRef.current) return;

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#242424", // Matching dark theme background
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
        return <span className="status-badge complete">Confirmed</span>;
      case "PENDING":
        return <span className="status-badge pending">Pending</span>;
      case "CANCELLED":
        return <span className="status-badge cancel">Canceled</span>;
      case "FAILED":
        return <span className="status-badge cancel">Failed</span>;
      case "REFUND_INITIATED":
        return <span className="status-badge cancel">Refunded</span>;
      default:
        return <span className="status-badge pending">{status}</span>;
    }
  };

  return (
    <div>
      <div className="cards ticket-details">
        <div className="d-flex gap-3  align-items-center justify-content-between">
          <Link href="/MyTickets" className="back-btn">
            <img src="/img/arrow-left-white.svg" alt="Back" />
            Back to ticket
          </Link>
          <button className="common_btn" type="button">
            <img src="/img/share-icon.svg" className="me-2" alt="" />
            Share
          </button>
        </div>
        <div ref={ticketRef} style={{ padding: "20px 0" }}>
          <Row>
            <Col md={2}>
              <div className="ticket-dtl-card">
                <div className="ticket-dtl-card-img">
                  <img
                    src={getFullImageUrl(ticketInfo?.eventId?.posterImage?.[0])}
                    alt="Ticket Icon"
                  />
                </div>
                <h3>{ticketInfo?.eventId?.eventTitle}</h3>
              </div>
            </Col>
            <Col md={10}>
              <div className="ticket-dtl-main">
                <div className="tickt-dtl-info">
                  <h4>Ticket Details</h4>
                  <div
                    className="tickt-dtl-info-btns"
                    data-html2canvas-ignore="true">
                    {/* <button className="refund-btn" type="button">
                    <img src="/img/history-icon.svg" className="me-2" alt="" />
                    Refound ticket
                  </button> */}
                    <button
                      className="common_btn"
                      type="button"
                      onClick={handleDownloadTicket}>
                      <img
                        src="/img/download-arrow.svg"
                        className="me-2"
                        alt=""
                      />
                      Download ticket
                    </button>
                  </div>
                </div>
                <div className="tickt-dtl-bottom">
                  <div>
                    <h6>Order Tracking Code</h6>
                    <p>{ticketInfo?.bookingId}</p>
                  </div>
                  <div>
                    <h6>Order Date</h6>
                    <p>
                      {ticketInfo?.createdAt
                        ? new Date(ticketInfo.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          },
                        )
                        : "N/A"}
                    </p>
                  </div>
                  <div>{getStatusBadge(ticketInfo?.status)}</div>
                </div>
              </div>
            </Col>
          </Row>
          <div className="event-dtl">
            <h4 className="line-title">
              <span>Event Details</span>
            </h4>
            <div className="event-dtl-innr">
              <div>
                <h6>
                  <img src="/img/Map-Point.svg" alt="" />
                  Location
                </h6>
                <p>
                  {ticketInfo?.eventId?.venueAddress?.address},
                  {ticketInfo?.eventId?.venueAddress?.city},
                  {ticketInfo?.eventId?.venueAddress?.state}{" "}
                  {ticketInfo?.eventId?.venueAddress?.country}
                </p>
              </div>

              <div>
                <h6>
                  <img src="/img/white-calendar.svg" alt="" /> Event Date
                </h6>
                <p>
                  <span>
                    {ticketInfo?.eventId?.startDate
                      ? new Date(
                        ticketInfo.eventId.startDate,
                      ).toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })
                      : "N/A"}
                  </span>{" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="4"
                    height="4"
                    viewBox="0 0 4 4"
                    fill="none">
                    <circle cx="2" cy="2" r="2" fill="#999999" />
                  </svg>{" "}
                  <span>
                    {ticketInfo?.eventId?.startTime
                      ? new Date().setHours(
                        ticketInfo.eventId.startTime.split(":")[0],
                        ticketInfo.eventId.startTime.split(":")[1],
                      ) &&
                        new Date().setHours(
                          ticketInfo.eventId.startTime.split(":")[0],
                          ticketInfo.eventId.startTime.split(":")[1],
                        ) &&
                        new Date()
                          .toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                          .replace(
                            new Date()
                              .toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .split(" ")[0] !== "Invalid"
                              ? ""
                              : "Invalid Date",
                            "",
                          ) === "Invalid Date"
                        ? ticketInfo?.eventId?.startTime
                        : new Date(
                          new Date().setHours(
                            ticketInfo.eventId.startTime.split(":")[0],
                            ticketInfo.eventId.startTime.split(":")[1],
                          ),
                        ).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : ""}
                  </span>
                </p>
              </div>

              {/* <div>
              <h6>
                <img src="/img/Chair.svg" alt="" />
                Selected Seat
              </h6>
              <p>
                <span>Section 324</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="5"
                  height="5"
                  viewBox="0 0 5 5"
                  fill="none"
                >
                  <circle cx="2.5" cy="2.5" r="2.5" fill="#B3B3B3" />
                </svg>
                <span>Row T</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="5"
                  height="5"
                  viewBox="0 0 5 5"
                  fill="none"
                >
                  <circle cx="2.5" cy="2.5" r="2.5" fill="#B3B3B3" />
                </svg>
                <span>Seats 29-30</span>
              </p>
            </div> */}
            </div>
          </div>
          <div className="payment-dtl">
            <h4 className="line-title">
              <span>Payment</span>
            </h4>
            <ul className="payment-dtl-innr">
              <li>
                <div>
                  <h6>Ticket count</h6>
                  <p>{ticketInfo?.qty} tickets</p>
                </div>
                <div>
                  <h6>Paid by</h6>
                  <p>
                    {ticketInfo?.userId?.firstName}{" "}
                    {ticketInfo?.userId?.lastName}
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h6>Transaction costs</h6>
                  <p>${ticketInfo?.eventId?.ticketPrice}</p>
                </div>
                <div>
                  <h6>Payment method</h6>
                  <p>Stripe</p>
                </div>
              </li>
              <li>
                <div>
                  <h6>Total paid</h6>
                  <p>${ticketInfoFull?.ticket?.totalAmount}</p>
                </div>
                <div>
                  <h6>Transaction ID</h6>
                  <p>{ticketInfoFull?.ticket?._id}</p>
                </div>
              </li>
              <li className="d-flex justify-content-center">
                {ticketInfoFull?.ticket?.qrCodeData ? (
                  <div
                    style={{
                      background: "white",
                      padding: "16px",
                      marginBottom: "16px",
                    }}>
                    <QRCode
                      value={ticketInfoFull.ticket.qrCodeData}
                      size={150}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                      viewBox={`0 0 256 256`}
                    />
                  </div>
                ) : (
                  <img src="/img/barcode-ticket.svg" alt="Barcode" />
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicketDetails />
    </Suspense>
  );
}
