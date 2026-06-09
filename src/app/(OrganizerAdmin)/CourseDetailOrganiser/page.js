"use client";
import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import courseApi from "@/api/courseApi";
import bookingApi from "@/api/bookingApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatTime } from "@/utils/timeHelper";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

function ExpandableText({ text, limit = 200, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();
  if (!text) return <p className={className} style={{ color: "#666", fontStyle: "italic" }}>N/A</p>;

  const shouldShowToggle = text.length > limit;
  const displayText = isExpanded || !shouldShowToggle ? text : `${text.substring(0, limit)}...`;

  return (
    <div className={className}>
      <p style={{ whiteSpace: "pre-line", margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.6" }}>{displayText}</p>
      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 border-0 bg-transparent p-0"
          style={{ fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#23ada4", transition: "all 0.2s" }}
        >
          {isExpanded ? (t("viewLess") || "View Less") : (t("viewMore") || "View More")}
        </button>
      )}
    </div>
  );
}

function CourseDetailsContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotAttendees, setSlotAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesTotal, setAttendeesTotal] = useState(0);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState("course"); // "course" | "slot"
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const { t, language } = useLanguage();
  const locale = language === "mn" ? "mn-MN" : "en-GB";

  const fetchSlotAttendees = async (slot) => {
    setSelectedSlot(slot);
    setDrawerOpen(true);
    setAttendeesLoading(true);
    setSlotAttendees([]);
    try {
      const params = { limit: 50 };
      if (slot.batchId) params.batchId = slot.batchId;
      const res = await bookingApi.getCourseAttendees(courseId, params);
      if (res?.status && res?.data) {
        setSlotAttendees(res.data.attendees || []);
        setAttendeesTotal(res.data.totalAttendees || 0);
      }
    } catch (err) {
      console.error("Failed to fetch slot attendees", err);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleCancelCourse = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a reason for cancellation");
      return;
    }

    try {
      setIsCancelling(true);
      const payload = { courseId: course._id, reason: cancelReason };
      if (cancelMode === "slot" && selectedSlot) {
        payload.batchId = selectedSlot.batchId;
        payload.date = selectedSlot.date.split("T")[0]; // YYYY-MM-DD
      }

      const res = await bookingApi.cancelCourse(payload);
      if (res?.status) {
        toast.success(res.message || "Cancelled successfully");
        setCancelModalOpen(false);
        setCancelReason("");
        if (cancelMode === "slot") setSelectedSlot(null);
        fetchDetails(); // refresh details
      } else {
        toast.error(res?.message || "Failed to cancel course");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel course");
    } finally {
      setIsCancelling(false);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await courseApi.getCourseDetails(courseId);
      if (response && response?.data) {
        setCourse(response?.data);
      }
    } catch (error) {
      console.error("Failed to fetch course details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchDetails();
    }
  }, [courseId]);

  useEffect(() => {
    if (course) {
      document.title = `${course.courseTitle || "Course Details"} - Control Center`;
    } else {
      document.title = "Course Details - Bondy";
    }
  }, [course]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <Spinner animation="border" style={{ color: "#23ada4" }} />
        <p className="mt-3 text-secondary">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-5">
        <h4 className="text-white mb-3">Course not found</h4>
        <Link href="/CoursesManagement" className="custom-btn">
          ← Back to Courses
        </Link>
      </div>
    );
  }

  const isPastOrEnded = course.status?.toLowerCase() === "past" || new Date(course.endDate) < new Date();
  const enrolledPercent = course.totalSeats > 0 ? Math.round((course.acquiredSeats / course.totalSeats) * 100) : 0;
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const orderedSchedule = weekdays.filter(d => course.weeklySchedule?.[d]);

  return (
    <div className="course-control-center">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <Link href="/CoursesManagement" className="back-btn-dashboard">
          <span className="me-2">←</span> Back to Courses
        </Link>
        <div className="d-flex gap-2 flex-wrap">
          <button
            onClick={() => fetchSlotAttendees({ batchName: "All Enrollments", startTime: null, endTime: null, batchId: null })}
            className="outline-btn"
            style={{ padding: "8px 20px", fontSize: "13px", border: "1px solid rgba(35,173,164,0.4)", color: "#23ada4", background: "transparent", borderRadius: "8px", cursor: "pointer" }}
          >
            👥 View All Enrollments
          </button>
          {!isPastOrEnded && (
            <>
              <button
                onClick={() => {
                  setCancelMode("course");
                  setCancelModalOpen(true);
                }}
                className="outline-btn"
                style={{ padding: "8px 20px", fontSize: "13px", border: "1px solid rgba(220,53,69,0.4)", color: "#dc3545", background: "transparent", borderRadius: "8px", cursor: "pointer" }}
              >
                🚫 Cancel Course
              </button>
              <Link href={`/AddProgram?courseId=${course._id}`} className="custom-btn" style={{ padding: "8px 20px", fontSize: "13px" }}>
                ✏️ Edit Course
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <div className="hero-details-card mb-4">
        <div className="hero-blur-bg" style={{ backgroundImage: `url(${course.posterImage?.[0] || "/img/sidebar-logo.svg"})` }}></div>
        <div className="hero-content-overlay d-flex flex-column flex-md-row gap-4 p-4 align-items-center align-items-md-stretch">
          <div className="hero-poster shadow-lg">
            <img
              src={course.posterImage?.[0] || "/img/sidebar-logo.svg"}
              alt={course.courseTitle}
              onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
            />
          </div>
          <div className="hero-text-details d-flex flex-column justify-content-between text-center text-md-start">
            <div>
              <div className="d-flex gap-2 flex-wrap mb-2 justify-content-center justify-content-md-start">
                <span className={`badge-status ${course.isDraft ? "draft" : (course.status?.toLowerCase() || "upcoming")}`}>
                  {course.isDraft ? "Draft" : (course.status || "Upcoming")}
                </span>
                <span className="badge-status" style={{ background: "rgba(255,255,255,0.08)", color: "#ccc", border: "1px solid rgba(255,255,255,0.15)" }}>
                  {course.enrollmentType || "Ongoing"}
                </span>
                {course.isFeatured && <span className="badge-status featured">⭐ Featured</span>}
                {course.sessionStatus && (
                  <span className="badge-status" style={{
                    background: course.sessionStatus === "LIVE" ? "rgba(40,167,69,0.15)" : "rgba(0,123,255,0.15)",
                    color: course.sessionStatus === "LIVE" ? "#28a745" : "#007bff",
                    border: `1px solid ${course.sessionStatus === "LIVE" ? "rgba(40,167,69,0.3)" : "rgba(0,123,255,0.3)"}`
                  }}>
                    {course.sessionStatus}
                  </span>
                )}
              </div>
              <h1 className="hero-title">{course.courseTitle}</h1>
              <p className="hero-category text-muted mt-1">
                📂 {course.courseCategory?.name || "General"} &nbsp;•&nbsp; ⏱️ {course.duration || "N/A"}
              </p>
            </div>
            <div className="hero-meta text-muted mt-3 d-flex flex-wrap gap-3 justify-content-center justify-content-md-start">
              <span>📅 Created: <strong>{new Date(course.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</strong></span>
              <span>👤 Organizer: <strong>{course.createdBy?.firstName ? `${course.createdBy.firstName} ${course.createdBy.lastName || ""}` : "N/A"}</strong></span>
              {course.venueName && <span>📍 <strong>{course.venueName}</strong></span>}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Row className="gx-3 gy-3 mb-4">
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <h5>Per Session Price</h5>
              <h3>₮{(course.price || 0).toLocaleString()}</h3>
              <p className="small text-muted">Single session rate</p>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">👥</div>
            <div className="kpi-content">
              <h5>Enrolled Students</h5>
              <h3>
                {course.acquiredSeats || 0} <span className="total-cap">/ {course.totalSeats || 0}</span>
              </h3>
              <div className="progress-bar-container mt-2">
                <div className="progress-bar-filled" style={{ width: `${enrolledPercent}%` }}></div>
              </div>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">💺</div>
            <div className="kpi-content">
              <h5>Seats Available</h5>
              <h3>{course.leftSeats || 0}</h3>
              <p className="small text-muted">Open for enrollment</p>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">🗓️</div>
            <div className="kpi-content">
              <h5>Total Batches</h5>
              <h3>{course.batches?.length || 0}</h3>
              <p className="small text-muted">Active class groups</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Passes Row */}
      {(course.oneMonthPassEnabled || course.threeMonthPassEnabled) && (
        <Row className="gx-3 gy-3 mb-4">
          <Col xs={12}>
            <div className="content-card p-4">
              <h4 className="card-heading-line mb-3"><span>🎫 Pass Pricing</span></h4>
              <Row className="gx-3 gy-3">
                {course.oneMonthPassEnabled && (
                  <Col md={6} xs={12}>
                    <div className="pass-card">
                      <div className="d-flex align-items-center gap-3">
                        <div className="pass-icon">📅</div>
                        <div>
                          <p className="pass-label">1 Month Pass</p>
                          <h4 className="pass-price">₮{(course.oneMonthPassPrice || 0).toLocaleString()}</h4>
                          <p className="pass-sub">30 days unlimited access</p>
                        </div>
                      </div>
                    </div>
                  </Col>
                )}
                {course.threeMonthPassEnabled && (
                  <Col md={6} xs={12}>
                    <div className="pass-card">
                      <div className="d-flex align-items-center gap-3">
                        <div className="pass-icon">🗓️</div>
                        <div>
                          <p className="pass-label">3 Month Pass</p>
                          <h4 className="pass-price">₮{(course.threeMonthPassPrice || 0).toLocaleString()}</h4>
                          <p className="pass-sub">90 days unlimited access</p>
                        </div>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          </Col>
        </Row>
      )}

      {/* Main Content */}
      <Row className="gx-4">
        {/* Left Column */}
        <Col lg={7} md={12} className="mb-4">

          {/* Description */}
          <div className="content-card mb-4 p-4">
            <h4 className="card-heading-line mb-3"><span>Short Description</span></h4>
            <ExpandableText text={course.shortdesc} limit={250} />
          </div>

          {course.longdesc && (
            <div className="content-card mb-4 p-4">
              <h4 className="card-heading-line mb-3"><span>Full Description</span></h4>
              <ExpandableText text={course.longdesc} limit={450} />
            </div>
          )}

          {course.whatYouWillLearn && (
            <div className="content-card mb-4 p-4">
              <h4 className="card-heading-line mb-3"><span>📚 What You Will Learn</span></h4>
              <ExpandableText text={course.whatYouWillLearn} limit={400} />
            </div>
          )}

          {/* Weekly Schedule */}
          {course.weeklySchedule && orderedSchedule.length > 0 && (
            <div className="content-card mb-4 p-4">
              <h4 className="card-heading-line mb-3"><span>📆 Weekly Schedule</span></h4>
              <div className="d-flex flex-column gap-2">
                {orderedSchedule.map((day) => {
                  const dayData = course.weeklySchedule[day];
                  const isOpen = expandedDay === day;
                  return (
                    <div key={day} className="schedule-day-block">
                      <button
                        className="schedule-day-header w-100 border-0 bg-transparent text-start d-flex justify-content-between align-items-center"
                        onClick={() => setExpandedDay(isOpen ? null : day)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span className="day-badge">{day}</span>
                          <span className="day-date text-muted">{dayData.date}</span>
                          <span className="small text-secondary">{dayData.slots?.length} slot{dayData.slots?.length !== 1 ? "s" : ""}</span>
                        </div>
                        <span style={{ color: "#23ada4", fontSize: "18px" }}>{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div className="schedule-slots-list mt-2">
                          {dayData.slots?.map((slot, idx) => (
                            <div
                              key={idx}
                              className={`slot-row w-100 d-flex justify-content-between align-items-center p-3 mb-2 rounded ${slot.isCancelled ? "opacity-50" : ""}`}
                            >
                              <div
                                onClick={() => !slot.isCancelled && fetchSlotAttendees(slot)}
                                style={{ flex: 1, cursor: slot.isCancelled ? "default" : "pointer" }}
                                className={!slot.isCancelled ? "slot-clickable" : ""}
                              >
                                <div className="d-flex align-items-center gap-2">
                                  <p className="mb-0 text-white" style={{ fontWeight: 600, fontSize: "14px", textDecoration: slot.isCancelled ? "line-through" : "none" }}>{slot.batchName}</p>
                                  {slot.isCancelled && <span className="badge bg-danger">Cancelled</span>}
                                </div>
                                <p className="mb-0 text-secondary" style={{ fontSize: "12px" }}>
                                  {formatTime(slot.startTime, true, language)} – {formatTime(slot.endTime, true, language)}
                                </p>
                              </div>
                              <div className="text-end d-flex align-items-center gap-3">
                                <div
                                  onClick={() => !slot.isCancelled && fetchSlotAttendees(slot)}
                                  style={{ cursor: slot.isCancelled ? "default" : "pointer" }}
                                  className={!slot.isCancelled ? "slot-clickable" : ""}
                                >
                                  {!slot.isCancelled && (
                                    <>
                                      <p className="mb-0" style={{ fontSize: "12px", color: slot.isFull ? "#dc3545" : "#28a745" }}>
                                        {slot.isFull ? "🔴 Full" : `🟢 ${slot.availableSeats} left`}
                                      </p>
                                      <span style={{ fontSize: "11px", color: "#23ada4", fontWeight: 600 }}>View Attendees →</span>
                                    </>
                                  )}
                                </div>
                                {!slot.isCancelled && slot.batchId && slot.date && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSlot(slot);
                                      setCancelMode("slot");
                                      setCancelModalOpen(true);
                                    }}
                                    className="btn btn-danger btn-sm border-0"
                                    style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", fontWeight: 600 }}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gallery */}
          {course.mediaLinks && course.mediaLinks.length > 0 && (
            <div className="content-card p-4">
              <h4 className="card-heading-line mb-3"><span>🖼️ Gallery</span></h4>
              <div className="details-gallery-grid">
                {course.mediaLinks.map((link, idx) => (
                  <div key={idx} className="details-gallery-item">
                    <img
                      src={link}
                      alt={`Gallery ${idx + 1}`}
                      onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Col>

        {/* Right Column */}
        <Col lg={5} md={12} className="mb-4">

          {/* Location & Dates */}
          <div className="content-card mb-4 p-4">
            <h4 className="card-heading-line mb-3"><span>📍 Location & Dates</span></h4>
            <div className="d-flex flex-column gap-3">
              {course.venueName && (
                <div className="d-flex align-items-start gap-2">
                  <span className="icon-schedule">📍</span>
                  <div>
                    <h6 className="mb-1 text-muted" style={{ fontSize: "12px" }}>Venue</h6>
                    <p className="text-white mb-0" style={{ fontSize: "14px", fontWeight: 600 }}>{course.venueName}</p>
                    <p className="small text-secondary mb-0">{course.venueAddress?.address}</p>
                    <p className="small text-secondary mb-0">{course.venueAddress?.city}, {course.venueAddress?.country}</p>
                  </div>
                </div>
              )}
              <div className="d-flex align-items-start gap-2">
                <span className="icon-schedule">📅</span>
                <div>
                  <h6 className="mb-1 text-muted" style={{ fontSize: "12px" }}>Start Date</h6>
                  <p className="text-white mb-0" style={{ fontSize: "14px" }}>
                    {course.startDate ? new Date(course.startDate).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-start gap-2">
                <span className="icon-schedule">📅</span>
                <div>
                  <h6 className="mb-1 text-muted" style={{ fontSize: "12px" }}>End Date</h6>
                  <p className="text-white mb-0" style={{ fontSize: "14px" }}>
                    {course.endDate ? new Date(course.endDate).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {course.refundPolicy && (
              <>
                <hr style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
                <div>
                  <h6 className="small text-muted mb-1">Refund Policy</h6>
                  <p className="text-white mb-0" style={{ fontSize: "14px" }}>{course.refundPolicy}</p>
                </div>
              </>
            )}
          </div>

          {/* Batches */}
          <div className="content-card mb-4 p-4">
            <h4 className="card-heading-line mb-3"><span>🏫 Class Batches</span></h4>
            {course.batches && course.batches.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {course.batches.map((batch, idx) => {
                  const fillPercent = batch.seats > 0 ? Math.round(((batch.seats - batch.availableSeats) / batch.seats) * 100) : 0;
                  return (
                    <div className="ticket-tier-row p-3 rounded" key={batch._id || idx}>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div>
                          {/* <h6 className="text-white mb-0" style={{ fontSize: "14px", fontWeight: 700 }}>{batch.batchName}</h6> */}
                          <p className="small text-secondary mb-1">
                            {formatTime(batch.startTime, true, language)} – {formatTime(batch.endTime, true, language)}
                          </p>
                          <p className="small text-muted mb-0">
                            {batch.days?.join(", ")}
                          </p>
                        </div>
                        <span className="badge-status" style={{
                          background: batch.status === "Active" ? "rgba(40,167,69,0.15)" : "rgba(108,117,125,0.15)",
                          color: batch.status === "Active" ? "#28a745" : "#999",
                          border: `1px solid ${batch.status === "Active" ? "rgba(40,167,69,0.3)" : "rgba(108,117,125,0.3)"}`,
                          fontSize: "10px"
                        }}>
                          {batch.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Enrolled: {batch.acquiredSeats || 0} / {batch.seats}</span>
                          <span>{fillPercent}%</span>
                        </div>
                        <div className="progress-bar-container light">
                          <div className="progress-bar-filled" style={{ width: `${fillPercent}%` }}></div>
                        </div>
                        <p className="small mt-1 mb-0" style={{ color: batch.isFull ? "#dc3545" : "#23ada4" }}>
                          {batch.isFull ? "🔴 Full" : `🟢 ${batch.availableSeats} seats available`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-secondary small text-center py-3">No batches defined for this course.</p>
            )}
          </div>

          {/* Assigned Staff */}
          {course.assignedStaff && course.assignedStaff.length > 0 && (
            <div className="content-card p-4">
              <h4 className="card-heading-line mb-3"><span>👥 Assigned Staff</span></h4>
              <div className="d-flex flex-column gap-2">
                {course.assignedStaff.map((staff, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-3 p-2 rounded" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#23ada4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: "14px", flexShrink: 0 }}>
                      {staff.firstName?.[0] || "S"}
                    </div>
                    <div>
                      <p className="mb-0 text-white" style={{ fontSize: "14px", fontWeight: 600 }}>{staff.firstName} {staff.lastName}</p>
                      <p className="mb-0 text-secondary" style={{ fontSize: "12px" }}>{staff.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* Attendees Drawer */}
      {drawerOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}
          onClick={() => setDrawerOpen(false)}
        >
          {/* Overlay */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />

          {/* Drawer Panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "100%",
              maxWidth: "460px",
              background: "#151515",
              borderLeft: "1px solid #2d2d2d",
              display: "flex",
              flexDirection: "column",
              animation: "slideIn 0.25s ease",
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #2d2d2d", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 style={{ color: "#fff", margin: 0, fontWeight: 700, fontSize: "16px" }}>
                    {selectedSlot?.batchName}
                  </h5>
                  {selectedSlot?.batchId && selectedSlot?.date && (
                    <button
                      onClick={() => {
                        setCancelMode("slot");
                        setCancelModalOpen(true);
                        setDrawerOpen(false); // Optionally close drawer to show modal
                      }}
                      className="badge bg-danger border-0"
                      style={{ cursor: "pointer", fontSize: "11px", padding: "4px 8px" }}
                    >
                      Cancel this Slot
                    </button>
                  )}
                </div>
                <p style={{ color: "#888", margin: "4px 0 0", fontSize: "13px" }}>
                  {selectedSlot?.startTime
                    ? `🕒 ${formatTime(selectedSlot.startTime, true, language)} – ${formatTime(selectedSlot.endTime, true, language)} • `
                    : ""}
                  {attendeesTotal} enrolled
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#ccc", borderRadius: "8px", width: 34, height: 34, fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                ×
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {attendeesLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: 12 }}>
                  <Spinner animation="border" style={{ color: "#23ada4" }} />
                  <p style={{ color: "#888", margin: 0, fontSize: "13px" }}>Loading attendees...</p>
                </div>
              ) : slotAttendees.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: "60px" }}>
                  <p style={{ fontSize: "36px", margin: "0 0 12px" }}>👥</p>
                  <p style={{ color: "#555", fontSize: "14px" }}>No students enrolled yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {slotAttendees.map((attendee, idx) => {
                    const user = attendee.user;
                    const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "?";
                    const isAllMode = !selectedSlot?.batchId;
                    return (
                      <div key={idx} style={{ background: "#1e1e1e", border: "1px solid #2d2d2d", borderRadius: "12px", padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {/* Avatar */}
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: user?.profileImage ? "transparent" : "#23ada4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", fontWeight: 700, color: "#fff", fontSize: "15px" }}>
                            {user?.profileImage ? (
                              <img src={user.profileImage} alt={user.firstName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                            ) : initials}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "14px" }}>{user?.firstName} {user?.lastName}</p>
                            <p style={{ margin: 0, color: "#888", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
                            {user?.contactNumber && (
                              <p style={{ margin: 0, color: "#666", fontSize: "11px" }}>{user?.countryCode} {user?.contactNumber}</p>
                            )}
                          </div>

                          {/* Right — check-in status */}
                          <div style={{ flexShrink: 0, textAlign: "right" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: attendee.isFullyCheckedIn ? "rgba(40,167,69,0.15)" : attendee.checkedInQty > 0 ? "rgba(255,193,7,0.15)" : "rgba(108,117,125,0.1)",
                              color: attendee.isFullyCheckedIn ? "#28a745" : attendee.checkedInQty > 0 ? "#ffc107" : "#888",
                              border: `1px solid ${attendee.isFullyCheckedIn ? "rgba(40,167,69,0.3)" : attendee.checkedInQty > 0 ? "rgba(255,193,7,0.3)" : "rgba(108,117,125,0.2)"}`,
                            }}>
                              {attendee.isFullyCheckedIn ? "✓ Checked In" : attendee.checkedInQty > 0 ? `${attendee.checkedInQty}/${attendee.qty} In` : "Not Checked In"}
                            </span>
                            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#555" }}>#{attendee.bookingId?.slice(-6)}</p>
                          </div>
                        </div>

                        {/* Enrolled Batches (shown only in All Enrollments mode) */}
                        {isAllMode && attendee.enrolledBatches && attendee.enrolledBatches.length > 0 && (
                          <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {attendee.enrolledBatches.map((b, bi) => (
                              <span key={bi} style={{
                                background: "rgba(35,173,164,0.1)",
                                border: "1px solid rgba(35,173,164,0.25)",
                                color: "#23ada4",
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "3px 10px",
                                borderRadius: "20px",
                              }}>
                                {b.batchName} · {formatTime(b.startTime, true, language)}–{formatTime(b.endTime, true, language)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #2d2d2d" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#555", textAlign: "center" }}>
                Showing {slotAttendees.length} of {attendeesTotal} enrolled students
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setCancelModalOpen(false)}></div>
          <div style={{ position: "relative", background: "#1e1e1e", border: "1px solid #2d2d2d", borderRadius: "16px", padding: "24px", width: "90%", maxWidth: "400px" }}>
            <h5 style={{ color: "#fff", fontWeight: 700, marginBottom: "16px" }}>
              {cancelMode === "slot" ? "Cancel Slot" : "Cancel Course"}
            </h5>
            <p style={{ color: "#ccc", fontSize: "14px", marginBottom: "20px" }}>
              {cancelMode === "slot"
                ? `Are you sure you want to cancel ${selectedSlot?.batchName} for ${selectedSlot?.date ? selectedSlot.date.split("T")[0] : ""}?`
                : "Are you sure you want to cancel this entire course? This will cancel all pending bookings and notify enrolled students."}
            </p>
            <div className="form-group mb-4">
              <label style={{ color: "#888", fontSize: "13px", marginBottom: "8px", display: "block" }}>Reason for Cancellation <span className="text-danger">*</span></label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="form-control"
                style={{ background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "8px", minHeight: "80px", padding: "10px" }}
                placeholder="E.g., Unforeseen circumstances..."
              ></textarea>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="btn"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "14px" }}
                disabled={isCancelling}
              >
                Keep Course
              </button>
              <button
                onClick={handleCancelCourse}
                className="btn"
                style={{ background: "#dc3545", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "14px" }}
                disabled={isCancelling || !cancelReason.trim()}
              >
                {isCancelling ? <Spinner size="sm" /> : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .course-control-center {
          color: #fff;
          font-family: 'Inter', sans-serif;
        }
        .back-btn-dashboard {
          color: #888;
          text-decoration: none;
          font-size: 14px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .back-btn-dashboard:hover { color: #23ada4; }
        .hero-details-card {
          position: relative;
          background: #1e1e1e;
          border: 1px solid #2d2d2d;
          border-radius: 16px;
          overflow: hidden;
        }
        .hero-blur-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(40px) brightness(0.2);
          z-index: 1;
        }
        .hero-content-overlay { position: relative; z-index: 2; }
        .hero-poster {
          width: 130px;
          height: 130px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.1);
        }
        .hero-poster img { width: 100%; height: 100%; object-fit: cover; }
        .hero-text-details { flex: 1; }
        .hero-title { font-size: 24px; font-weight: 700; color: #fff; margin: 0; }
        .hero-category { font-size: 13px; }
        .hero-meta { font-size: 12px; }
        .badge-status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .badge-status.draft { background: rgba(255,193,7,0.15); color: #ffc107; border: 1px solid rgba(255,193,7,0.3); }
        .badge-status.upcoming { background: rgba(0,123,255,0.15); color: #007bff; border: 1px solid rgba(0,123,255,0.3); }
        .badge-status.live { background: rgba(40,167,69,0.15); color: #28a745; border: 1px solid rgba(40,167,69,0.3); }
        .badge-status.past { background: rgba(108,117,125,0.15); color: #999; border: 1px solid rgba(108,117,125,0.3); }
        .badge-status.featured { background: linear-gradient(135deg,#f6d365,#fda085); color: #000; }
        .kpi-card {
          background: #1e1e1e;
          border: 1px solid #2d2d2d;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .kpi-icon {
          font-size: 26px;
          background: rgba(35,173,164,0.1);
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-content { flex: 1; }
        .kpi-content h5 { color: #888; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; letter-spacing: 0.5px; }
        .kpi-content h3 { font-size: 22px; font-weight: 700; color: #fff; margin: 0; }
        .kpi-content .total-cap { font-size: 13px; color: #666; font-weight: 500; }
        .progress-bar-container { background: #111; height: 6px; border-radius: 10px; overflow: hidden; width: 100%; }
        .progress-bar-container.light { background: rgba(255,255,255,0.05); }
        .progress-bar-filled { background: #23ada4; height: 100%; border-radius: 10px; transition: width 0.4s ease; }
        .content-card { background: #1e1e1e; border: 1px solid #2d2d2d; border-radius: 14px; }
        .card-heading-line { font-size: 14px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #2d2d2d; padding-bottom: 12px; color: #23ada4; margin-bottom: 0; }
        .card-heading-line span { position: relative; }
        .icon-schedule {
          font-size: 18px;
          background: rgba(255,255,255,0.05);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .details-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px,1fr)); gap: 10px; }
        .details-gallery-item { aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 1px solid #333; }
        .details-gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.25s ease; }
        .details-gallery-item img:hover { transform: scale(1.08); }
        .ticket-tier-row { background: #161616; border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; }
        .pass-card {
          background: #161616;
          border: 1px solid rgba(35,173,164,0.2);
          border-radius: 12px;
          padding: 18px;
        }
        .pass-icon {
          font-size: 24px;
          background: rgba(35,173,164,0.1);
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pass-label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; font-weight: 600; }
        .pass-price { color: #23ada4; font-size: 20px; font-weight: 700; margin: 2px 0; }
        .pass-sub { color: #555; font-size: 12px; margin: 0; }
        .schedule-day-block {
          background: #161616;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 12px 16px;
        }
        .schedule-day-header { cursor: pointer; padding: 0; }
        .schedule-day-header:hover .day-badge { background: #23ada4; color: #000; }
        .day-badge {
          background: rgba(35,173,164,0.15);
          color: #23ada4;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          transition: all 0.2s;
          border: 1px solid rgba(35,173,164,0.3);
        }
        .day-date { font-size: 13px; color: #ccc; }
        .slot-row { background: #1a1a1a; border: 1px solid rgba(255,255,255,0.04); }
        .slot-clickable { cursor: pointer; transition: background 0.18s, border-color 0.18s; }
        .slot-clickable:hover { background: #222 !important; border-color: rgba(35,173,164,0.3) !important; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function page() {
  return (
    <Suspense fallback={
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "#23ada4" }} />
      </div>
    }>
      <CourseDetailsContent />
    </Suspense>
  );
}

export default page;
