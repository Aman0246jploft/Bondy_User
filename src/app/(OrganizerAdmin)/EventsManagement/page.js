"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Col, Row, Tabs, Tab, Form, Pagination } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import eventApi from "@/api/eventApi";

function page() {
  const { clearEventData } = useEventContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [stats, setStats] = useState({ totalRevenue: 0, totalAttendees: 0 });

  const fetchStats = async () => {
    try {
      const response = await eventApi.getOrganizerStats();
      if (response.data) {
        setStats({
          totalRevenue: response.data.totalRevenue,
          totalAttendees: response.data.totalAttendees,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab === "all" ? "" : activeTab,
      };

      const response = await eventApi.getOrganizerEvents(params);
      if (response.data) {
        setEvents(response.data.events);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total,
          page: response.data.page,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [pagination.page, activeTab]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleTabSelect = (k) => {
    setActiveTab(k);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">Program Management</h2>
            <p className="card-desc">
              Welcome back, Alex! Here's a snapshot of your events and tasks.
            </p>
          </div>

          <Link
            href="/BasicInfo"
            className="custom-btn"
            onClick={() => clearEventData()}>
            Create New
          </Link>
        </div>
        <Row>
          <Col lg={4} xs={6}>
            <div className="event-cards">
              <h5>Total Revenue</h5>
              <h3>${stats.totalRevenue?.toLocaleString() || 0}</h3>
              <p>+15%</p>
            </div>
          </Col>
          <Col lg={4} xs={6}>
            <div className="event-cards">
              <h5>Total Attendees</h5>
              <h3>{stats.totalAttendees?.toLocaleString() || 0}</h3>
              <p>+10%</p>
            </div>
          </Col>
          <Col lg={4} xs={6}>
            <div className="event-cards">
              <h5>Average Rating</h5>
              <h3>1300</h3>
              <p>+10%</p>
            </div>
          </Col>
        </Row>
        <div className="ticket-tabs">
          <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap">
            <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="">
              <Tab eventKey="all" title="All" />
              <Tab eventKey="upcoming" title="Upcoming" />
              <Tab eventKey="ongoing" title="Ongoing" />
              <Tab eventKey="past" title="Past" />
            </Tabs>
            <div className="dashboard-filter">
              <div>
                <select className="form-select">
                  <option>Sort by</option>
                  <option>Latest</option>
                  <option>Soonest</option>
                </select>
              </div>
            </div>
          </div>

          <div className="ticket-listing">
            {loading ? (
              <p className="text-center py-5">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-center py-5">No events found.</p>
            ) : (
              events.map((event) => (
                <div className="ticket-cards" key={event._id}>
                  <div className="ticket-inner">
                    <div className="ticket-lft">
                      <Form.Check />
                      <div className="event-info-box-img">
                        <img
                          src={
                            event.posterImage?.[0] || "/img/details_img02.png"
                          }
                          alt={event.eventTitle}
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                        <div>
                          <h5>{event.eventTitle}</h5>
                          <p className="ref">
                            {event.eventCategory?.name || "General"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ticket-rgt">
                      <span
                        className={`status-badge ${event.status?.toLowerCase() || "upcoming"}`}>
                        {event.status || "Upcoming"}
                      </span>
                      <p>
                        Venue <span>{event.venueName || "TBD"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="ticket-bottom">
                    <p>
                      Create Date{" "}
                      <span>
                        {new Date(event.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>{" "}
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="4"
                          height="4"
                          viewBox="0 0 4 4"
                          fill="none">
                          <circle cx="2" cy="2" r="2" fill="#999999" />
                        </svg>
                      </span>{" "}
                      <span>
                        {new Date(event.startDate).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    <p>
                      Total Booking Revenue{" "}
                      <span>${event.totalRevenue?.toLocaleString() || 0}</span>
                    </p>
                    <p>
                      <span>
                        <img src="/img/ticket-white.svg" alt="ticket" />
                      </span>{" "}
                      <span>{event.totalTickets || 0} tickets</span>
                    </p>
                    <Link href={`/EventDetails/${event._id}`}>
                      Event Details{" "}
                      <img src="/img/Arrow-Right.svg" alt="arrow" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                />

                {[...Array(totalPages)].map((_, idx) => (
                  <Pagination.Item
                    key={idx + 1}
                    active={idx + 1 === pagination.page}
                    onClick={() => handlePageChange(idx + 1)}>
                    {idx + 1}
                  </Pagination.Item>
                ))}

                <Pagination.Next
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(totalPages)}
                  disabled={pagination.page === totalPages}
                />
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default page;
