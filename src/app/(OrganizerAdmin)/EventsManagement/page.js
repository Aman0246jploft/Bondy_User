"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Col, Row, Tabs, Tab, Form, Modal, Spinner } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import eventApi from "@/api/eventApi";
import promotionsApi from "@/api/promotionsApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { formatTime } from "@/utils/timeHelper";

function page() {
  const { t, language } = useLanguage();
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
      if (response?.data) {
        setStats({
          totalRevenue: response?.data?.totalRevenue,
          totalAttendees: response?.data?.totalAttendees,
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
      };

      if (activeTab === "drafts") {
        params.isDraft = "true";
      } else {
        params.isDraft = "false";
        params.status = activeTab === "all" ? "" : activeTab;
      }

      const response = await eventApi.getOrganizerEvents(params);
      if (response?.data) {
        setEvents(response?.data?.events);
        setPagination((prev) => ({
          ...prev,
          total: response?.data?.total,
          page: response?.data?.page,
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
    document.title = "Events Management - Bondy";
  }, [pagination.page, activeTab]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleTabSelect = (k) => {
    setActiveTab(k);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const locale = language === "mn" ? "mn-MN" : "en-US";

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
      toast.error(t("failedToLoadPromotionPackages"));
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
      toast.error(t("pleaseSelectPromotionPackageFirst"));
      return;
    }
    setCheckingOut(true);
    try {
      const res = await promotionsApi.checkoutEventPromotion({
        eventId: selectedEvent._id,
        packageId: selectedPackage._id,
      });
      if (res?.status) {
        toast.success(t("promotionActivatedSuccessfully"));
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
            onClick={() => clearEventData()}>
            {t("createNew")}
          </Link>
        </div>
        <Row>
          <Col lg={4} xs={6}>
            <div className="event-cards">
              <h5>{t("totalRevenue")}</h5>
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
              <Tab eventKey="drafts" title={t("draftEvents") || "Drafts"} />
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
                  !event.isDraft &&
                  (status === "past" || new Date(event.endDate) < new Date());

                return (
                  <div className="ticket-cards" key={event._id}>
                    <div className="ticket-inner">
                      <div className="ticket-lft">
                        {/* <Form.Check /> */}
                        <div className="event-info-box-img">
                          <img
                            src={
                              event.posterImage?.[0] || "/img/sidebar-logo.svg"
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
                                style={{ maxWidth: "250px" }}>
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
                                  }}>
                                  ⭐ {t("featured")}
                                </span>
                              )}
                            </h5>
                            <p
                              className="ref text-truncate-1"
                              style={{ maxWidth: "300px" }}>
                              {event.eventCategory?.name || "General"}
                            </p>
                            {isFeaturedActive(event) && (
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#fda085",
                                  margin: 0,
                                }}>
                                {t("featuredUntil")}{" "}
                                {new Date(
                                  event.featuredExpiry,
                                ).toLocaleDateString(locale, {
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
                          className={`status-badge ${event.isDraft ? "pending" : event.status?.toLowerCase() || "upcoming"}`}>
                          {event.isDraft
                            ? t("draftLabel") || "Draft"
                            : t(event.status?.toLowerCase()) ||
                            event.status ||
                            t("upcoming")}
                        </span>
                        <p
                          className="text-truncate-1"
                          style={{ maxWidth: "200px" }}>
                          {t("venue")} <span>{event.venueName || "TBD"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="ticket-bottom">
                      <p>
                        {t("createDate")}{" "}
                        <span>
                          {new Date(event.createdAt).toLocaleDateString(
                            locale,
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
                            fill="none">
                            <circle cx="2" cy="2" r="2" fill="#999999" />
                          </svg>
                        </span>{" "}
                        <span>
                          {formatTime(
                            new Date(event.startDate)
                              .toTimeString()
                              .slice(0, 5),
                            true,
                            language,
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
                      {!event.isDraft && (
                        <Link href={`/EventDetailOrganiser?eventId=${event._id}`}>
                          {t("Info")}{" "}
                          <img src="/img/Arrow-Right.svg" alt="arrow" />
                        </Link>
                      )}
                      {event.status?.toLowerCase() === "upcoming" && !event.isDraft &&
                        (isFeaturedActive(event) ? (
                          <span
                            style={{
                              color: "#fda085",
                              fontSize: "13px",
                              fontWeight: 500,
                            }}>
                            ⭐ {t("activePromotion") || "Active Promotion"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="custom-btn"
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                            onClick={() => openPromoModal(event)}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none">
                              <g clip-path="url(#clip0_6054_9586)">
                                <path
                                  d="M14.766 8.71912C15.2467 8.39697 15.5914 7.91639 15.7434 7.34924C15.9095 6.72932 15.8253 6.08353 15.5062 5.53084C15.1871 4.97814 14.6699 4.58228 14.05 4.41615C13.4829 4.2642 12.8943 4.3224 12.375 4.57764L11.0369 2.25994C10.752 1.76654 10.2404 1.47896 9.67233 1.48865C9.10276 1.49908 8.60358 1.80584 8.33686 2.30924C8.1496 2.66291 7.9737 3.03029 7.78749 3.41928C7.02854 5.00463 6.16835 6.8015 4.3087 7.87517L1.91913 9.25478C1.09659 9.72967 0.507409 10.4995 0.260065 11.4225C0.0127606 12.3455 0.138073 13.3069 0.612956 14.1294C1.27315 15.2729 2.4751 15.9129 3.70936 15.9129C4.15952 15.9129 4.61393 15.8276 5.048 15.6507L6.7185 18.5441C7.06413 19.1427 7.69319 19.4777 8.33928 19.4777C8.65592 19.4777 8.97671 19.3972 9.2701 19.2278C9.70085 18.9791 10.0094 18.5762 10.1388 18.0932C10.2682 17.6102 10.2025 17.107 9.95378 16.6762L8.31003 13.8292C10.0406 13.0064 11.8571 13.146 13.4744 13.271C13.9048 13.3043 14.3112 13.3357 14.7115 13.3504C15.28 13.3707 15.7961 13.0922 16.0898 12.6041C16.3836 12.116 16.389 11.5301 16.1041 11.0367L14.766 8.719L14.766 8.71912ZM13.7973 5.35943C14.1652 5.45803 14.4718 5.69228 14.6605 6.01912C15.0247 6.65002 14.8482 7.44689 14.2761 7.87041L12.865 5.42639C13.1571 5.29955 13.4825 5.27506 13.7973 5.35943H13.7973ZM3.70776 14.9366C2.81135 14.9365 1.93823 14.4717 1.45874 13.6411C1.11428 13.0445 1.02358 12.3463 1.20342 11.6753C1.38323 11.0042 1.81085 10.445 2.40745 10.1005L4.37436 8.96494L6.96866 13.4529L4.99936 14.5899C4.59217 14.8249 4.14725 14.9366 3.70776 14.9366ZM9.19553 17.8405C9.13366 18.0715 8.98671 18.2638 8.78186 18.3821C8.35624 18.6278 7.81003 18.4815 7.56424 18.0559L5.91046 15.1914L7.45428 14.3001L9.10807 17.1645C9.22635 17.3694 9.25741 17.6095 9.19549 17.8405H9.19553ZM15.2532 12.1006C15.1421 12.2851 14.9631 12.3828 14.7472 12.3745C14.3668 12.3606 13.9699 12.3299 13.5498 12.2974C11.7848 12.1611 9.80038 12.0081 7.8228 12.9791L5.21171 8.46213C7.04358 7.23369 7.90374 5.43814 8.66835 3.84099C8.85014 3.46119 9.0219 3.10244 9.19987 2.76635C9.30069 2.57599 9.47483 2.469 9.69018 2.4651C9.69424 2.46502 9.69831 2.46498 9.70237 2.46498C9.91221 2.46498 10.0855 2.56525 10.1912 2.74826L15.2585 11.5252C15.3662 11.7117 15.3644 11.9161 15.2532 12.1006L15.2532 12.1006ZM13.9848 2.51326L14.9932 0.766698C15.128 0.533143 15.4266 0.453104 15.6601 0.587987C15.8937 0.722831 15.9737 1.02146 15.8389 1.25498L14.8305 3.00154C14.7401 3.15818 14.5759 3.24576 14.4072 3.24576C14.3243 3.24576 14.2404 3.22467 14.1635 3.18025C13.9299 3.04541 13.8499 2.74678 13.9848 2.51326ZM18.5181 4.35568L16.7293 5.38849C16.6524 5.43287 16.5684 5.454 16.4856 5.454C16.3169 5.454 16.1528 5.36642 16.0623 5.20978C15.9274 4.97623 16.0075 4.6776 16.241 4.54279L18.0298 3.50998C18.2633 3.3751 18.562 3.45517 18.6968 3.68869C18.8317 3.92221 18.7516 4.22088 18.5181 4.35568ZM19.8638 7.86889C19.8638 8.13853 19.6452 8.35717 19.3755 8.35717H17.3587C17.0891 8.35717 16.8705 8.13857 16.8705 7.86889C16.8705 7.5992 17.0891 7.3806 17.3587 7.3806H19.3755C19.6452 7.3806 19.8638 7.5992 19.8638 7.86889Z"
                                  fill="#FFC107"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_6054_9586">
                                  <rect width="20" height="20" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>{" "}
                            {t("promote")}
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div
              className="d-flex justify-content-between align-items-center px-3 py-3"
              style={{ borderTop: "1px solid #2a2a2a" }}>
              <span style={{ color: "#888", fontSize: 13 }}>
                {t("showingTransactions", {
                  start: Math.min(
                    (pagination.page - 1) * pagination.limit + 1,
                    pagination.total,
                  ),
                  end: Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  ),
                  total: pagination.total,
                })}
              </span>
              <div className="d-flex gap-2">
                <button
                  className="common_btn"
                  style={{ padding: "6px 14px", fontSize: 13 }}
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}>
                  ← {t("previous")}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - pagination.page) <= 1,
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{ alignSelf: "center", color: "#666" }}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className="common_btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: 13,
                          opacity: pagination.page === p ? 1 : 0.5,
                        }}>
                        {p}
                      </button>
                    ),
                  )}
                <button
                  className="common_btn"
                  style={{ padding: "6px 14px", fontSize: 13 }}
                  disabled={pagination.page === totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}>
                  {t("next")} →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- Promotion Modal ---- */}
      <Modal show={showPromoModal} onHide={closePromoModal} centered size="lg">
        <Modal.Header
          closeButton
          style={{ background: "#1a1a1a", border: "1px solid #333" }}>
          <Modal.Title style={{ color: "#fff" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none">
              <g clip-path="url(#clip0_6054_9586)">
                <path
                  d="M14.766 8.71912C15.2467 8.39697 15.5914 7.91639 15.7434 7.34924C15.9095 6.72932 15.8253 6.08353 15.5062 5.53084C15.1871 4.97814 14.6699 4.58228 14.05 4.41615C13.4829 4.2642 12.8943 4.3224 12.375 4.57764L11.0369 2.25994C10.752 1.76654 10.2404 1.47896 9.67233 1.48865C9.10276 1.49908 8.60358 1.80584 8.33686 2.30924C8.1496 2.66291 7.9737 3.03029 7.78749 3.41928C7.02854 5.00463 6.16835 6.8015 4.3087 7.87517L1.91913 9.25478C1.09659 9.72967 0.507409 10.4995 0.260065 11.4225C0.0127606 12.3455 0.138073 13.3069 0.612956 14.1294C1.27315 15.2729 2.4751 15.9129 3.70936 15.9129C4.15952 15.9129 4.61393 15.8276 5.048 15.6507L6.7185 18.5441C7.06413 19.1427 7.69319 19.4777 8.33928 19.4777C8.65592 19.4777 8.97671 19.3972 9.2701 19.2278C9.70085 18.9791 10.0094 18.5762 10.1388 18.0932C10.2682 17.6102 10.2025 17.107 9.95378 16.6762L8.31003 13.8292C10.0406 13.0064 11.8571 13.146 13.4744 13.271C13.9048 13.3043 14.3112 13.3357 14.7115 13.3504C15.28 13.3707 15.7961 13.0922 16.0898 12.6041C16.3836 12.116 16.389 11.5301 16.1041 11.0367L14.766 8.719L14.766 8.71912ZM13.7973 5.35943C14.1652 5.45803 14.4718 5.69228 14.6605 6.01912C15.0247 6.65002 14.8482 7.44689 14.2761 7.87041L12.865 5.42639C13.1571 5.29955 13.4825 5.27506 13.7973 5.35943H13.7973ZM3.70776 14.9366C2.81135 14.9365 1.93823 14.4717 1.45874 13.6411C1.11428 13.0445 1.02358 12.3463 1.20342 11.6753C1.38323 11.0042 1.81085 10.445 2.40745 10.1005L4.37436 8.96494L6.96866 13.4529L4.99936 14.5899C4.59217 14.8249 4.14725 14.9366 3.70776 14.9366ZM9.19553 17.8405C9.13366 18.0715 8.98671 18.2638 8.78186 18.3821C8.35624 18.6278 7.81003 18.4815 7.56424 18.0559L5.91046 15.1914L7.45428 14.3001L9.10807 17.1645C9.22635 17.3694 9.25741 17.6095 9.19549 17.8405H9.19553ZM15.2532 12.1006C15.1421 12.2851 14.9631 12.3828 14.7472 12.3745C14.3668 12.3606 13.9699 12.3299 13.5498 12.2974C11.7848 12.1611 9.80038 12.0081 7.8228 12.9791L5.21171 8.46213C7.04358 7.23369 7.90374 5.43814 8.66835 3.84099C8.85014 3.46119 9.0219 3.10244 9.19987 2.76635C9.30069 2.57599 9.47483 2.469 9.69018 2.4651C9.69424 2.46502 9.69831 2.46498 9.70237 2.46498C9.91221 2.46498 10.0855 2.56525 10.1912 2.74826L15.2585 11.5252C15.3662 11.7117 15.3644 11.9161 15.2532 12.1006L15.2532 12.1006ZM13.9848 2.51326L14.9932 0.766698C15.128 0.533143 15.4266 0.453104 15.6601 0.587987C15.8937 0.722831 15.9737 1.02146 15.8389 1.25498L14.8305 3.00154C14.7401 3.15818 14.5759 3.24576 14.4072 3.24576C14.3243 3.24576 14.2404 3.22467 14.1635 3.18025C13.9299 3.04541 13.8499 2.74678 13.9848 2.51326ZM18.5181 4.35568L16.7293 5.38849C16.6524 5.43287 16.5684 5.454 16.4856 5.454C16.3169 5.454 16.1528 5.36642 16.0623 5.20978C15.9274 4.97623 16.0075 4.6776 16.241 4.54279L18.0298 3.50998C18.2633 3.3751 18.562 3.45517 18.6968 3.68869C18.8317 3.92221 18.7516 4.22088 18.5181 4.35568ZM19.8638 7.86889C19.8638 8.13853 19.6452 8.35717 19.3755 8.35717H17.3587C17.0891 8.35717 16.8705 8.13857 16.8705 7.86889C16.8705 7.5992 17.0891 7.3806 17.3587 7.3806H19.3755C19.6452 7.3806 19.8638 7.5992 19.8638 7.86889Z"
                  fill="#FFC107"
                />
              </g>
              <defs>
                <clipPath id="clip0_6054_9586">
                  <rect width="20" height="20" fill="white" />
                </clipPath>
              </defs>
            </svg>
            {t("promote")}:{" "}
            <span
              className="text-truncate-1"
              style={{
                color: "#23ada4",
                maxWidth: "400px",
                display: "inline-block",
                verticalAlign: "bottom",
              }}>
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
                        }}>
                        <h5
                          className="text-truncate-1"
                          style={{ color: "#fff", marginBottom: "4px", textTransform: "capitalize" }}>
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
                            textTransform: "capitalize"
                          }}>
                          {pkg.durationInDays} {t("daysSuffix") || "days"}
                        </p>
                        {pkg.placements?.length > 0 && (
                          <ul style={{ paddingLeft: "16px", margin: 0, textTransform: "capitalize" }}>
                            {pkg.placements.map((p, i) => (
                              <li
                                key={i}
                                style={{
                                  color: "#ccc",
                                  fontSize: "12px",
                                  marginBottom: "4px",
                                }}>
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
                            }}>
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
                  }}>
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
          }}>
          <button
            className="outline-btn"
            onClick={closePromoModal}
            style={{ padding: "10px 24px" }}>
            {t("discard") || "Cancel"}
          </button>
          <button
            className="custom-btn"
            onClick={handleCheckout}
            disabled={!selectedPackage || checkingOut}
            style={{ minWidth: "140px" }}>
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
