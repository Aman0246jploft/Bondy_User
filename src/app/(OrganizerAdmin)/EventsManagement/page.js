"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  Col,
  Row,
  Tabs,
  Tab,
  Form,
  Pagination,
  Modal,
  Spinner,
} from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import eventApi from "@/api/eventApi";
import promotionsApi from "@/api/promotionsApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

function page() {
  const { t } = useLanguage();
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

  // Promotion modal state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [promoPackages, setPromoPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

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

  // ---- Promotion Modal Handlers ----
  const isFeaturedActive = (event) =>
    event.isFeatured &&
    event.featuredExpiry &&
    new Date(event.featuredExpiry) > new Date();

  const openPromoModal = async (event) => {
    setSelectedEvent(event);
    setSelectedPackage(null);
    setShowPromoModal(true);
    setLoadingPackages(true);
    try {
      const res = await promotionsApi.getEventPackages();
      if (res?.status) {
        setPromoPackages(res?.data?.packages || []);
      }
    } catch (err) {
      toast.error("Failed to load promotion packages");
    } finally {
      setLoadingPackages(false);
    }
  };

  const closePromoModal = () => {
    setShowPromoModal(false);
    setSelectedEvent(null);
    setSelectedPackage(null);
    setPromoPackages([]);
  };

  const handleCheckout = async () => {
    if (!selectedPackage) {
      toast.error("Please select a promotion package first.");
      return;
    }
    setCheckingOut(true);
    try {
      const res = await promotionsApi.checkoutEventPromotion({
        eventId: selectedEvent._id,
        packageId: selectedPackage._id,
      });
      if (res?.status) {
        toast.success("Promotion activated successfully! 🎉");
        closePromoModal();
        fetchEvents();
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Checkout failed. Please try again.",
      );
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">{t("programManagement")}</h2>
            <p className="card-desc">
              {t("heyUser")}, {t("welcomeBackSnapshot")}
            </p>
          </div>

          <Link
            href="/BasicInfo"
            className="custom-btn"
            onClick={() => clearEventData()}
          >
            {t("createNew")}
          </Link>
        </div>
        <Row>
          <Col lg={4} xs={6}>
            <div className="event-cards">
              <h5>{t("Total Revenue")}</h5>
              <h3>₮{stats.totalRevenue?.toLocaleString() || 0}</h3>
              {/* <p>+15%</p> */}
            </div>
          </Col>
          <Col lg={4} xs={6}>
            <div className="event-cards">
              <h5>{t("totalAttendees")}</h5>
              <h3>{stats.totalAttendees?.toLocaleString() || 0}</h3>
              {/* <p>+10%</p> */}
            </div>
          </Col>
          {/* <Col lg={4} xs={6}>
            <div className="event-cards">
              <h5>Average Rating</h5>
              <h3>1300</h3>
              <p>+10%</p>
            </div>
          </Col> */}
        </Row>
        <div className="ticket-tabs">
          <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap">
            <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="">
              <Tab eventKey="all" title={t("all")} />
              <Tab eventKey="upcoming" title={t("upcoming")} />
              <Tab eventKey="ongoing" title={t("ongoing")} />
              <Tab eventKey="past" title={t("past")} />
            </Tabs>
            {/* <div className="dashboard-filter">
              <div>
                <select className="form-select">
                  <option>Sort by</option>
                  <option>Latest</option>
                  <option>Soonest</option>  
                </select>
              </div>
            </div> */}
          </div>

          <div className="ticket-listing">
            {loading ? (
              <p className="text-center py-5">{t("loadingTickets")}</p>
            ) : events.length === 0 ? (
              <p className="text-center py-5">{t("noTicketsFound")}</p>
            ) : (
              events.map((event) => {
                const status = event.status?.toLowerCase();
                const isPastOrEnded =
                  status === "past" || new Date(event.endDate) < new Date();

                return (
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
                            onError={(e) => {
                              e.target.src = "/img/sidebar-logo.svg";
                            }}
                          />
                          <div>
                            <h5 className="d-flex align-items-center gap-2 flex-wrap">
                              <span
                                className="text-truncate-1"
                                style={{ maxWidth: "250px" }}
                              >
                                {event.eventTitle}
                              </span>
                              {isFeaturedActive(event) && (
                                <span
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #f6d365, #fda085)",
                                    color: "#fff",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    padding: "2px 10px",
                                    borderRadius: "20px",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  ⭐ {t("featured")}
                                </span>
                              )}
                            </h5>
                            <p
                              className="ref text-truncate-1"
                              style={{ maxWidth: "300px" }}
                            >
                              {event.eventCategory?.name || "General"}
                            </p>
                            {isFeaturedActive(event) && (
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#fda085",
                                  margin: 0,
                                }}
                              >
                                {t("featuredUntil")}{" "}
                                {new Date(
                                  event.featuredExpiry,
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ticket-rgt">
                        <span
                          className={`status-badge ${event.status?.toLowerCase() || "upcoming"}`}
                        >
                          {t(event.status?.toLowerCase()) ||
                            event.status ||
                            t("upcoming")}
                        </span>
                        <p
                          className="text-truncate-1"
                          style={{ maxWidth: "200px" }}
                        >
                          {t("venue")} <span>{event.venueName || "TBD"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="ticket-bottom">
                      <p>
                        {t("createDate")}{" "}
                        <span>
                          {new Date(event.createdAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </span>{" "}
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
                        <span>
                          {new Date(event.startDate).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </p>
                      <p>
                        {t("totalBookingRevenue")}{" "}
                        <span>
                          ₮{event.totalRevenue?.toLocaleString() || 0}
                        </span>
                      </p>
                      <p>
                        <span>
                          <img src="/img/ticket-white.svg" alt="ticket" />
                        </span>{" "}
                        <span>
                          {event.totalTickets || 0} {t("ticketsSuffix")}
                        </span>
                      </p>
                      {!isPastOrEnded && (
                        <Link href={`/BasicInfo?eventId=${event._id}`}>
                          {t("edit")}{" "}
                          <img src="/img/Arrow-Right.svg" alt="arrow" />
                        </Link>
                      )}
                      <Link href={`/EventDetailOrganiser?eventId=${event._id}`}>
                        {t("Info")}{" "}
                        <img src="/img/Arrow-Right.svg" alt="arrow" />
                      </Link>
                      {!isPastOrEnded &&
                        (isFeaturedActive(event) ? (
                          <span
                            style={{
                              color: "#fda085",
                              fontSize: "13px",
                              fontWeight: 500,
                            }}
                          >
                            ⭐ {t("activePromotion") || "Active Promotion"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="custom-btn"
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                            onClick={() => openPromoModal(event)}
                          >
                            🚀 {t("promote")}
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })
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
                    onClick={() => handlePageChange(idx + 1)}
                  >
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

      {/* ---- Promotion Modal ---- */}
      <Modal show={showPromoModal} onHide={closePromoModal} centered size="lg">
        <Modal.Header
          closeButton
          style={{ background: "#1a1a1a", border: "1px solid #333" }}
        >
          <Modal.Title style={{ color: "#fff" }}>
            🚀 {t("promote")}:{" "}
            <span
              className="text-truncate-1"
              style={{
                color: "#23ada4",
                maxWidth: "400px",
                display: "inline-block",
                verticalAlign: "bottom",
              }}
            >
              {selectedEvent?.eventTitle}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#1a1a1a", padding: "24px" }}>
          {loadingPackages ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3" style={{ color: "#999" }}>
                {t("loading") || "Loading packages..."}
              </p>
            </div>
          ) : promoPackages.length === 0 ? (
            <p className="text-center py-4" style={{ color: "#999" }}>
              {t("noPackagesAvailable") ||
                "No active promotion packages available at the moment."}
            </p>
          ) : (
            <>
              <p style={{ color: "#999", marginBottom: "20px" }}>
                {t("selectPlanBoost") ||
                  "Select a plan to boost visibility on the Discover Feed and Homepage."}
              </p>
              <Row className="gx-3 gy-3">
                {promoPackages.map((pkg) => {
                  const isSelected = selectedPackage?._id === pkg._id;
                  return (
                    <Col md={4} xs={12} key={pkg._id}>
                      <div
                        onClick={() => setSelectedPackage(pkg)}
                        style={{
                          background: isSelected
                            ? "rgba(35,173,164,0.12)"
                            : "#242424",
                          border: `2px solid ${isSelected ? "#23ada4" : "#333"}`,
                          borderRadius: "16px",
                          padding: "20px",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          height: "100%",
                        }}
                      >
                        <h5
                          className="text-truncate-1"
                          style={{ color: "#fff", marginBottom: "4px" }}
                        >
                          {pkg.name}
                        </h5>
                        <h3 style={{ color: "#23ada4", margin: "8px 0" }}>
                          ₮{pkg.price?.toLocaleString()}
                        </h3>
                        <p
                          style={{
                            color: "#999",
                            fontSize: "13px",
                            marginBottom: "12px",
                          }}
                        >
                          {pkg.durationInDays} {t("daysSuffix") || "days"}
                        </p>
                        {pkg.placements?.length > 0 && (
                          <ul style={{ paddingLeft: "16px", margin: 0 }}>
                            {pkg.placements.map((p, i) => (
                              <li
                                key={i}
                                style={{
                                  color: "#ccc",
                                  fontSize: "12px",
                                  marginBottom: "4px",
                                }}
                              >
                                {p}
                              </li>
                            ))}
                          </ul>
                        )}
                        {isSelected && (
                          <div
                            style={{
                              marginTop: "12px",
                              color: "#23ada4",
                              fontWeight: 600,
                              fontSize: "13px",
                            }}
                          >
                            ✓ {t("selected") || "Selected"}
                          </div>
                        )}
                      </div>
                    </Col>
                  );
                })}
              </Row>

              {selectedPackage && (
                <div
                  style={{
                    background: "#242424",
                    border: "1px solid #333",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginTop: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ color: "#999", margin: 0, fontSize: "13px" }}>
                      {t("selectedPlan") || "Selected Plan"}
                    </p>
                    <p style={{ color: "#fff", margin: 0, fontWeight: 600 }}>
                      {selectedPackage.name} — {selectedPackage.durationInDays}{" "}
                      {t("daysSuffix") || "days"}
                    </p>
                  </div>
                  <h4 style={{ color: "#23ada4", margin: 0 }}>
                    ₮{selectedPackage.price?.toLocaleString()}
                  </h4>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            gap: "12px",
          }}
        >
          <button
            className="outline-btn"
            onClick={closePromoModal}
            style={{ padding: "10px 24px" }}
          >
            {t("discard") || "Cancel"}
          </button>
          <button
            className="custom-btn"
            onClick={handleCheckout}
            disabled={!selectedPackage || checkingOut}
            style={{ minWidth: "140px" }}
          >
            {checkingOut ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {t("submitting")}
              </>
            ) : (
              t("confirmPay") || "Confirm & Pay"
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default page;
