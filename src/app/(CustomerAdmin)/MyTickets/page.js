"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Tabs, Tab, Form, Button } from "react-bootstrap";
import bookingApi from "@/api/bookingApi";

function page() {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchTickets = async (tab, page) => {
    setLoading(true);
    try {
      let params = { page, limit: 10 };

      if (tab === "all") {
        params.status = "PAID,PENDING,CANCELLED,REFUND_INITIATED,FAILED";
      } else if (tab === "upcoming") {
        params.status = "PAID";
        params.type = "upcoming";
      } else if (tab === "past") {
        params.status = "PAID";
        params.type = "past";
      } else if (tab === "canceled") {
        params.status = "CANCELLED,FAILED,REFUND_INITIATED";
      }

      const res = await bookingApi.getTicketList(params);
      if (res.status && res.data) {
        setTickets(res.data.tickets);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(activeTab, currentPage);
  }, [activeTab, currentPage]);

  const handleTabSelect = (k) => {
    setActiveTab(k);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const getEventDetails = (ticket) => {
    const item = ticket.eventId || ticket.courseId;
    if (!item) return { title: "Unknown Event", date: "N/A" };

    const title = ticket.bookingType === "EVENT" ? item.eventTitle : item.courseTitle;
    let dateStr = ticket.bookingType === "EVENT" ? item.startDate : item.createdAt;

    try {
      if (dateStr) {
        const d = new Date(dateStr);
        dateStr = d.toLocaleDateString("en-US", { weekday: 'short', day: 'numeric', month: 'short' }) +
          " " + d.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });
      }
    } catch (e) {
      dateStr = "N/A";
    }
    return { title, dateStr };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID": return <span className="status-badge complete">Confirmed</span>;
      case "PENDING": return <span className="status-badge pending">Pending</span>;
      case "CANCELLED": return <span className="status-badge cancel">Canceled</span>;
      case "FAILED": return <span className="status-badge cancel">Failed</span>;
      case "REFUND_INITIATED": return <span className="status-badge cancel">Refunded</span>;
      default: return <span className="status-badge pending">{status}</span>;
    }
  };

  const renderTicketList = () => {
    if (loading) return <div className="text-center p-5">Loading tickets...</div>;

    if (tickets.length === 0) {
      return <div className="text-center p-5 text-muted">No tickets found.</div>;
    }

    return (
      <div className="ticket-listing">
        {tickets.map((ticket) => {
          const { title, dateStr } = getEventDetails(ticket);
          return (
            <div className="ticket-cards" key={ticket._id}>
              <div className="ticket-inner">
                <div className="ticket-lft">
                  <Form.Check />
                  <div>
                    <h5>{title}</h5>
                    <p className="ref"># {ticket.bookingId}</p>
                  </div>
                </div>
                <div className="ticket-rgt">
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
              <div className="ticket-bottom">
                <p>
                  Booking Date <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>{" "}
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="4"
                      height="4"
                      viewBox="0 0 4 4"
                      fill="none"
                    >
                      <circle cx="2" cy="2" r="2" fill="#999999" />
                    </svg>
                  </span>{" "}
                  <span>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </p>
                <p>
                  Total paid <span>${ticket.totalAmount}</span>
                </p>
                <p>
                  <span>
                    <img src="/img/ticket-white.svg" />
                  </span>{" "}
                  <span>{ticket.qty} tickets</span>
                </p>
                <Link href={`/TicketDetails?id=${ticket._id}`}>
                  Ticket Details <img src="/img/Arrow-Right.svg" />
                </Link>
              </div>
            </div>
          );
        })}
        {pagination?.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <Button
              variant="outline-secondary"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span>Page {currentPage} of {pagination.totalPages}</span>
            <Button
              variant="outline-secondary"
              onClick={handleNextPage}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="cards my-tickets">
        <div className="card-title">
          <h3>My Tickets</h3>
        </div>
        <div className="ticket-tabs">
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabSelect}
            className="mb-3"
          >
            <Tab eventKey="all" title="All">
              {activeTab === "all" && renderTicketList()}
            </Tab>
            <Tab eventKey="upcoming" title="Upcoming">
              {activeTab === "upcoming" && renderTicketList()}
            </Tab>
            <Tab eventKey="past" title="Past">
              {activeTab === "past" && renderTicketList()}
            </Tab>
            <Tab eventKey="canceled" title="Canceled">
              {activeTab === "canceled" && renderTicketList()}
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default page;
