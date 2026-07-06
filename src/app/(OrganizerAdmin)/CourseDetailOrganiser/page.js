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
  if (!text)
    return (
      <p className={className} style={{ color: "#666", fontStyle: "italic" }}>
        N/A
      </p>
    );

  const shouldShowToggle = text.length > limit;
  const displayText =
    isExpanded || !shouldShowToggle ? text : `${text.substring(0, limit)}...`;

  return (
    <div className={className}>
      <p
        style={{
          whiteSpace: "pre-line",
          margin: 0,
          color: "rgba(255,255,255,0.8)",
          fontSize: "14px",
          lineHeight: "1.6",
        }}>
        {displayText}
      </p>
      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 border-0 bg-transparent p-0"
          style={{
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            color: "#23ada4",
            transition: "all 0.2s",
          }}>
          {isExpanded
            ? t("viewLess") || "View Less"
            : t("viewMore") || "View More"}
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

  const [showReservationModal, setShowReservationModal] = useState(false);
  const [tempReservedExternally, setTempReservedExternally] = useState(0);
  const [isSavingReservation, setIsSavingReservation] = useState(false);
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
        if (selectedSlot.date) {
          payload.date = selectedSlot.date.split("T")[0]; // YYYY-MM-DD
        }
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

  const handleSaveReservation = async () => {
    try {
      setIsSavingReservation(true);
      const res = await bookingApi.adjustCourseReservedSeats({
        courseId: course._id,
        batchId: selectedSlot.batchId,
        date: selectedSlot.date || undefined,
        ReservedExternally: tempReservedExternally,
      });

      if (res?.status) {
        toast.success("Reserved seats updated successfully");
        setShowReservationModal(false);
        fetchDetails(); // reload detai
        // ls
      } else {
        toast.error(res?.message || "Failed to update reserved seats");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update reserved seats",
      );
    } finally {
      setIsSavingReservation(false);
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

  const isOngoing = course.enrollmentType === "Ongoing" || course.endDate === "2099-12-31";
  const isPastOrEnded =
    course.status?.toLowerCase() === "past" ||
    (!isOngoing && new Date(course.endDate) < new Date());
  const isCancelled = course.status?.toLowerCase() === "cancelled";
  const enrolledPercent =
    course.totalSeats > 0
      ? Math.round((course.acquiredSeats / course.totalSeats) * 100)
      : 0;
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const orderedSchedule = weekdays.filter((d) => course.weeklySchedule?.[d]);

  return (
    <div className="course-control-center">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <Link href="/CoursesManagement" className="back-btn-dashboard">
          <span className="me-2">←</span> {t("backToCourses") || "Back to Courses"}
        </Link>
        <div className="d-flex gap-2 flex-wrap">
          <button
            onClick={() =>
              fetchSlotAttendees({
                batchName: "All Enrollments",
                startTime: null,
                endTime: null,
                batchId: null,
              })
            }
            className="outline-btn"
            style={{
              padding: "8px 20px",
              fontSize: "13px",
              border: "1px solid rgba(35,173,164,0.4)",
              color: "#23ada4",
              background: "transparent",
              borderRadius: "8px",
              cursor: "pointer",
            }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none">
              <path
                d="M20.7566 11.0859C21.4594 10.592 21.9248 9.77047 21.9248 8.84447C21.9248 7.32963 20.6996 6.10446 19.1848 6.10446C17.67 6.10446 16.4448 7.32963 16.4448 8.84447C16.4448 9.77047 16.9054 10.592 17.613 11.0859C17.0099 11.2948 16.459 11.6177 15.9937 12.0356C15.3526 11.4895 14.5975 11.0716 13.7713 10.8247C14.7732 10.2168 15.4476 9.1104 15.4476 7.85199C15.4476 5.93351 13.8947 4.38068 11.9763 4.38068C10.0578 4.38068 8.50495 5.93825 8.50495 7.85199C8.50495 9.1104 9.17451 10.2168 10.1812 10.8247C9.36446 11.0716 8.61892 11.4848 7.98259 12.0214C7.51721 11.613 6.97586 11.2948 6.38227 11.0906C7.08508 10.5967 7.55046 9.77522 7.55046 8.84922C7.55046 7.33438 6.32529 6.10921 4.81045 6.10921C3.29561 6.10921 2.07044 7.33438 2.07044 8.84922C2.07044 9.77522 2.53106 10.5967 3.23862 11.0906C1.35338 11.7412 0 13.5314 0 15.6351V15.9485C0 15.958 0.00949743 15.9675 0.0189949 15.9675H5.82667C5.79343 16.2287 5.77444 16.4994 5.77444 16.7701V17.093C5.77444 18.4891 6.90463 19.6193 8.30075 19.6193H15.6613C17.0574 19.6193 18.1876 18.4891 18.1876 17.093V16.7701C18.1876 16.4994 18.1686 16.2287 18.1353 15.9675H23.981C23.9905 15.9675 24 15.958 24 15.9485V15.6351C23.9905 13.5267 22.6419 11.7364 20.7566 11.0859ZM17.2046 8.83972C17.2046 7.74751 18.0926 6.8595 19.1848 6.8595C20.277 6.8595 21.165 7.74751 21.165 8.83972C21.165 9.91768 20.296 10.7962 19.2228 10.8199C19.2085 10.8199 19.1991 10.8199 19.1848 10.8199C19.1706 10.8199 19.1611 10.8199 19.1468 10.8199C18.0689 10.8009 17.2046 9.92243 17.2046 8.83972ZM9.25524 7.85199C9.25524 6.35614 10.4709 5.14047 11.9668 5.14047C13.4626 5.14047 14.6783 6.35614 14.6783 7.85199C14.6783 9.2956 13.5433 10.478 12.1235 10.5588C12.0712 10.5588 12.019 10.5588 11.9668 10.5588C11.9145 10.5588 11.8623 10.5588 11.8101 10.5588C10.3902 10.478 9.25524 9.2956 9.25524 7.85199ZM2.81599 8.83972C2.81599 7.74751 3.704 6.8595 4.7962 6.8595C5.88841 6.8595 6.77641 7.74751 6.77641 8.83972C6.77641 9.91768 5.9074 10.7962 4.83419 10.8199C4.81994 10.8199 4.81045 10.8199 4.7962 10.8199C4.78195 10.8199 4.77246 10.8199 4.75821 10.8199C3.685 10.8009 2.81599 9.92243 2.81599 8.83972ZM5.95964 15.203H0.769292C0.982984 13.18 2.69252 11.594 4.76771 11.5797C4.77721 11.5797 4.7867 11.5797 4.7962 11.5797C4.8057 11.5797 4.8152 11.5797 4.82469 11.5797C5.81243 11.5845 6.71468 11.9501 7.41274 12.5437C6.72893 13.2845 6.22082 14.1963 5.95964 15.203ZM17.4183 17.093C17.4183 18.0665 16.6252 18.8595 15.6518 18.8595H8.29125C7.31777 18.8595 6.52473 18.0665 6.52473 17.093V16.7701C6.52473 13.8211 8.88009 11.4088 11.8101 11.3233C11.8623 11.328 11.9193 11.328 11.9715 11.328C12.0237 11.328 12.0807 11.328 12.133 11.3233C15.0629 11.4088 17.4183 13.8211 17.4183 16.7701V17.093ZM17.9834 15.203C17.7222 14.201 17.2236 13.3035 16.5445 12.5627C17.2473 11.9549 18.1591 11.5892 19.1563 11.5797C19.1658 11.5797 19.1753 11.5797 19.1848 11.5797C19.1943 11.5797 19.2038 11.5797 19.2133 11.5797C21.2885 11.594 22.998 13.18 23.2117 15.203H17.9834Z"
                fill="url(#paint0_linear_4557_4491)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_4557_4491"
                  x1="6.0117"
                  y1="2.46511"
                  x2="11.3867"
                  y2="25.2998"
                  gradientUnits="userSpaceOnUse">
                  <stop stop-color="#23ADA4" />
                  <stop offset="1" stop-color="#23ADA4" />
                </linearGradient>
              </defs>
            </svg>{" "}
            {t("viewAllEnrollments") || "View All Enrollments"}
          </button>
          {!isPastOrEnded && !isCancelled && (
            <>
              <button
                onClick={() => {
                  setCancelMode("course");
                  setCancelModalOpen(true);
                }}
                className="outline-btn"
                style={{
                  padding: "8px 20px",
                  fontSize: "13px",
                  border: "1px solid rgba(220,53,69,0.4)",
                  color: "#dc3545",
                  background: "transparent",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}>
                🚫 {t("cancelCourse") || "Cancel Course"}
              </button>
              <Link
                href={`/AddProgram?courseId=${course._id}`}
                className="custom-btn"
                style={{ padding: "8px 20px", fontSize: "13px" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none">
                  <path
                    d="M2.42914 9.53695C2.31714 9.53695 2.20536 9.4943 2.11983 9.40877C1.94899 9.23792 1.94899 8.96098 2.11983 8.79014L8.95664 1.95333C9.12727 1.78248 9.40443 1.78248 9.57527 1.95333C9.74611 2.12417 9.74611 2.40111 9.57527 2.57195L2.73846 9.40877C2.65314 9.49408 2.54114 9.53695 2.42914 9.53695Z"
                    fill="white"
                  />
                  <path
                    d="M1.75361 12.6879C1.7232 12.6879 1.69236 12.6846 1.66152 12.678C1.42527 12.6273 1.27477 12.3947 1.32552 12.1585L2.00145 9.00782C2.0522 8.77157 2.28583 8.62151 2.52099 8.67182C2.75724 8.72257 2.90774 8.9551 2.85699 9.19135L2.18105 12.342C2.13708 12.5474 1.95552 12.6879 1.75361 12.6879Z"
                    fill="white"
                  />
                  <path
                    d="M4.904 12.0113C4.792 12.0113 4.68022 11.9687 4.59469 11.8832C4.42384 11.7123 4.42384 11.4354 4.59469 11.2645L11.4315 4.42794C11.6021 4.25709 11.8793 4.25709 12.0501 4.42794C12.221 4.59878 12.221 4.87572 12.0501 5.04656L5.21353 11.8832C5.128 11.9687 5.016 12.0113 4.904 12.0113Z"
                    fill="white"
                  />
                  <path
                    d="M1.75289 12.6877C1.55098 12.6877 1.36964 12.5472 1.32545 12.3418C1.27492 12.1056 1.4252 11.873 1.66145 11.8223L4.81211 11.1464C5.04858 11.0963 5.28111 11.2463 5.33164 11.4824C5.38217 11.7186 5.23189 11.9511 4.99564 12.0019L1.84498 12.6778C1.81414 12.6846 1.7833 12.6877 1.75289 12.6877Z"
                    fill="white"
                  />
                  <path
                    d="M10.5032 6.41216C10.3912 6.41216 10.2792 6.36951 10.1939 6.28398L7.7192 3.80926C7.54835 3.63841 7.54835 3.36148 7.7192 3.19063C7.88982 3.01979 8.1672 3.01979 8.33782 3.19063L10.8125 5.66535C10.9834 5.8362 10.9834 6.11313 10.8125 6.28398C10.7272 6.36951 10.6152 6.41216 10.5032 6.41216Z"
                    fill="white"
                  />
                  <path
                    d="M11.7407 5.17502C11.6287 5.17502 11.5167 5.13237 11.4312 5.04684C11.2604 4.87599 11.2604 4.59905 11.4312 4.42799C11.6747 4.18452 11.8088 3.85487 11.8088 3.50005C11.8088 3.14524 11.6747 2.81559 11.4312 2.57212C11.1875 2.32843 10.8579 2.19434 10.503 2.19434C10.1482 2.19434 9.81857 2.32843 9.5751 2.57212C9.40448 2.74296 9.12754 2.74318 8.95626 2.57212C8.78541 2.40127 8.78541 2.12434 8.95626 1.95327C9.36488 1.54443 9.91416 1.31934 10.503 1.31934C11.0917 1.31934 11.6412 1.54443 12.0498 1.95327C12.4587 2.3619 12.6838 2.91118 12.6838 3.50005C12.6838 4.08893 12.4587 4.63821 12.0498 5.04684C11.9647 5.13215 11.8527 5.17502 11.7407 5.17502Z"
                    fill="white"
                  />
                </svg>{" "}
                {t("editCourse") || "Edit Course"}
              </Link>
            </>
          )}
        </div>
      </div>

      {isCancelled && (
        <div
          className="alert alert-danger d-flex align-items-center mb-4"
          style={{
            borderRadius: "12px",
            border: "1px solid rgba(220, 53, 69, 0.2)",
            background: "rgba(220, 53, 69, 0.15)",
            color: "#f8d7da",
            padding: "15px",
          }}>
          <span style={{ fontSize: "20px", marginRight: "12px" }}>⚠️</span>
          <div>
            <strong style={{ color: "#fff" }}>
              This course has been cancelled.
            </strong>{" "}
            All batches/sessions are cancelled and enrolled students have been
            refunded.
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className="hero-details-card mb-4">
        <div
          className="hero-blur-bg"
          style={{
            backgroundImage: `url(${course.posterImage?.[0] || "/img/sidebar-logo.svg"})`,
          }}></div>
        <div className="hero-content-overlay d-flex flex-column flex-md-row gap-4 p-4 align-items-center align-items-md-stretch">
          <div className="hero-poster shadow-lg">
            <img
              src={course.posterImage?.[0] || "/img/sidebar-logo.svg"}
              alt={course.courseTitle}
              onError={(e) => {
                e.target.src = "/img/sidebar-logo.svg";
              }}
            />
          </div>
          <div className="hero-text-details d-flex flex-column justify-content-between text-center text-md-start">
            <div>
              <div className="d-flex gap-2 flex-wrap mb-2 justify-content-center justify-content-md-start">
                <span
                  className={`badge-status ${course.isDraft ? "draft" : course.status?.toLowerCase() || "upcoming"}`}>
                  {course.isDraft ? t("draft") || "Draft" : t(course.status?.toLowerCase()) || course.status || "Upcoming"}
                </span>
                <span
                  className="badge-status"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#ccc",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}>
                  {t(course.enrollmentType?.toLowerCase()) || course.enrollmentType || "Ongoing"}
                </span>
                {course.isFeatured && (
                  <span className="badge-status featured">⭐ {t("featured") || "Featured"}</span>
                )}
                {course.sessionStatus && course.sessionStatus !== course.status?.toUpperCase() && (
                  <span
                    className="badge-status"
                    style={{
                      background:
                        course.sessionStatus === "LIVE"
                          ? "rgba(40,167,69,0.15)"
                          : "rgba(0,123,255,0.15)",
                      color:
                        course.sessionStatus === "LIVE" ? "#28a745" : "#007bff",
                      border: `1px solid ${course.sessionStatus === "LIVE" ? "rgba(40,167,69,0.3)" : "rgba(0,123,255,0.3)"}`,
                    }}>
                    {t(course.sessionStatus?.toLowerCase()) || course.sessionStatus}
                  </span>
                )}
              </div>
              <h1 className="hero-title">{course.courseTitle}</h1>
              <p className="hero-category text-muted mt-1">
                {course.courseCategory?.name || "General"} &nbsp;•&nbsp;{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none">
                  <g clip-path="url(#clip0_4825_11094)">
                    <path
                      d="M10.8505 9.41291L8.61965 7.73979V4.3316C8.61965 3.98891 8.34265 3.71191 7.99997 3.71191C7.65728 3.71191 7.38028 3.98891 7.38028 4.3316V8.04966C7.38028 8.24485 7.472 8.42891 7.62815 8.54541L10.1068 10.4044C10.2184 10.4881 10.3485 10.5284 10.478 10.5284C10.667 10.5284 10.8529 10.4435 10.9744 10.2799C11.1802 10.0066 11.1244 9.61804 10.8505 9.41291Z"
                      fill="url(#paint0_linear_4825_11094)"
                    />
                    <path
                      d="M8 0C3.58853 0 0 3.58853 0 8C0 12.4115 3.58853 16 8 16C12.4115 16 16 12.4115 16 8C16 3.58853 12.4115 0 8 0ZM8 14.7607C4.27266 14.7607 1.23934 11.7273 1.23934 8C1.23934 4.27266 4.27266 1.23934 8 1.23934C11.728 1.23934 14.7607 4.27266 14.7607 8C14.7607 11.7273 11.7273 14.7607 8 14.7607Z"
                      fill="url(#paint1_linear_4825_11094)"
                    />
                  </g>
                  <defs>
                    <linearGradient
                      id="paint0_linear_4825_11094"
                      x1="8.31168"
                      y1="2.85505"
                      x2="13.3233"
                      y2="10.2293"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_4825_11094"
                      x1="4.0078"
                      y1="-2.01128"
                      x2="12.2551"
                      y2="20.2353"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <clipPath id="clip0_4825_11094">
                      <rect width="16" height="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>{" "}
                {course.duration || "N/A"}
              </p>
            </div>
            <div className="hero-meta text-muted mt-3 d-flex flex-wrap gap-3 justify-content-center justify-content-md-start">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none">
                  <path
                    d="M11.3334 9.33332C11.7016 9.33332 12 9.03485 12 8.66666C12 8.29847 11.7016 7.99999 11.3334 7.99999C10.9652 7.99999 10.6667 8.29847 10.6667 8.66666C10.6667 9.03485 10.9652 9.33332 11.3334 9.33332Z"
                    fill="url(#paint0_linear_4557_4578)"
                  />
                  <path
                    d="M11.3334 12C11.7016 12 12 11.7015 12 11.3333C12 10.9651 11.7016 10.6667 11.3334 10.6667C10.9652 10.6667 10.6667 10.9651 10.6667 11.3333C10.6667 11.7015 10.9652 12 11.3334 12Z"
                    fill="url(#paint1_linear_4557_4578)"
                  />
                  <path
                    d="M8.66671 8.66666C8.66671 9.03485 8.36823 9.33332 8.00004 9.33332C7.63185 9.33332 7.33337 9.03485 7.33337 8.66666C7.33337 8.29847 7.63185 7.99999 8.00004 7.99999C8.36823 7.99999 8.66671 8.29847 8.66671 8.66666Z"
                    fill="url(#paint2_linear_4557_4578)"
                  />
                  <path
                    d="M8.66671 11.3333C8.66671 11.7015 8.36823 12 8.00004 12C7.63185 12 7.33337 11.7015 7.33337 11.3333C7.33337 10.9651 7.63185 10.6667 8.00004 10.6667C8.36823 10.6667 8.66671 10.9651 8.66671 11.3333Z"
                    fill="url(#paint3_linear_4557_4578)"
                  />
                  <path
                    d="M4.66671 9.33332C5.0349 9.33332 5.33337 9.03485 5.33337 8.66666C5.33337 8.29847 5.0349 7.99999 4.66671 7.99999C4.29852 7.99999 4.00004 8.29847 4.00004 8.66666C4.00004 9.03485 4.29852 9.33332 4.66671 9.33332Z"
                    fill="url(#paint4_linear_4557_4578)"
                  />
                  <path
                    d="M4.66671 12C5.0349 12 5.33337 11.7015 5.33337 11.3333C5.33337 10.9651 5.0349 10.6667 4.66671 10.6667C4.29852 10.6667 4.00004 10.9651 4.00004 11.3333C4.00004 11.7015 4.29852 12 4.66671 12Z"
                    fill="url(#paint5_linear_4557_4578)"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M4.66671 1.16666C4.94285 1.16666 5.16671 1.39051 5.16671 1.66666V2.17514C5.60804 2.16665 6.09426 2.16665 6.62901 2.16666H9.37099C9.90575 2.16665 10.392 2.16665 10.8334 2.17514V1.66666C10.8334 1.39051 11.0572 1.16666 11.3334 1.16666C11.6095 1.16666 11.8334 1.39051 11.8334 1.66666V2.21805C12.0067 2.23126 12.1708 2.24787 12.3261 2.26875C13.1077 2.37383 13.7403 2.59524 14.2392 3.09415C14.7381 3.59306 14.9595 4.22569 15.0646 5.00731C15.1667 5.76678 15.1667 6.73719 15.1667 7.96235V9.37093C15.1667 10.5961 15.1667 11.5665 15.0646 12.326C14.9595 13.1076 14.7381 13.7403 14.2392 14.2392C13.7403 14.7381 13.1077 14.9595 12.3261 15.0646C11.5666 15.1667 10.5962 15.1667 9.37101 15.1667H6.6291C5.40394 15.1667 4.4335 15.1667 3.67403 15.0646C2.89241 14.9595 2.25978 14.7381 1.76087 14.2392C1.26196 13.7403 1.04055 13.1076 0.935464 12.326C0.833355 11.5665 0.833364 10.5961 0.833374 9.37093V7.96238C0.833364 6.73721 0.833355 5.76678 0.935464 5.00731C1.04055 4.22569 1.26196 3.59306 1.76087 3.09415C2.25978 2.59524 2.89241 2.37383 3.67403 2.26875C3.82931 2.24787 3.99341 2.23126 4.16671 2.21805V1.66666C4.16671 1.39051 4.39057 1.16666 4.66671 1.16666ZM3.80727 3.25983C3.13655 3.35001 2.75012 3.51912 2.46798 3.80126C2.18584 4.0834 2.01672 4.46983 1.92655 5.14056C1.91128 5.25415 1.89851 5.37373 1.88783 5.49999H14.1123C14.1016 5.37373 14.0888 5.25415 14.0735 5.14056C13.9834 4.46983 13.8142 4.0834 13.5321 3.80126C13.25 3.51912 12.8635 3.35001 12.1928 3.25983C11.5077 3.16772 10.6046 3.16666 9.33337 3.16666H6.66671C5.39549 3.16666 4.49238 3.16772 3.80727 3.25983ZM1.83337 7.99999C1.83337 7.43065 1.83359 6.93514 1.8421 6.49999H14.158C14.1665 6.93514 14.1667 7.43065 14.1667 7.99999V9.33332C14.1667 10.6045 14.1656 11.5076 14.0735 12.1928C13.9834 12.8635 13.8142 13.2499 13.5321 13.5321C13.25 13.8142 12.8635 13.9833 12.1928 14.0735C11.5077 14.1656 10.6046 14.1667 9.33337 14.1667H6.66671C5.39549 14.1667 4.49238 14.1656 3.80727 14.0735C3.13655 13.9833 2.75012 13.8142 2.46798 13.5321C2.18584 13.2499 2.01672 12.8635 1.92655 12.1928C1.83444 11.5076 1.83337 10.6045 1.83337 9.33332V7.99999Z"
                    fill="url(#paint6_linear_4557_4578)"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_4557_4578"
                      x1="4.4237"
                      y1="-0.59321"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_4557_4578"
                      x1="4.4237"
                      y1="-0.59321"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint2_linear_4557_4578"
                      x1="4.4237"
                      y1="-0.59321"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint3_linear_4557_4578"
                      x1="4.4237"
                      y1="-0.59321"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint4_linear_4557_4578"
                      x1="4.4237"
                      y1="-0.59321"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint5_linear_4557_4578"
                      x1="4.4237"
                      y1="-0.59321"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint6_linear_4557_4578"
                      x1="4.4237"
                      y1="-0.59321"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                  </defs>
                </svg>{" "}
                Created:{" "}
                <strong>
                  {new Date(course.createdAt).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </span>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none">
                  <path
                    d="M8.87186 8.67067C10.063 8.67067 11.0944 8.24344 11.9373 7.40051C12.78 6.55773 13.2073 5.52652 13.2073 4.3352C13.2073 3.14428 12.7801 2.11294 11.9372 1.26988C11.0943 0.42723 10.0629 0 8.87186 0C7.68053 0 6.64932 0.42723 5.80653 1.27002C4.96375 2.1128 4.53638 3.14414 4.53638 4.3352C4.53638 5.52652 4.96375 6.55786 5.80653 7.40065C6.6496 8.2433 7.68094 8.67067 8.87186 8.67067ZM6.55251 2.01585C7.19919 1.36917 7.95779 1.05482 8.87186 1.05482C9.78578 1.05482 10.5445 1.36917 11.1913 2.01585C11.838 2.66267 12.1525 3.42141 12.1525 4.3352C12.1525 5.24926 11.838 6.00786 11.1913 6.65468C10.5445 7.3015 9.78578 7.61585 8.87186 7.61585C7.95807 7.61585 7.19946 7.30136 6.55251 6.65468C5.90569 6.008 5.5912 5.24926 5.5912 4.3352C5.5912 3.42141 5.90569 2.66267 6.55251 2.01585Z"
                    fill="url(#paint0_linear_5343_5048)"
                  />
                  <path
                    d="M16.4577 13.841C16.4333 13.4902 16.3842 13.1076 16.3118 12.7036C16.2388 12.2966 16.1447 11.9118 16.0321 11.5601C15.9156 11.1966 15.7576 10.8376 15.5619 10.4936C15.359 10.1365 15.1206 9.82562 14.8531 9.56978C14.5734 9.30212 14.2309 9.08693 13.8348 8.92996C13.4401 8.77382 13.0027 8.69472 12.5349 8.69472C12.3511 8.69472 12.1734 8.77011 11.8302 8.99354C11.619 9.13129 11.3719 9.29059 11.0962 9.46678C10.8604 9.61702 10.541 9.75778 10.1464 9.88522C9.76149 10.0098 9.37065 10.0729 8.98476 10.0729C8.59914 10.0729 8.2083 10.0098 7.82309 9.88522C7.42896 9.75792 7.10939 9.61716 6.87401 9.46692C6.60086 9.29237 6.35367 9.13307 6.1393 8.99341C5.79639 8.76997 5.61868 8.69458 5.43494 8.69458C4.96692 8.69458 4.52966 8.77382 4.13512 8.9301C3.73933 9.08679 3.3967 9.30199 3.11668 9.56991C2.84917 9.8259 2.61076 10.1367 2.40807 10.4936C2.21265 10.8376 2.05444 11.1964 1.93799 11.5602C1.82552 11.9119 1.73145 12.2966 1.65839 12.7036C1.58588 13.1071 1.53685 13.4898 1.51254 13.8414C1.48865 14.1851 1.47656 14.5429 1.47656 14.9043C1.47656 15.8439 1.77525 16.6046 2.36426 17.1656C2.94598 17.7191 3.71558 17.9998 4.65175 17.9998H13.3189C14.2548 17.9998 15.0244 17.7191 15.6062 17.1656C16.1954 16.605 16.494 15.8441 16.494 14.9042C16.4939 14.5415 16.4817 14.1838 16.4577 13.841ZM14.8789 16.4013C14.4945 16.7672 13.9842 16.945 13.3187 16.945H4.65175C3.98611 16.945 3.4758 16.7672 3.09155 16.4015C2.71458 16.0426 2.53139 15.5528 2.53139 14.9043C2.53139 14.567 2.54251 14.234 2.56476 13.9143C2.58646 13.6007 2.63081 13.2561 2.69659 12.89C2.76155 12.5284 2.84422 12.189 2.94255 11.8818C3.0369 11.5873 3.16557 11.2956 3.32515 11.0146C3.47745 10.7468 3.65268 10.5171 3.84604 10.332C4.0269 10.1588 4.25487 10.0171 4.52348 9.91076C4.77191 9.81244 5.0511 9.7586 5.35419 9.7505C5.39113 9.77014 5.45691 9.80763 5.56348 9.87712C5.78032 10.0184 6.03026 10.1797 6.30656 10.3561C6.61803 10.5547 7.0193 10.7341 7.49872 10.8888C7.98885 11.0473 8.48872 11.1278 8.98489 11.1278C9.48106 11.1278 9.98108 11.0473 10.4709 10.889C10.9508 10.7339 11.3519 10.5547 11.6638 10.3558C11.9465 10.1751 12.1895 10.0186 12.4063 9.87712C12.5129 9.80777 12.5787 9.77014 12.6156 9.7505C12.9188 9.7586 13.198 9.81244 13.4466 9.91076C13.7151 10.0171 13.943 10.1589 14.1239 10.332C14.3172 10.5169 14.4925 10.7467 14.6448 11.0148C14.8045 11.2956 14.9333 11.5874 15.0275 11.8817C15.126 12.1893 15.2088 12.5285 15.2736 12.8898C15.3392 13.2566 15.3837 13.6013 15.4054 13.9144V13.9147C15.4278 14.2332 15.4391 14.5661 15.4392 14.9043C15.4391 15.5529 15.2559 16.0426 14.8789 16.4013Z"
                    fill="url(#paint1_linear_5343_5048)"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_5343_5048"
                      x1="6.70834"
                      y1="-1.08994"
                      x2="11.1776"
                      y2="10.9659"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_5343_5048"
                      x1="5.23826"
                      y1="7.52486"
                      x2="8.44931"
                      y2="21.5035"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                  </defs>
                </svg>{" "}
                Organizer:{" "}
                <strong>
                  {course.createdBy?.firstName
                    ? `${course.createdBy.firstName} ${course.createdBy.lastName || ""}`
                    : "N/A"}
                </strong>
              </span>
              {course.venueName && (
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none">
                    <path
                      d="M8.03059 1.25016C7.85777 1.24891 7.71683 1.38797 7.71558 1.56047C7.71433 1.73297 7.85308 1.87391 8.0259 1.87516C8.1984 1.87641 8.33934 1.73766 8.34059 1.56516C8.34184 1.39266 8.20309 1.25172 8.03059 1.25016Z"
                      fill="url(#paint0_linear_4557_4584)"
                    />
                    <path
                      d="M8.01644 3.12512C6.80985 3.11655 5.82169 4.08996 5.81256 5.29618C5.80347 6.50234 6.77741 7.49097 7.98363 7.50006C7.98922 7.50009 7.99479 7.50013 8.00038 7.50013C9.19891 7.50013 10.1784 6.52962 10.1875 5.329C10.1966 4.1229 9.22269 3.13421 8.01644 3.12512ZM8.00032 6.87516C7.99638 6.87516 7.99225 6.87512 7.98832 6.87509C7.12672 6.86859 6.43103 6.1624 6.43753 5.30087C6.444 4.44321 7.14363 3.75002 7.99975 3.75002C8.00369 3.75002 8.00782 3.75006 8.01175 3.75009C8.87335 3.75659 9.56904 4.46278 9.56254 5.32431C9.55604 6.18197 8.85644 6.87516 8.00032 6.87516Z"
                      fill="url(#paint1_linear_4557_4584)"
                    />
                    <path
                      d="M9.36354 1.48717C9.20098 1.42948 9.02226 1.51464 8.96457 1.67732C8.90691 1.84001 8.99207 2.01861 9.15473 2.07629C10.5312 2.56414 11.4485 3.87511 11.4375 5.33846C11.4363 5.51102 11.5751 5.65199 11.7477 5.6533C11.7485 5.6533 11.7493 5.6533 11.7501 5.6533C11.9215 5.6533 12.0612 5.51493 12.0625 5.34314C12.0755 3.61355 10.9909 2.06395 9.36354 1.48717Z"
                      fill="url(#paint2_linear_4557_4584)"
                    />
                    <path
                      d="M9.91741 11.7638C11.9959 9.08836 13.2949 7.6932 13.3125 5.35245C13.3345 2.40735 10.9444 0 7.9995 0C5.089 0 2.70968 2.35713 2.68756 5.27276C2.66968 7.67698 3.99278 9.07024 6.08566 11.7634C4.00362 12.0745 2.68756 12.8563 2.68756 13.8125C2.68756 14.4531 3.27962 15.0278 4.35472 15.431C5.33325 15.7979 6.62785 16 8 16C9.37216 16 10.6668 15.7979 11.6453 15.431C12.7204 15.0278 13.3125 14.453 13.3125 13.8125C13.3125 12.8568 11.9976 12.0752 9.91741 11.7638ZM3.31253 5.27748C3.33203 2.70469 5.43125 0.625001 7.99957 0.625001C10.5983 0.625001 12.7069 2.74963 12.6875 5.34779C12.6709 7.57073 11.2933 8.94064 9.09401 11.8076C8.70172 12.3187 8.34147 12.802 8.00047 13.2747C7.66047 12.8017 7.30741 12.3271 6.90925 11.8074C4.61906 8.82042 3.29559 7.55405 3.31253 5.27748ZM8 15.375C5.31716 15.375 3.31253 14.5501 3.31253 13.8125C3.31253 13.2655 4.5109 12.5745 6.52585 12.3352C6.97125 12.9197 7.36175 13.4506 7.74475 13.9928C7.80325 14.0757 7.89832 14.125 7.99972 14.125C7.99982 14.125 7.99991 14.125 8 14.125C8.10132 14.125 8.19635 14.0759 8.25494 13.9932C8.63432 13.4581 9.03551 12.914 9.4771 12.3356C11.4902 12.5751 12.6875 13.2659 12.6875 13.8126C12.6875 14.5501 10.6829 15.375 8 15.375Z"
                      fill="url(#paint3_linear_4557_4584)"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_4557_4584"
                        x1="7.87214"
                        y1="1.17158"
                        x2="8.19431"
                        y2="2.04062"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                      <linearGradient
                        id="paint1_linear_4557_4584"
                        x1="6.9084"
                        y1="2.57509"
                        x2="9.16356"
                        y2="8.65822"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                      <linearGradient
                        id="paint2_linear_4557_4584"
                        x1="9.72708"
                        y1="0.943144"
                        x2="12.367"
                        y2="6.24633"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                      <linearGradient
                        id="paint3_linear_4557_4584"
                        x1="5.34887"
                        y1="-2.01128"
                        x2="16.1186"
                        y2="17.2805"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                    </defs>
                  </svg>{" "}
                  <strong>{course.venueName}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Row className="gx-3 gy-3 mb-4">
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none">
                <path
                  d="M19 12C19 12.5523 18.5523 13 18 13C17.4477 13 17 12.5523 17 12C17 11.4477 17.4477 11 18 11C18.5523 11 19 11.4477 19 12Z"
                  fill="#E89A16"
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M9.94358 3.25H13.0564C14.8942 3.24998 16.3498 3.24997 17.489 3.40314C18.6614 3.56076 19.6104 3.89288 20.3588 4.64124C21.2831 5.56563 21.5777 6.80363 21.6847 8.41008C22.2619 8.6641 22.6978 9.2013 22.7458 9.88179C22.7501 9.94199 22.75 10.0069 22.75 10.067C22.75 10.0725 22.75 10.0779 22.75 10.0833V13.9167C22.75 13.9221 22.75 13.9275 22.75 13.933C22.75 13.9931 22.7501 14.058 22.7458 14.1182C22.6978 14.7987 22.2619 15.3359 21.6847 15.5899C21.5777 17.1964 21.2831 18.4344 20.3588 19.3588C19.6104 20.1071 18.6614 20.4392 17.489 20.5969C16.3498 20.75 14.8942 20.75 13.0564 20.75H9.94359C8.10583 20.75 6.65019 20.75 5.51098 20.5969C4.33856 20.4392 3.38961 20.1071 2.64124 19.3588C1.89288 18.6104 1.56076 17.6614 1.40314 16.489C1.24997 15.3498 1.24998 13.8942 1.25 12.0564V11.9436C1.24998 10.1058 1.24997 8.65019 1.40314 7.51098C1.56076 6.33856 1.89288 5.38961 2.64124 4.64124C3.38961 3.89288 4.33856 3.56076 5.51098 3.40314C6.65019 3.24997 8.10582 3.24998 9.94358 3.25ZM20.1679 15.75H18.2308C16.0856 15.75 14.25 14.1224 14.25 12C14.25 9.87756 16.0856 8.25 18.2308 8.25H20.1679C20.0541 6.90855 19.7966 6.20043 19.2981 5.7019C18.8749 5.27869 18.2952 5.02502 17.2892 4.88976C16.2615 4.75159 14.9068 4.75 13 4.75H10C8.09318 4.75 6.73851 4.75159 5.71085 4.88976C4.70476 5.02502 4.12511 5.27869 3.7019 5.7019C3.27869 6.12511 3.02502 6.70476 2.88976 7.71085C2.75159 8.73851 2.75 10.0932 2.75 12C2.75 13.9068 2.75159 15.2615 2.88976 16.2892C3.02502 17.2952 3.27869 17.8749 3.7019 18.2981C4.12511 18.7213 4.70476 18.975 5.71085 19.1102C6.73851 19.2484 8.09318 19.25 10 19.25H13C14.9068 19.25 16.2615 19.2484 17.2892 19.1102C18.2952 18.975 18.8749 18.7213 19.2981 18.2981C19.7966 17.7996 20.0541 17.0915 20.1679 15.75ZM5.25 8C5.25 7.58579 5.58579 7.25 6 7.25H10C10.4142 7.25 10.75 7.58579 10.75 8C10.75 8.41421 10.4142 8.75 10 8.75H6C5.58579 8.75 5.25 8.41421 5.25 8ZM20.9235 9.75023C20.9032 9.75001 20.8766 9.75 20.8333 9.75H18.2308C16.8074 9.75 15.75 10.8087 15.75 12C15.75 13.1913 16.8074 14.25 18.2308 14.25H20.8333C20.8766 14.25 20.9032 14.25 20.9235 14.2498C20.936 14.2496 20.9426 14.2495 20.9457 14.2493L20.9479 14.2492C21.1541 14.2367 21.2427 14.0976 21.2495 14.0139C21.2495 14.0139 21.2497 14.0076 21.2498 13.9986C21.25 13.9808 21.25 13.9572 21.25 13.9167V10.0833C21.25 10.0428 21.25 10.0192 21.2498 10.0014C21.2497 9.99238 21.2495 9.98609 21.2495 9.98609C21.2427 9.90242 21.1541 9.7633 20.9479 9.75076C20.9479 9.75076 20.943 9.75043 20.9235 9.75023Z"
                  fill="#E89A16"
                />
              </svg>
            </div>
            <div className="kpi-content">
              <h5>{t("perSessionPrice") || "Per Session Price"}</h5>
              <h3>₮{(course.price || 0).toLocaleString()}</h3>
              <p className="small text-muted">{t("singleSessionRate") || "Single session rate"}</p>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none">
                <path
                  d="M20.7566 11.0859C21.4594 10.592 21.9248 9.77047 21.9248 8.84447C21.9248 7.32963 20.6996 6.10446 19.1848 6.10446C17.67 6.10446 16.4448 7.32963 16.4448 8.84447C16.4448 9.77047 16.9054 10.592 17.613 11.0859C17.0099 11.2948 16.459 11.6177 15.9937 12.0356C15.3526 11.4895 14.5975 11.0716 13.7713 10.8247C14.7732 10.2168 15.4476 9.1104 15.4476 7.85199C15.4476 5.93351 13.8947 4.38068 11.9763 4.38068C10.0578 4.38068 8.50495 5.93825 8.50495 7.85199C8.50495 9.1104 9.17451 10.2168 10.1812 10.8247C9.36446 11.0716 8.61892 11.4848 7.98259 12.0214C7.51721 11.613 6.97586 11.2948 6.38227 11.0906C7.08508 10.5967 7.55046 9.77522 7.55046 8.84922C7.55046 7.33438 6.32529 6.10921 4.81045 6.10921C3.29561 6.10921 2.07044 7.33438 2.07044 8.84922C2.07044 9.77522 2.53106 10.5967 3.23862 11.0906C1.35338 11.7412 0 13.5314 0 15.6351V15.9485C0 15.958 0.00949743 15.9675 0.0189949 15.9675H5.82667C5.79343 16.2287 5.77444 16.4994 5.77444 16.7701V17.093C5.77444 18.4891 6.90463 19.6193 8.30075 19.6193H15.6613C17.0574 19.6193 18.1876 18.4891 18.1876 17.093V16.7701C18.1876 16.4994 18.1686 16.2287 18.1353 15.9675H23.981C23.9905 15.9675 24 15.958 24 15.9485V15.6351C23.9905 13.5267 22.6419 11.7364 20.7566 11.0859ZM17.2046 8.83972C17.2046 7.74751 18.0926 6.8595 19.1848 6.8595C20.277 6.8595 21.165 7.74751 21.165 8.83972C21.165 9.91768 20.296 10.7962 19.2228 10.8199C19.2085 10.8199 19.1991 10.8199 19.1848 10.8199C19.1706 10.8199 19.1611 10.8199 19.1468 10.8199C18.0689 10.8009 17.2046 9.92243 17.2046 8.83972ZM9.25524 7.85199C9.25524 6.35614 10.4709 5.14047 11.9668 5.14047C13.4626 5.14047 14.6783 6.35614 14.6783 7.85199C14.6783 9.2956 13.5433 10.478 12.1235 10.5588C12.0712 10.5588 12.019 10.5588 11.9668 10.5588C11.9145 10.5588 11.8623 10.5588 11.8101 10.5588C10.3902 10.478 9.25524 9.2956 9.25524 7.85199ZM2.81599 8.83972C2.81599 7.74751 3.704 6.8595 4.7962 6.8595C5.88841 6.8595 6.77641 7.74751 6.77641 8.83972C6.77641 9.91768 5.9074 10.7962 4.83419 10.8199C4.81994 10.8199 4.81045 10.8199 4.7962 10.8199C4.78195 10.8199 4.77246 10.8199 4.75821 10.8199C3.685 10.8009 2.81599 9.92243 2.81599 8.83972ZM5.95964 15.203H0.769292C0.982984 13.18 2.69252 11.594 4.76771 11.5797C4.77721 11.5797 4.7867 11.5797 4.7962 11.5797C4.8057 11.5797 4.8152 11.5797 4.82469 11.5797C5.81243 11.5845 6.71468 11.9501 7.41274 12.5437C6.72893 13.2845 6.22082 14.1963 5.95964 15.203ZM17.4183 17.093C17.4183 18.0665 16.6252 18.8595 15.6518 18.8595H8.29125C7.31777 18.8595 6.52473 18.0665 6.52473 17.093V16.7701C6.52473 13.8211 8.88009 11.4088 11.8101 11.3233C11.8623 11.328 11.9193 11.328 11.9715 11.328C12.0237 11.328 12.0807 11.328 12.133 11.3233C15.0629 11.4088 17.4183 13.8211 17.4183 16.7701V17.093ZM17.9834 15.203C17.7222 14.201 17.2236 13.3035 16.5445 12.5627C17.2473 11.9549 18.1591 11.5892 19.1563 11.5797C19.1658 11.5797 19.1753 11.5797 19.1848 11.5797C19.1943 11.5797 19.2038 11.5797 19.2133 11.5797C21.2885 11.594 22.998 13.18 23.2117 15.203H17.9834Z"
                  fill="url(#paint0_linear_4557_4491)"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_4557_4491"
                    x1="6.0117"
                    y1="2.46511"
                    x2="11.3867"
                    y2="25.2998"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#23ADA4" />
                    <stop offset="1" stop-color="#23ADA4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="kpi-content">
              <h5>{t("enrolledStudents") || "Enrolled Students"}</h5>
              <h3>
                {course.acquiredSeats || 0}{" "}
                <span className="total-cap">/ {course.totalSeats || 0}</span>
              </h3>
              <div className="progress-bar-container mt-2">
                <div
                  className="progress-bar-filled"
                  style={{ width: `${enrolledPercent}%` }}></div>
              </div>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} xs={12}>
          <div className="kpi-card shadow-sm">
            <div className="kpi-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 31 31"
                fill="none">
                <g clip-path="url(#clip0_4557_4130)">
                  <path
                    d="M27.894 13.084C27.894 12.2664 27.229 11.6012 26.4114 11.6012H24.7373C24.5266 11.6012 24.326 11.6454 24.1444 11.7251V9.1306C24.1444 8.88485 23.9452 8.68567 23.6995 8.68567C23.4537 8.68567 23.2545 8.88485 23.2545 9.1306V17.1999H7.07044V9.1306C7.07044 8.88485 6.87126 8.68567 6.62575 8.68567C6.38001 8.68567 6.18082 8.88485 6.18082 9.1306V11.7251C5.99901 11.6454 5.79843 11.6012 5.5879 11.6012H3.91381C3.09622 11.6012 2.43103 12.2664 2.43103 13.084V17.8549C2.43103 18.7441 2.70341 19.5867 3.22036 20.3031C3.21874 20.3452 3.21805 20.3874 3.21805 20.4298C3.21805 21.507 3.9951 22.4061 5.01813 22.5958V22.896C5.01813 23.504 5.39728 24.0253 5.93138 24.2358V27.7133C5.41465 27.7953 5.01813 28.2441 5.01813 28.7838V29.2739C5.01813 29.8717 5.50452 30.3578 6.10208 30.3578H9.62535C10.2231 30.3578 10.7093 29.8717 10.7093 29.2739V28.7838C10.7093 28.2441 10.313 27.7953 9.79605 27.7133V24.3354H20.5292V27.7133C20.0122 27.7953 19.6159 28.2441 19.6159 28.7838V29.2739C19.6159 29.8717 20.1021 30.3578 20.6999 30.3578H24.2229C24.8207 30.3578 25.3069 29.8717 25.3069 29.2739V28.7838C25.3069 28.2441 24.9106 27.7953 24.3936 27.7133V24.2358C24.9279 24.0253 25.3069 23.504 25.3069 22.896V22.5958C26.3301 22.4061 27.1072 21.507 27.1072 20.4298C27.1072 20.3874 27.1062 20.3452 27.1046 20.3031C27.6218 19.5867 27.894 18.7441 27.894 17.8549V13.084ZM3.53605 19.0325C3.39407 18.6607 3.32088 18.2642 3.32088 17.8549V13.084C3.32088 12.7569 3.58677 12.491 3.91381 12.491H5.5879C5.9147 12.491 6.18082 12.7569 6.18082 13.084V17.2108C5.0142 17.3067 4.02128 18.0252 3.53605 19.0325ZM9.81967 28.7835V29.2739C9.81967 29.3809 9.73236 29.468 9.62535 29.468H6.10208C5.99507 29.468 5.90799 29.3809 5.90799 29.2739V28.7835C5.90799 28.6765 5.99507 28.5895 6.10208 28.5895H9.62535C9.73236 28.5895 9.81967 28.6765 9.81967 28.7835ZM6.82123 27.6996V24.3354H8.9062V27.6996H6.82123ZM24.4172 28.7835V29.2739C24.4172 29.3809 24.3301 29.468 24.2229 29.468H20.6996C20.5926 29.468 20.5055 29.3809 20.5055 29.2739V28.7835C20.5055 28.6765 20.5926 28.5895 20.6996 28.5895H24.2229C24.3301 28.5895 24.4172 28.6765 24.4172 28.7835ZM21.4188 27.6996V24.3354H23.5038V27.6996H21.4188ZM24.4172 22.8957C24.4172 23.1989 24.1706 23.4458 23.8674 23.4458H6.45783C6.15465 23.4458 5.90799 23.1989 5.90799 22.8957V22.6329H24.4172V22.8957ZM24.9039 21.743H5.42114C4.69689 21.743 4.10767 21.154 4.10767 20.4298C4.10767 19.1395 5.15756 18.0896 6.44787 18.0896H23.8773C25.1677 18.0896 26.2176 19.1392 26.2176 20.4298C26.2173 21.154 25.6281 21.743 24.9039 21.743ZM27.0043 17.8549C27.0043 18.2642 26.9311 18.6607 26.7889 19.0325C26.3037 18.0252 25.3108 17.3067 24.1444 17.2108V13.084C24.1444 12.7569 24.4103 12.491 24.7373 12.491H26.4114C26.7382 12.491 27.0043 12.7569 27.0043 13.084V17.8549Z"
                    fill="url(#paint0_linear_4557_4130)"
                  />
                  <path
                    d="M6.62577 7.79489C6.87128 7.79489 7.07047 7.59571 7.07047 7.34997V4.19541C7.07047 2.37263 8.55348 0.889852 10.3763 0.889852H19.949C21.7718 0.889852 23.2546 2.37263 23.2546 4.19541V7.34997C23.2546 7.59571 23.4538 7.79489 23.6995 7.79489C23.9452 7.79489 24.1444 7.59571 24.1444 7.34997V4.19541C24.1444 1.88208 22.2623 0 19.949 0H10.3763C8.06292 0 6.18085 1.88208 6.18085 4.19541V7.34997C6.18085 7.59571 6.38003 7.79489 6.62577 7.79489Z"
                    fill="url(#paint1_linear_4557_4130)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_4557_4130"
                    x1="8.80918"
                    y1="5.96138"
                    x2="18.6447"
                    y2="37.1325"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#23ADA4" />
                    <stop offset="1" stop-color="#23ADA4" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_4557_4130"
                    x1="10.6805"
                    y1="-0.979855"
                    x2="12.6136"
                    y2="11.0368"
                    gradientUnits="userSpaceOnUse">
                    <stop stop-color="#23ADA4" />
                    <stop offset="1" stop-color="#23ADA4" />
                  </linearGradient>
                  <clipPath id="clip0_4557_4130">
                    <rect width="30.3579" height="30.3579" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="kpi-content">
              <h5>{t("seatsAvailable") || "Seats Available"}</h5>
              <h3>{course.leftSeats || 0}</h3>
              <p className="small text-muted">{t("openForEnrollment") || "Open for enrollment"}</p>
            </div>
          </div>
        </Col>
        {!isOngoing && (
          <Col lg={3} md={6} xs={12}>
            <div className="kpi-card shadow-sm">
              <div className="kpi-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  fill="none">
                  <path
                    d="M11.3333 9.33333C11.7015 9.33333 12 9.03486 12 8.66667C12 8.29848 11.7015 8 11.3333 8C10.9652 8 10.6667 8.29848 10.6667 8.66667C10.6667 9.03486 10.9652 9.33333 11.3333 9.33333Z"
                    fill="url(#paint0_linear_4557_4256)"
                  />
                  <path
                    d="M11.3333 12C11.7015 12 12 11.7015 12 11.3333C12 10.9651 11.7015 10.6667 11.3333 10.6667C10.9652 10.6667 10.6667 10.9651 10.6667 11.3333C10.6667 11.7015 10.9652 12 11.3333 12Z"
                    fill="url(#paint1_linear_4557_4256)"
                  />
                  <path
                    d="M8.66668 8.66667C8.66668 9.03486 8.3682 9.33333 8.00001 9.33333C7.63182 9.33333 7.33334 9.03486 7.33334 8.66667C7.33334 8.29848 7.63182 8 8.00001 8C8.3682 8 8.66668 8.29848 8.66668 8.66667Z"
                    fill="url(#paint2_linear_4557_4256)"
                  />
                  <path
                    d="M8.66668 11.3333C8.66668 11.7015 8.3682 12 8.00001 12C7.63182 12 7.33334 11.7015 7.33334 11.3333C7.33334 10.9651 7.63182 10.6667 8.00001 10.6667C8.3682 10.6667 8.66668 10.9651 8.66668 11.3333Z"
                    fill="url(#paint3_linear_4557_4256)"
                  />
                  <path
                    d="M4.66668 9.33333C5.03487 9.33333 5.33334 9.03486 5.33334 8.66667C5.33334 8.29848 5.03487 8 4.66668 8C4.29849 8 4.00001 8.29848 4.00001 8.66667C4.00001 9.03486 4.29849 9.33333 4.66668 9.33333Z"
                    fill="url(#paint4_linear_4557_4256)"
                  />
                  <path
                    d="M4.66668 12C5.03487 12 5.33334 11.7015 5.33334 11.3333C5.33334 10.9651 5.03487 10.6667 4.66668 10.6667C4.29849 10.6667 4.00001 10.9651 4.00001 11.3333C4.00001 11.7015 4.29849 12 4.66668 12Z"
                    fill="url(#paint5_linear_4557_4256)"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M4.66668 1.16667C4.94282 1.16667 5.16668 1.39053 5.16668 1.66667V2.17515C5.60801 2.16666 6.09423 2.16666 6.62898 2.16667H9.37095C9.90572 2.16666 10.392 2.16666 10.8333 2.17515V1.66667C10.8333 1.39053 11.0572 1.16667 11.3333 1.16667C11.6095 1.16667 11.8333 1.39053 11.8333 1.66667V2.21806C12.0066 2.23127 12.1707 2.24788 12.326 2.26876C13.1076 2.37384 13.7403 2.59525 14.2392 3.09416C14.7381 3.59307 14.9595 4.2257 15.0646 5.00732C15.1667 5.76679 15.1667 6.7372 15.1667 7.96236V9.37094C15.1667 10.5961 15.1667 11.5665 15.0646 12.326C14.9595 13.1076 14.7381 13.7403 14.2392 14.2392C13.7403 14.7381 13.1076 14.9595 12.326 15.0646C11.5666 15.1667 10.5961 15.1667 9.37098 15.1667H6.62907C5.40391 15.1667 4.43347 15.1667 3.674 15.0646C2.89238 14.9595 2.25975 14.7381 1.76084 14.2392C1.26193 13.7403 1.04052 13.1076 0.935434 12.326C0.833325 11.5665 0.833333 10.5961 0.833344 9.37094V7.96239C0.833333 6.73722 0.833325 5.7668 0.935434 5.00732C1.04052 4.2257 1.26193 3.59307 1.76084 3.09416C2.25975 2.59525 2.89238 2.37384 3.674 2.26876C3.82928 2.24788 3.99338 2.23127 4.16668 2.21806V1.66667C4.16668 1.39053 4.39054 1.16667 4.66668 1.16667ZM3.80724 3.25984C3.13652 3.35002 2.75009 3.51913 2.46795 3.80127C2.18581 4.08341 2.01669 4.46984 1.92652 5.14057C1.91124 5.25416 1.89848 5.37374 1.8878 5.5H14.1122C14.1015 5.37374 14.0888 5.25416 14.0735 5.14057C13.9833 4.46984 13.8142 4.08341 13.5321 3.80127C13.2499 3.51913 12.8635 3.35002 12.1928 3.25984C11.5077 3.16773 10.6046 3.16667 9.33334 3.16667H6.66668C5.39546 3.16667 4.49235 3.16773 3.80724 3.25984ZM1.83334 8C1.83334 7.43066 1.83356 6.93515 1.84207 6.5H14.158C14.1665 6.93515 14.1667 7.43066 14.1667 8V9.33333C14.1667 10.6045 14.1656 11.5077 14.0735 12.1928C13.9833 12.8635 13.8142 13.2499 13.5321 13.5321C13.2499 13.8142 12.8635 13.9833 12.1928 14.0735C11.5077 14.1656 10.6046 14.1667 9.33334 14.1667H6.66668C5.39546 14.1667 4.49235 14.1656 3.80724 14.0735C3.13652 13.9833 2.75009 13.8142 2.46795 13.5321C2.18581 13.2499 2.01669 12.8635 1.92652 12.1928C1.83441 11.5077 1.83334 10.6045 1.83334 9.33333V8Z"
                    fill="url(#paint6_linear_4557_4256)"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_4557_4256"
                      x1="4.42367"
                      y1="-0.593198"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_4557_4256"
                      x1="4.42367"
                      y1="-0.593198"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint2_linear_4557_4256"
                      x1="4.42367"
                      y1="-0.593198"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint3_linear_4557_4256"
                      x1="4.42367"
                      y1="-0.593198"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint4_linear_4557_4256"
                      x1="4.42367"
                      y1="-0.593198"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint5_linear_4557_4256"
                      x1="4.42367"
                      y1="-0.593198"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint6_linear_4557_4256"
                      x1="4.42367"
                      y1="-0.593198"
                      x2="11.5116"
                      y2="18.9812"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="kpi-content">
                <h5>{t("totalBatches") || "Total Batches"}</h5>
                <h3>{course.batches?.length || 0}</h3>
                <p className="small text-muted">{t("activeClassGroups") || "Active class groups"}</p>
              </div>
            </div>
          </Col>
        )}
      </Row>

      {/* Passes Row */}
      {(course.oneMonthPassEnabled || course.threeMonthPassEnabled) && (
        <Row className="gx-3 gy-3 mb-4">
          <Col xs={12}>
            <div className="content-card p-4">
              <h4 className="card-heading-line mb-3">
                <span>{t("passPricing") || "Pass Pricing"}</span>
              </h4>
              <Row className="gx-3 gy-3">
                {course.oneMonthPassEnabled && (
                  <Col md={6} xs={12}>
                    <div className="pass-card">
                      <div className="d-flex align-items-center gap-3">
                        <div className="pass-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 16 16"
                            fill="none">
                            <path
                              d="M11.3334 9.33332C11.7016 9.33332 12 9.03485 12 8.66666C12 8.29847 11.7016 7.99999 11.3334 7.99999C10.9652 7.99999 10.6667 8.29847 10.6667 8.66666C10.6667 9.03485 10.9652 9.33332 11.3334 9.33332Z"
                              fill="url(#paint0_linear_4557_4578)"
                            />
                            <path
                              d="M11.3334 12C11.7016 12 12 11.7015 12 11.3333C12 10.9651 11.7016 10.6667 11.3334 10.6667C10.9652 10.6667 10.6667 10.9651 10.6667 11.3333C10.6667 11.7015 10.9652 12 11.3334 12Z"
                              fill="url(#paint1_linear_4557_4578)"
                            />
                            <path
                              d="M8.66671 8.66666C8.66671 9.03485 8.36823 9.33332 8.00004 9.33332C7.63185 9.33332 7.33337 9.03485 7.33337 8.66666C7.33337 8.29847 7.63185 7.99999 8.00004 7.99999C8.36823 7.99999 8.66671 8.29847 8.66671 8.66666Z"
                              fill="url(#paint2_linear_4557_4578)"
                            />
                            <path
                              d="M8.66671 11.3333C8.66671 11.7015 8.36823 12 8.00004 12C7.63185 12 7.33337 11.7015 7.33337 11.3333C7.33337 10.9651 7.63185 10.6667 8.00004 10.6667C8.36823 10.6667 8.66671 10.9651 8.66671 11.3333Z"
                              fill="url(#paint3_linear_4557_4578)"
                            />
                            <path
                              d="M4.66671 9.33332C5.0349 9.33332 5.33337 9.03485 5.33337 8.66666C5.33337 8.29847 5.0349 7.99999 4.66671 7.99999C4.29852 7.99999 4.00004 8.29847 4.00004 8.66666C4.00004 9.03485 4.29852 9.33332 4.66671 9.33332Z"
                              fill="url(#paint4_linear_4557_4578)"
                            />
                            <path
                              d="M4.66671 12C5.0349 12 5.33337 11.7015 5.33337 11.3333C5.33337 10.9651 5.0349 10.6667 4.66671 10.6667C4.29852 10.6667 4.00004 10.9651 4.00004 11.3333C4.00004 11.7015 4.29852 12 4.66671 12Z"
                              fill="url(#paint5_linear_4557_4578)"
                            />
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M4.66671 1.16666C4.94285 1.16666 5.16671 1.39051 5.16671 1.66666V2.17514C5.60804 2.16665 6.09426 2.16665 6.62901 2.16666H9.37099C9.90575 2.16665 10.392 2.16665 10.8334 2.17514V1.66666C10.8334 1.39051 11.0572 1.16666 11.3334 1.16666C11.6095 1.16666 11.8334 1.39051 11.8334 1.66666V2.21805C12.0067 2.23126 12.1708 2.24787 12.3261 2.26875C13.1077 2.37383 13.7403 2.59524 14.2392 3.09415C14.7381 3.59306 14.9595 4.22569 15.0646 5.00731C15.1667 5.76678 15.1667 6.73719 15.1667 7.96235V9.37093C15.1667 10.5961 15.1667 11.5665 15.0646 12.326C14.9595 13.1076 14.7381 13.7403 14.2392 14.2392C13.7403 14.7381 13.1077 14.9595 12.3261 15.0646C11.5666 15.1667 10.5962 15.1667 9.37101 15.1667H6.6291C5.40394 15.1667 4.4335 15.1667 3.67403 15.0646C2.89241 14.9595 2.25978 14.7381 1.76087 14.2392C1.26196 13.7403 1.04055 13.1076 0.935464 12.326C0.833355 11.5665 0.833364 10.5961 0.833374 9.37093V7.96238C0.833364 6.73721 0.833355 5.76678 0.935464 5.00731C1.04055 4.22569 1.26196 3.59306 1.76087 3.09415C2.25978 2.59524 2.89241 2.37383 3.67403 2.26875C3.82931 2.24787 3.99341 2.23126 4.16671 2.21805V1.66666C4.16671 1.39051 4.39057 1.16666 4.66671 1.16666ZM3.80727 3.25983C3.13655 3.35001 2.75012 3.51912 2.46798 3.80126C2.18584 4.0834 2.01672 4.46983 1.92655 5.14056C1.91128 5.25415 1.89851 5.37373 1.88783 5.49999H14.1123C14.1016 5.37373 14.0888 5.25415 14.0735 5.14056C13.9834 4.46983 13.8142 4.0834 13.5321 3.80126C13.25 3.51912 12.8635 3.35001 12.1928 3.25983C11.5077 3.16772 10.6046 3.16666 9.33337 3.16666H6.66671C5.39549 3.16666 4.49238 3.16772 3.80727 3.25983ZM1.83337 7.99999C1.83337 7.43065 1.83359 6.93514 1.8421 6.49999H14.158C14.1665 6.93514 14.1667 7.43065 14.1667 7.99999V9.33332C14.1667 10.6045 14.1656 11.5076 14.0735 12.1928C13.9834 12.8635 13.8142 13.2499 13.5321 13.5321C13.25 13.8142 12.8635 13.9833 12.1928 14.0735C11.5077 14.1656 10.6046 14.1667 9.33337 14.1667H6.66671C5.39549 14.1667 4.49238 14.1656 3.80727 14.0735C3.13655 13.9833 2.75012 13.8142 2.46798 13.5321C2.18584 13.2499 2.01672 12.8635 1.92655 12.1928C1.83444 11.5076 1.83337 10.6045 1.83337 9.33332V7.99999Z"
                              fill="url(#paint6_linear_4557_4578)"
                            />
                            <defs>
                              <linearGradient
                                id="paint0_linear_4557_4578"
                                x1="4.4237"
                                y1="-0.59321"
                                x2="11.5116"
                                y2="18.9812"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint1_linear_4557_4578"
                                x1="4.4237"
                                y1="-0.59321"
                                x2="11.5116"
                                y2="18.9812"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint2_linear_4557_4578"
                                x1="4.4237"
                                y1="-0.59321"
                                x2="11.5116"
                                y2="18.9812"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint3_linear_4557_4578"
                                x1="4.4237"
                                y1="-0.59321"
                                x2="11.5116"
                                y2="18.9812"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint4_linear_4557_4578"
                                x1="4.4237"
                                y1="-0.59321"
                                x2="11.5116"
                                y2="18.9812"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint5_linear_4557_4578"
                                x1="4.4237"
                                y1="-0.59321"
                                x2="11.5116"
                                y2="18.9812"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint6_linear_4557_4578"
                                x1="4.4237"
                                y1="-0.59321"
                                x2="11.5116"
                                y2="18.9812"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                        <div>
                          <p className="pass-label">1 Month Pass</p>
                          <h4 className="pass-price">
                            ₮{(course.oneMonthPassPrice || 0).toLocaleString()}
                          </h4>
                          <p className="pass-sub">{t("thirtyDaysUnlimitedAccess") || "30 days unlimited access"}</p>
                        </div>
                      </div>
                    </div>
                  </Col>
                )}
                {course.threeMonthPassEnabled && (
                  <Col md={6} xs={12}>
                    <div className="pass-card">
                      <div className="d-flex align-items-center gap-3">
                        <div className="pass-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none">
                            <path
                              d="M11.3333 9.33366C11.7015 9.33366 12 9.03518 12 8.66699C12 8.2988 11.7015 8.00033 11.3333 8.00033C10.9652 8.00033 10.6667 8.2988 10.6667 8.66699C10.6667 9.03518 10.9652 9.33366 11.3333 9.33366Z"
                              fill="url(#paint0_linear_4825_11073)"
                            />
                            <path
                              d="M11.3333 12.0003C11.7015 12.0003 12 11.7018 12 11.3337C12 10.9655 11.7015 10.667 11.3333 10.667C10.9652 10.667 10.6667 10.9655 10.6667 11.3337C10.6667 11.7018 10.9652 12.0003 11.3333 12.0003Z"
                              fill="url(#paint1_linear_4825_11073)"
                            />
                            <path
                              d="M8.66668 8.66699C8.66668 9.03518 8.3682 9.33366 8.00001 9.33366C7.63182 9.33366 7.33334 9.03518 7.33334 8.66699C7.33334 8.2988 7.63182 8.00033 8.00001 8.00033C8.3682 8.00033 8.66668 8.2988 8.66668 8.66699Z"
                              fill="url(#paint2_linear_4825_11073)"
                            />
                            <path
                              d="M8.66668 11.3337C8.66668 11.7018 8.3682 12.0003 8.00001 12.0003C7.63182 12.0003 7.33334 11.7018 7.33334 11.3337C7.33334 10.9655 7.63182 10.667 8.00001 10.667C8.3682 10.667 8.66668 10.9655 8.66668 11.3337Z"
                              fill="url(#paint3_linear_4825_11073)"
                            />
                            <path
                              d="M4.66668 9.33366C5.03487 9.33366 5.33334 9.03518 5.33334 8.66699C5.33334 8.2988 5.03487 8.00033 4.66668 8.00033C4.29849 8.00033 4.00001 8.2988 4.00001 8.66699C4.00001 9.03518 4.29849 9.33366 4.66668 9.33366Z"
                              fill="url(#paint4_linear_4825_11073)"
                            />
                            <path
                              d="M4.66668 12.0003C5.03487 12.0003 5.33334 11.7018 5.33334 11.3337C5.33334 10.9655 5.03487 10.667 4.66668 10.667C4.29849 10.667 4.00001 10.9655 4.00001 11.3337C4.00001 11.7018 4.29849 12.0003 4.66668 12.0003Z"
                              fill="url(#paint5_linear_4825_11073)"
                            />
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M4.66668 1.16699C4.94282 1.16699 5.16668 1.39085 5.16668 1.66699V2.17547C5.60801 2.16698 6.09423 2.16699 6.62898 2.16699H9.37095C9.90572 2.16699 10.392 2.16698 10.8333 2.17547V1.66699C10.8333 1.39085 11.0572 1.16699 11.3333 1.16699C11.6095 1.16699 11.8333 1.39085 11.8333 1.66699V2.21838C12.0066 2.2316 12.1707 2.2482 12.326 2.26908C13.1076 2.37417 13.7403 2.59558 14.2392 3.09449C14.7381 3.5934 14.9595 4.22603 15.0646 5.00764C15.1667 5.76711 15.1667 6.73753 15.1667 7.96269V9.37127C15.1667 10.5964 15.1667 11.5669 15.0646 12.3263C14.9595 13.108 14.7381 13.7406 14.2392 14.2395C13.7403 14.7384 13.1076 14.9598 12.326 15.0649C11.5666 15.167 10.5961 15.167 9.37098 15.167H6.62907C5.40391 15.167 4.43347 15.167 3.674 15.0649C2.89238 14.9598 2.25975 14.7384 1.76084 14.2395C1.26193 13.7406 1.04052 13.108 0.935434 12.3263C0.833325 11.5669 0.833333 10.5964 0.833344 9.37127V7.96271C0.833333 6.73754 0.833325 5.76712 0.935434 5.00764C1.04052 4.22603 1.26193 3.5934 1.76084 3.09449C2.25975 2.59558 2.89238 2.37417 3.674 2.26908C3.82928 2.2482 3.99338 2.2316 4.16668 2.21838V1.66699C4.16668 1.39085 4.39054 1.16699 4.66668 1.16699ZM3.80724 3.26016C3.13652 3.35034 2.75009 3.51945 2.46795 3.80159C2.18581 4.08373 2.01669 4.47017 1.92652 5.14089C1.91124 5.25448 1.89848 5.37407 1.8878 5.50033H14.1122C14.1015 5.37407 14.0888 5.25448 14.0735 5.14089C13.9833 4.47017 13.8142 4.08373 13.5321 3.80159C13.2499 3.51945 12.8635 3.35034 12.1928 3.26016C11.5077 3.16805 10.6046 3.16699 9.33334 3.16699H6.66668C5.39546 3.16699 4.49235 3.16805 3.80724 3.26016ZM1.83334 8.00033C1.83334 7.43098 1.83356 6.93548 1.84207 6.50033H14.158C14.1665 6.93548 14.1667 7.43098 14.1667 8.00033V9.33366C14.1667 10.6049 14.1656 11.508 14.0735 12.1931C13.9833 12.8638 13.8142 13.2502 13.5321 13.5324C13.2499 13.8145 12.8635 13.9836 12.1928 14.0738C11.5077 14.1659 10.6046 14.167 9.33334 14.167H6.66668C5.39546 14.167 4.49235 14.1659 3.80724 14.0738C3.13652 13.9836 2.75009 13.8145 2.46795 13.5324C2.18581 13.2502 2.01669 12.8638 1.92652 12.1931C1.83441 11.508 1.83334 10.6049 1.83334 9.33366V8.00033Z"
                              fill="url(#paint6_linear_4825_11073)"
                            />
                            <defs>
                              <linearGradient
                                id="paint0_linear_4825_11073"
                                x1="4.42367"
                                y1="-0.592874"
                                x2="11.5116"
                                y2="18.9816"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint1_linear_4825_11073"
                                x1="4.42367"
                                y1="-0.592874"
                                x2="11.5116"
                                y2="18.9816"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint2_linear_4825_11073"
                                x1="4.42367"
                                y1="-0.592874"
                                x2="11.5116"
                                y2="18.9816"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint3_linear_4825_11073"
                                x1="4.42367"
                                y1="-0.592874"
                                x2="11.5116"
                                y2="18.9816"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint4_linear_4825_11073"
                                x1="4.42367"
                                y1="-0.592874"
                                x2="11.5116"
                                y2="18.9816"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint5_linear_4825_11073"
                                x1="4.42367"
                                y1="-0.592874"
                                x2="11.5116"
                                y2="18.9816"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                              <linearGradient
                                id="paint6_linear_4825_11073"
                                x1="4.42367"
                                y1="-0.592874"
                                x2="11.5116"
                                y2="18.9816"
                                gradientUnits="userSpaceOnUse">
                                <stop stop-color="#23ADA4" />
                                <stop offset="1" stop-color="#23ADA4" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                        <div>
                          <p className="pass-label">3 Month Pass</p>
                          <h4 className="pass-price">
                            ₮
                            {(course.threeMonthPassPrice || 0).toLocaleString()}
                          </h4>
                          <p className="pass-sub">{t("ninetyDaysUnlimitedAccess") || "90 days unlimited access"}</p>
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
            <h4 className="card-heading-line mb-3">
              <span>{t("shortDescription") || "Short Description"}</span>
            </h4>
            <ExpandableText text={course.shortdesc} limit={250} />
          </div>

          {course.longdesc && (
            <div className="content-card mb-4 p-4">
              <h4 className="card-heading-line mb-3">
                <span>{t("fullDescription") || "Full Description"}</span>
              </h4>
              <ExpandableText text={course.longdesc} limit={450} />
            </div>
          )}

          {course.whatYouWillLearn && (
            <div className="content-card mb-4 p-4">
              <h4 className="card-heading-line mb-3">
                <span> {t("whatYouWillLearn") || "What You Will Learn"}</span>
              </h4>
              <ExpandableText text={course.whatYouWillLearn} limit={400} />
            </div>
          )}

          {/* Weekly Schedule */}
          {course.weeklySchedule && orderedSchedule.length > 0 && (
            <div className="content-card mb-4 p-4">
              <h4 className="card-heading-line mb-3">
                <span>{t("weeklySchedule") || "Weekly Schedule"}</span>
              </h4>
              <div className="d-flex flex-column gap-2">
                {orderedSchedule.map((day) => {
                  const dayData = course.weeklySchedule[day];
                  const isOpen = expandedDay === day;
                  return (
                    <div key={day} className="schedule-day-block">
                      <button
                        className="schedule-day-header w-100 border-0 bg-transparent text-start d-flex justify-content-between align-items-center"
                        onClick={() => setExpandedDay(isOpen ? null : day)}>
                        <div className="d-flex align-items-center gap-3">
                          <span className="day-badge">{day}</span>
                          <span className="day-date text-muted">
                            {dayData.date}
                          </span>
                          <span className="small text-secondary">
                            {dayData.slots?.length} slot
                            {dayData.slots?.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span style={{ color: "#23ada4", fontSize: "14px" }}>
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="schedule-slots-list mt-2">
                          {dayData.slots?.map((slot, idx) => (
                            <div
                              key={idx}
                              className={`slot-row w-100 d-flex justify-content-between align-items-center p-3 mb-2 rounded ${slot.isCancelled ? "opacity-50" : ""}`}>
                              <div
                                onClick={() =>
                                  !slot.isCancelled && fetchSlotAttendees(slot)
                                }
                                style={{
                                  flex: 1,
                                  cursor: slot.isCancelled
                                    ? "default"
                                    : "pointer",
                                }}
                                className={
                                  !slot.isCancelled ? "slot-clickable" : ""
                                }>
                                <div className="d-flex align-items-center gap-2">
                                  {/* <p className="mb-0 text-white" style={{ fontWeight: 600, fontSize: "14px", textDecoration: slot.isCancelled ? "line-through" : "none" }}>{slot.batchName}</p> */}
                                  {slot.isCancelled && (
                                    <span className="badge bg-danger">
                                      Cancelled
                                    </span>
                                  )}
                                </div>
                                <p
                                  className="mb-0 text-secondary"
                                  style={{ fontSize: "12px" }}>
                                  {formatTime(slot.startTime, true, language)} –{" "}
                                  {formatTime(slot.endTime, true, language)}
                                </p>
                              </div>
                              <div className="text-end d-flex align-items-center gap-3">
                                <div
                                  onClick={() =>
                                    !slot.isCancelled &&
                                    fetchSlotAttendees(slot)
                                  }
                                  style={{
                                    cursor: slot.isCancelled
                                      ? "default"
                                      : "pointer",
                                  }}
                                  className={
                                    !slot.isCancelled ? "slot-clickable" : ""
                                  }>
                                  {!slot.isCancelled && (
                                    <>
                                      <p
                                        className="mb-0"
                                        style={{
                                          fontSize: "12px",
                                          color: slot.isFull
                                            ? "#dc3545"
                                            : "#28a745",
                                        }}>
                                        {slot.isFull
                                          ? "🔴 Full"
                                          : `🟢 ${slot.availableSeats} left`}
                                      </p>
                                      <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>
                                        Seats: {slot.seats} | Booked: {slot.bookedSeats || 0} | Reserved: {slot.ReservedExternally || 0}
                                      </p>
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          color: "#23ada4",
                                          fontWeight: 600,
                                        }}>
                                        View Attendees →
                                      </span>
                                    </>
                                  )}
                                </div>
                                {!slot.isCancelled &&
                                  slot.batchId &&
                                  slot.date && (
                                    <div className="d-flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSlot(slot);
                                          setTempReservedExternally(
                                            slot.ReservedExternally || 0,
                                          );
                                          setShowReservationModal(true);
                                        }}
                                        className="btn btn-warning btn-sm border-0 text-dark"
                                        style={{
                                          fontSize: "11px",
                                          padding: "4px 10px",
                                          borderRadius: "6px",
                                          fontWeight: 600,
                                        }}>
                                        Reserve
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSlot(slot);
                                          setCancelMode("slot");
                                          setCancelModalOpen(true);
                                        }}
                                        className="btn btn-danger btn-sm border-0"
                                        style={{
                                          fontSize: "11px",
                                          padding: "4px 10px",
                                          borderRadius: "6px",
                                          fontWeight: 600,
                                        }}>
                                        Cancel
                                      </button>
                                    </div>
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
              <h4 className="card-heading-line mb-3">
                <span> Gallery</span>
              </h4>
              <div className="details-gallery-grid">
                {course.mediaLinks.map((link, idx) => (
                  <div key={idx} className="details-gallery-item">
                    <img
                      src={link}
                      alt={`Gallery ${idx + 1}`}
                      onError={(e) => {
                        e.target.src = "/img/sidebar-logo.svg";
                      }}
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
            <h4 className="card-heading-line mb-3">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none">
                  <path
                    d="M8.03059 1.25016C7.85777 1.24891 7.71683 1.38797 7.71558 1.56047C7.71433 1.73297 7.85308 1.87391 8.0259 1.87516C8.1984 1.87641 8.33934 1.73766 8.34059 1.56516C8.34184 1.39266 8.20309 1.25172 8.03059 1.25016Z"
                    fill="url(#paint0_linear_4557_4584)"
                  />
                  <path
                    d="M8.01644 3.12512C6.80985 3.11655 5.82169 4.08996 5.81256 5.29618C5.80347 6.50234 6.77741 7.49097 7.98363 7.50006C7.98922 7.50009 7.99479 7.50013 8.00038 7.50013C9.19891 7.50013 10.1784 6.52962 10.1875 5.329C10.1966 4.1229 9.22269 3.13421 8.01644 3.12512ZM8.00032 6.87516C7.99638 6.87516 7.99225 6.87512 7.98832 6.87509C7.12672 6.86859 6.43103 6.1624 6.43753 5.30087C6.444 4.44321 7.14363 3.75002 7.99975 3.75002C8.00369 3.75002 8.00782 3.75006 8.01175 3.75009C8.87335 3.75659 9.56904 4.46278 9.56254 5.32431C9.55604 6.18197 8.85644 6.87516 8.00032 6.87516Z"
                    fill="url(#paint1_linear_4557_4584)"
                  />
                  <path
                    d="M9.36354 1.48717C9.20098 1.42948 9.02226 1.51464 8.96457 1.67732C8.90691 1.84001 8.99207 2.01861 9.15473 2.07629C10.5312 2.56414 11.4485 3.87511 11.4375 5.33846C11.4363 5.51102 11.5751 5.65199 11.7477 5.6533C11.7485 5.6533 11.7493 5.6533 11.7501 5.6533C11.9215 5.6533 12.0612 5.51493 12.0625 5.34314C12.0755 3.61355 10.9909 2.06395 9.36354 1.48717Z"
                    fill="url(#paint2_linear_4557_4584)"
                  />
                  <path
                    d="M9.91741 11.7638C11.9959 9.08836 13.2949 7.6932 13.3125 5.35245C13.3345 2.40735 10.9444 0 7.9995 0C5.089 0 2.70968 2.35713 2.68756 5.27276C2.66968 7.67698 3.99278 9.07024 6.08566 11.7634C4.00362 12.0745 2.68756 12.8563 2.68756 13.8125C2.68756 14.4531 3.27962 15.0278 4.35472 15.431C5.33325 15.7979 6.62785 16 8 16C9.37216 16 10.6668 15.7979 11.6453 15.431C12.7204 15.0278 13.3125 14.453 13.3125 13.8125C13.3125 12.8568 11.9976 12.0752 9.91741 11.7638ZM3.31253 5.27748C3.33203 2.70469 5.43125 0.625001 7.99957 0.625001C10.5983 0.625001 12.7069 2.74963 12.6875 5.34779C12.6709 7.57073 11.2933 8.94064 9.09401 11.8076C8.70172 12.3187 8.34147 12.802 8.00047 13.2747C7.66047 12.8017 7.30741 12.3271 6.90925 11.8074C4.61906 8.82042 3.29559 7.55405 3.31253 5.27748ZM8 15.375C5.31716 15.375 3.31253 14.5501 3.31253 13.8125C3.31253 13.2655 4.5109 12.5745 6.52585 12.3352C6.97125 12.9197 7.36175 13.4506 7.74475 13.9928C7.80325 14.0757 7.89832 14.125 7.99972 14.125C7.99982 14.125 7.99991 14.125 8 14.125C8.10132 14.125 8.19635 14.0759 8.25494 13.9932C8.63432 13.4581 9.03551 12.914 9.4771 12.3356C11.4902 12.5751 12.6875 13.2659 12.6875 13.8126C12.6875 14.5501 10.6829 15.375 8 15.375Z"
                    fill="url(#paint3_linear_4557_4584)"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_4557_4584"
                      x1="7.87214"
                      y1="1.17158"
                      x2="8.19431"
                      y2="2.04062"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_4557_4584"
                      x1="6.9084"
                      y1="2.57509"
                      x2="9.16356"
                      y2="8.65822"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint2_linear_4557_4584"
                      x1="9.72708"
                      y1="0.943144"
                      x2="12.367"
                      y2="6.24633"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                    <linearGradient
                      id="paint3_linear_4557_4584"
                      x1="5.34887"
                      y1="-2.01128"
                      x2="16.1186"
                      y2="17.2805"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#23ADA4" />
                      <stop offset="1" stop-color="#23ADA4" />
                    </linearGradient>
                  </defs>
                </svg>{" "}
                {t("locationDates") || "Location & Dates"}
              </span>
            </h4>
            <div className="d-flex flex-column gap-3">
              {course.venueName && (
                <div className="d-flex align-items-start gap-2">
                  <span className="icon-schedule">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none">
                      <path
                        d="M8.03059 1.25016C7.85777 1.24891 7.71683 1.38797 7.71558 1.56047C7.71433 1.73297 7.85308 1.87391 8.0259 1.87516C8.1984 1.87641 8.33934 1.73766 8.34059 1.56516C8.34184 1.39266 8.20309 1.25172 8.03059 1.25016Z"
                        fill="url(#paint0_linear_4557_4584)"
                      />
                      <path
                        d="M8.01644 3.12512C6.80985 3.11655 5.82169 4.08996 5.81256 5.29618C5.80347 6.50234 6.77741 7.49097 7.98363 7.50006C7.98922 7.50009 7.99479 7.50013 8.00038 7.50013C9.19891 7.50013 10.1784 6.52962 10.1875 5.329C10.1966 4.1229 9.22269 3.13421 8.01644 3.12512ZM8.00032 6.87516C7.99638 6.87516 7.99225 6.87512 7.98832 6.87509C7.12672 6.86859 6.43103 6.1624 6.43753 5.30087C6.444 4.44321 7.14363 3.75002 7.99975 3.75002C8.00369 3.75002 8.00782 3.75006 8.01175 3.75009C8.87335 3.75659 9.56904 4.46278 9.56254 5.32431C9.55604 6.18197 8.85644 6.87516 8.00032 6.87516Z"
                        fill="url(#paint1_linear_4557_4584)"
                      />
                      <path
                        d="M9.36354 1.48717C9.20098 1.42948 9.02226 1.51464 8.96457 1.67732C8.90691 1.84001 8.99207 2.01861 9.15473 2.07629C10.5312 2.56414 11.4485 3.87511 11.4375 5.33846C11.4363 5.51102 11.5751 5.65199 11.7477 5.6533C11.7485 5.6533 11.7493 5.6533 11.7501 5.6533C11.9215 5.6533 12.0612 5.51493 12.0625 5.34314C12.0755 3.61355 10.9909 2.06395 9.36354 1.48717Z"
                        fill="url(#paint2_linear_4557_4584)"
                      />
                      <path
                        d="M9.91741 11.7638C11.9959 9.08836 13.2949 7.6932 13.3125 5.35245C13.3345 2.40735 10.9444 0 7.9995 0C5.089 0 2.70968 2.35713 2.68756 5.27276C2.66968 7.67698 3.99278 9.07024 6.08566 11.7634C4.00362 12.0745 2.68756 12.8563 2.68756 13.8125C2.68756 14.4531 3.27962 15.0278 4.35472 15.431C5.33325 15.7979 6.62785 16 8 16C9.37216 16 10.6668 15.7979 11.6453 15.431C12.7204 15.0278 13.3125 14.453 13.3125 13.8125C13.3125 12.8568 11.9976 12.0752 9.91741 11.7638ZM3.31253 5.27748C3.33203 2.70469 5.43125 0.625001 7.99957 0.625001C10.5983 0.625001 12.7069 2.74963 12.6875 5.34779C12.6709 7.57073 11.2933 8.94064 9.09401 11.8076C8.70172 12.3187 8.34147 12.802 8.00047 13.2747C7.66047 12.8017 7.30741 12.3271 6.90925 11.8074C4.61906 8.82042 3.29559 7.55405 3.31253 5.27748ZM8 15.375C5.31716 15.375 3.31253 14.5501 3.31253 13.8125C3.31253 13.2655 4.5109 12.5745 6.52585 12.3352C6.97125 12.9197 7.36175 13.4506 7.74475 13.9928C7.80325 14.0757 7.89832 14.125 7.99972 14.125C7.99982 14.125 7.99991 14.125 8 14.125C8.10132 14.125 8.19635 14.0759 8.25494 13.9932C8.63432 13.4581 9.03551 12.914 9.4771 12.3356C11.4902 12.5751 12.6875 13.2659 12.6875 13.8126C12.6875 14.5501 10.6829 15.375 8 15.375Z"
                        fill="url(#paint3_linear_4557_4584)"
                      />
                      <defs>
                        <linearGradient
                          id="paint0_linear_4557_4584"
                          x1="7.87214"
                          y1="1.17158"
                          x2="8.19431"
                          y2="2.04062"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                        <linearGradient
                          id="paint1_linear_4557_4584"
                          x1="6.9084"
                          y1="2.57509"
                          x2="9.16356"
                          y2="8.65822"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                        <linearGradient
                          id="paint2_linear_4557_4584"
                          x1="9.72708"
                          y1="0.943144"
                          x2="12.367"
                          y2="6.24633"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                        <linearGradient
                          id="paint3_linear_4557_4584"
                          x1="5.34887"
                          y1="-2.01128"
                          x2="16.1186"
                          y2="17.2805"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                  <div>
                    <h6
                      className="mb-1 text-muted"
                      style={{ fontSize: "12px" }}>
                      {t("venue") || "Venue"}
                    </h6>
                    <p
                      className="text-white mb-0"
                      style={{ fontSize: "14px", fontWeight: 600 }}>
                      {course.venueName}
                    </p>
                    <p className="small text-secondary mb-0">
                      {course.venueAddress?.address}
                    </p>
                    <p className="small text-secondary mb-0">
                      {course.venueAddress?.city},{" "}
                      {course.venueAddress?.country}
                    </p>
                  </div>
                </div>
              )}
              <div className="d-flex align-items-start gap-2">
                <span className="icon-schedule">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none">
                    <path
                      d="M11.3334 9.33332C11.7016 9.33332 12 9.03485 12 8.66666C12 8.29847 11.7016 7.99999 11.3334 7.99999C10.9652 7.99999 10.6667 8.29847 10.6667 8.66666C10.6667 9.03485 10.9652 9.33332 11.3334 9.33332Z"
                      fill="url(#paint0_linear_4557_4578)"
                    />
                    <path
                      d="M11.3334 12C11.7016 12 12 11.7015 12 11.3333C12 10.9651 11.7016 10.6667 11.3334 10.6667C10.9652 10.6667 10.6667 10.9651 10.6667 11.3333C10.6667 11.7015 10.9652 12 11.3334 12Z"
                      fill="url(#paint1_linear_4557_4578)"
                    />
                    <path
                      d="M8.66671 8.66666C8.66671 9.03485 8.36823 9.33332 8.00004 9.33332C7.63185 9.33332 7.33337 9.03485 7.33337 8.66666C7.33337 8.29847 7.63185 7.99999 8.00004 7.99999C8.36823 7.99999 8.66671 8.29847 8.66671 8.66666Z"
                      fill="url(#paint2_linear_4557_4578)"
                    />
                    <path
                      d="M8.66671 11.3333C8.66671 11.7015 8.36823 12 8.00004 12C7.63185 12 7.33337 11.7015 7.33337 11.3333C7.33337 10.9651 7.63185 10.6667 8.00004 10.6667C8.36823 10.6667 8.66671 10.9651 8.66671 11.3333Z"
                      fill="url(#paint3_linear_4557_4578)"
                    />
                    <path
                      d="M4.66671 9.33332C5.0349 9.33332 5.33337 9.03485 5.33337 8.66666C5.33337 8.29847 5.0349 7.99999 4.66671 7.99999C4.29852 7.99999 4.00004 8.29847 4.00004 8.66666C4.00004 9.03485 4.29852 9.33332 4.66671 9.33332Z"
                      fill="url(#paint4_linear_4557_4578)"
                    />
                    <path
                      d="M4.66671 12C5.0349 12 5.33337 11.7015 5.33337 11.3333C5.33337 10.9651 5.0349 10.6667 4.66671 10.6667C4.29852 10.6667 4.00004 10.9651 4.00004 11.3333C4.00004 11.7015 4.29852 12 4.66671 12Z"
                      fill="url(#paint5_linear_4557_4578)"
                    />
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M4.66671 1.16666C4.94285 1.16666 5.16671 1.39051 5.16671 1.66666V2.17514C5.60804 2.16665 6.09426 2.16665 6.62901 2.16666H9.37099C9.90575 2.16665 10.392 2.16665 10.8334 2.17514V1.66666C10.8334 1.39051 11.0572 1.16666 11.3334 1.16666C11.6095 1.16666 11.8334 1.39051 11.8334 1.66666V2.21805C12.0067 2.23126 12.1708 2.24787 12.3261 2.26875C13.1077 2.37383 13.7403 2.59524 14.2392 3.09415C14.7381 3.59306 14.9595 4.22569 15.0646 5.00731C15.1667 5.76678 15.1667 6.73719 15.1667 7.96235V9.37093C15.1667 10.5961 15.1667 11.5665 15.0646 12.326C14.9595 13.1076 14.7381 13.7403 14.2392 14.2392C13.7403 14.7381 13.1077 14.9595 12.3261 15.0646C11.5666 15.1667 10.5962 15.1667 9.37101 15.1667H6.6291C5.40394 15.1667 4.4335 15.1667 3.67403 15.0646C2.89241 14.9595 2.25978 14.7381 1.76087 14.2392C1.26196 13.7403 1.04055 13.1076 0.935464 12.326C0.833355 11.5665 0.833364 10.5961 0.833374 9.37093V7.96238C0.833364 6.73721 0.833355 5.76678 0.935464 5.00731C1.04055 4.22569 1.26196 3.59306 1.76087 3.09415C2.25978 2.59524 2.89241 2.37383 3.67403 2.26875C3.82931 2.24787 3.99341 2.23126 4.16671 2.21805V1.66666C4.16671 1.39051 4.39057 1.16666 4.66671 1.16666ZM3.80727 3.25983C3.13655 3.35001 2.75012 3.51912 2.46798 3.80126C2.18584 4.0834 2.01672 4.46983 1.92655 5.14056C1.91128 5.25415 1.89851 5.37373 1.88783 5.49999H14.1123C14.1016 5.37373 14.0888 5.25415 14.0735 5.14056C13.9834 4.46983 13.8142 4.0834 13.5321 3.80126C13.25 3.51912 12.8635 3.35001 12.1928 3.25983C11.5077 3.16772 10.6046 3.16666 9.33337 3.16666H6.66671C5.39549 3.16666 4.49238 3.16772 3.80727 3.25983ZM1.83337 7.99999C1.83337 7.43065 1.83359 6.93514 1.8421 6.49999H14.158C14.1665 6.93514 14.1667 7.43065 14.1667 7.99999V9.33332C14.1667 10.6045 14.1656 11.5076 14.0735 12.1928C13.9834 12.8635 13.8142 13.2499 13.5321 13.5321C13.25 13.8142 12.8635 13.9833 12.1928 14.0735C11.5077 14.1656 10.6046 14.1667 9.33337 14.1667H6.66671C5.39549 14.1667 4.49238 14.1656 3.80727 14.0735C3.13655 13.9833 2.75012 13.8142 2.46798 13.5321C2.18584 13.2499 2.01672 12.8635 1.92655 12.1928C1.83444 11.5076 1.83337 10.6045 1.83337 9.33332V7.99999Z"
                      fill="url(#paint6_linear_4557_4578)"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_4557_4578"
                        x1="4.4237"
                        y1="-0.59321"
                        x2="11.5116"
                        y2="18.9812"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                      <linearGradient
                        id="paint1_linear_4557_4578"
                        x1="4.4237"
                        y1="-0.59321"
                        x2="11.5116"
                        y2="18.9812"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                      <linearGradient
                        id="paint2_linear_4557_4578"
                        x1="4.4237"
                        y1="-0.59321"
                        x2="11.5116"
                        y2="18.9812"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                      <linearGradient
                        id="paint3_linear_4557_4578"
                        x1="4.4237"
                        y1="-0.59321"
                        x2="11.5116"
                        y2="18.9812"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                      <linearGradient
                        id="paint4_linear_4557_4578"
                        x1="4.4237"
                        y1="-0.59321"
                        x2="11.5116"
                        y2="18.9812"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                      <linearGradient
                        id="paint5_linear_4557_4578"
                        x1="4.4237"
                        y1="-0.59321"
                        x2="11.5116"
                        y2="18.9812"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                      <linearGradient
                        id="paint6_linear_4557_4578"
                        x1="4.4237"
                        y1="-0.59321"
                        x2="11.5116"
                        y2="18.9812"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <div>
                  <h6 className="mb-1 text-muted" style={{ fontSize: "12px" }}>
                    {t("startDate") || "Start Date"}
                  </h6>
                  <p className="text-white mb-0" style={{ fontSize: "14px" }}>
                    {course.startDate
                      ? new Date(course.startDate).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                      : "N/A"}
                  </p>
                </div>
              </div>
              {!isOngoing && (
                <div className="d-flex align-items-start gap-2">
                  <span className="icon-schedule">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none">
                      <path
                        d="M11.3334 9.33332C11.7016 9.33332 12 9.03485 12 8.66666C12 8.29847 11.7016 7.99999 11.3334 7.99999C10.9652 7.99999 10.6667 8.29847 10.6667 8.66666C10.6667 9.03485 10.9652 9.33332 11.3334 9.33332Z"
                        fill="url(#paint0_linear_4557_4578)"
                      />
                      <path
                        d="M11.3334 12C11.7016 12 12 11.7015 12 11.3333C12 10.9651 11.7016 10.6667 11.3334 10.6667C10.9652 10.6667 10.6667 10.9651 10.6667 11.3333C10.6667 11.7015 10.9652 12 11.3334 12Z"
                        fill="url(#paint1_linear_4557_4578)"
                      />
                      <path
                        d="M8.66671 8.66666C8.66671 9.03485 8.36823 9.33332 8.00004 9.33332C7.63185 9.33332 7.33337 9.03485 7.33337 8.66666C7.33337 8.29847 7.63185 7.99999 8.00004 7.99999C8.36823 7.99999 8.66671 8.29847 8.66671 8.66666Z"
                        fill="url(#paint2_linear_4557_4578)"
                      />
                      <path
                        d="M8.66671 11.3333C8.66671 11.7015 8.36823 12 8.00004 12C7.63185 12 7.33337 11.7015 7.33337 11.3333C7.33337 10.9651 7.63185 10.6667 8.00004 10.6667C8.36823 10.6667 8.66671 10.9651 8.66671 11.3333Z"
                        fill="url(#paint3_linear_4557_4578)"
                      />
                      <path
                        d="M4.66671 9.33332C5.0349 9.33332 5.33337 9.03485 5.33337 8.66666C5.33337 8.29847 5.0349 7.99999 4.66671 7.99999C4.29852 7.99999 4.00004 8.29847 4.00004 8.66666C4.00004 9.03485 4.29852 9.33332 4.66671 9.33332Z"
                        fill="url(#paint4_linear_4557_4578)"
                      />
                      <path
                        d="M4.66671 12C5.0349 12 5.33337 11.7015 5.33337 11.3333C5.33337 10.9651 5.0349 10.6667 4.66671 10.6667C4.29852 10.6667 4.00004 10.9651 4.00004 11.3333C4.00004 11.7015 4.29852 12 4.66671 12Z"
                        fill="url(#paint5_linear_4557_4578)"
                      />
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M4.66671 1.16666C4.94285 1.16666 5.16671 1.39051 5.16671 1.66666V2.17514C5.60804 2.16665 6.09426 2.16665 6.62901 2.16666H9.37099C9.90575 2.16665 10.392 2.16665 10.8334 2.17514V1.66666C10.8334 1.39051 11.0572 1.16666 11.3334 1.16666C11.6095 1.16666 11.8334 1.39051 11.8334 1.66666V2.21805C12.0067 2.23126 12.1708 2.24787 12.3261 2.26875C13.1077 2.37383 13.7403 2.59524 14.2392 3.09415C14.7381 3.59306 14.9595 4.22569 15.0646 5.00731C15.1667 5.76678 15.1667 6.73719 15.1667 7.96235V9.37093C15.1667 10.5961 15.1667 11.5665 15.0646 12.326C14.9595 13.1076 14.7381 13.7403 14.2392 14.2392C13.7403 14.7381 13.1077 14.9595 12.3261 15.0646C11.5666 15.1667 10.5962 15.1667 9.37101 15.1667H6.6291C5.40394 15.1667 4.4335 15.1667 3.67403 15.0646C2.89241 14.9595 2.25978 14.7381 1.76087 14.2392C1.26196 13.7403 1.04055 13.1076 0.935464 12.326C0.833355 11.5665 0.833364 10.5961 0.833374 9.37093V7.96238C0.833364 6.73721 0.833355 5.76678 0.935464 5.00731C1.04055 4.22569 1.26196 3.59306 1.76087 3.09415C2.25978 2.59524 2.89241 2.37383 3.67403 2.26875C3.82931 2.24787 3.99341 2.23126 4.16671 2.21805V1.66666C4.16671 1.39051 4.39057 1.16666 4.66671 1.16666ZM3.80727 3.25983C3.13655 3.35001 2.75012 3.51912 2.46798 3.80126C2.18584 4.0834 2.01672 4.46983 1.92655 5.14056C1.91128 5.25415 1.89851 5.37373 1.88783 5.49999H14.1123C14.1016 5.37373 14.0888 5.25415 14.0735 5.14056C13.9834 4.46983 13.8142 4.0834 13.5321 3.80126C13.25 3.51912 12.8635 3.35001 12.1928 3.25983C11.5077 3.16772 10.6046 3.16666 9.33337 3.16666H6.66671C5.39549 3.16666 4.49238 3.16772 3.80727 3.25983ZM1.83337 7.99999C1.83337 7.43065 1.83359 6.93514 1.8421 6.49999H14.158C14.1665 6.93514 14.1667 7.43065 14.1667 7.99999V9.33332C14.1667 10.6045 14.1656 11.5076 14.0735 12.1928C13.9834 12.8635 13.8142 13.2499 13.5321 13.5321C13.25 13.8142 12.8635 13.9833 12.1928 14.0735C11.5077 14.1656 10.6046 14.1667 9.33337 14.1667H6.66671C5.39549 14.1667 4.49238 14.1656 3.80727 14.0735C3.13655 13.9833 2.75012 13.8142 2.46798 13.5321C2.18584 13.2499 2.01672 12.8635 1.92655 12.1928C1.83444 11.5076 1.83337 10.6045 1.83337 9.33332V7.99999Z"
                        fill="url(#paint6_linear_4557_4578)"
                      />
                      <defs>
                        <linearGradient
                          id="paint0_linear_4557_4578"
                          x1="4.4237"
                          y1="-0.59321"
                          x2="11.5116"
                          y2="18.9812"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                        <linearGradient
                          id="paint1_linear_4557_4578"
                          x1="4.4237"
                          y1="-0.59321"
                          x2="11.5116"
                          y2="18.9812"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                        <linearGradient
                          id="paint2_linear_4557_4578"
                          x1="4.4237"
                          y1="-0.59321"
                          x2="11.5116"
                          y2="18.9812"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                        <linearGradient
                          id="paint3_linear_4557_4578"
                          x1="4.4237"
                          y1="-0.59321"
                          x2="11.5116"
                          y2="18.9812"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                        <linearGradient
                          id="paint4_linear_4557_4578"
                          x1="4.4237"
                          y1="-0.59321"
                          x2="11.5116"
                          y2="18.9812"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                        <linearGradient
                          id="paint5_linear_4557_4578"
                          x1="4.4237"
                          y1="-0.59321"
                          x2="11.5116"
                          y2="18.9812"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                        <linearGradient
                          id="paint6_linear_4557_4578"
                          x1="4.4237"
                          y1="-0.59321"
                          x2="11.5116"
                          y2="18.9812"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                  <div>
                    <h6 className="mb-1 text-muted" style={{ fontSize: "12px" }}>
                      {t("endDate") || "End Date"}
                    </h6>
                    <p className="text-white mb-0" style={{ fontSize: "14px" }}>
                      {course.endDate
                        ? new Date(course.endDate).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              )}


              {course.refundPolicy && (
                <>
                  <hr style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
                  <div>
                    <h6 className="small text-muted mb-1">{t("refundPolicyLabel") || "Refund Policy"}</h6>
                    <p className="text-white mb-0" style={{ fontSize: "14px" }}>
                      {course.refundPolicy === "No Refund" ? t("noRefund") : course.refundPolicy === "1 Day Before" ? t("oneDayBefore") : course.refundPolicy === "7 Days Before" ? t("sevenDaysBefore") : course.refundPolicy}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Batches */}
          {(course.enrollmentType || "Ongoing") !== "Ongoing" && (
            <div className="content-card mb-4 p-4">
              <h4 className="card-heading-line mb-3">
                <span> Class Batches</span>
              </h4>
              {course.batches && course.batches.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {course.batches.map((batch, idx) => {
                    const fillPercent =
                      batch.seats > 0
                        ? Math.round(
                          ((batch.seats - batch.availableSeats) /
                            batch.seats) *
                          100,
                        )
                        : 0;
                    return (
                      <div
                        className="ticket-tier-row p-3 rounded"
                        key={batch._id || idx}>
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div>
                            {/* <h6 className="text-white mb-0" style={{ fontSize: "14px", fontWeight: 700 }}>{batch.batchName}</h6> */}
                            <p className="small text-secondary mb-1">
                              {formatTime(batch.startTime, true, language)} –{" "}
                              {formatTime(batch.endTime, true, language)}
                            </p>
                            <p className="small text-muted mb-0">
                              {batch.days?.join(", ")}
                            </p>
                          </div>
                          <span
                            className="badge-status"
                            style={{
                              background:
                                batch.status === "Active"
                                  ? "rgba(40,167,69,0.15)"
                                  : "rgba(108,117,125,0.15)",
                              color:
                                batch.status === "Active" ? "#28a745" : "#999",
                              border: `1px solid ${batch.status === "Active" ? "rgba(40,167,69,0.3)" : "rgba(108,117,125,0.3)"}`,
                              fontSize: "10px",
                            }}>
                            {batch.status}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="d-flex justify-content-between small text-muted mb-1">
                            <span>
                              Enrolled: {batch.acquiredSeats || 0} /{" "}
                              {batch.seats}
                            </span>
                            <span>{fillPercent}%</span>
                          </div>
                          <div className="progress-bar-container light">
                            <div
                              className="progress-bar-filled"
                              style={{ width: `${fillPercent}%` }}></div>
                          </div>
                          <p
                            className="small mt-1 mb-0"
                            style={{
                              color: batch.isFull ? "#dc3545" : "#23ada4",
                            }}>
                            {batch.isFull
                              ? "🔴 Full"
                              : `🟢 ${batch.availableSeats} seats available`}
                          </p>
                          {batch.status !== "Cancelled" && (
                            <div className="d-flex justify-content-end gap-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSlot({
                                    batchId: batch._id,
                                    batchName: batch.batchName,
                                    seats: batch.seats,
                                    startTime: batch.startTime,
                                    endTime: batch.endTime,
                                    date: null,
                                  });
                                  setTempReservedExternally(
                                    batch.ReservedExternally || 0,
                                  );
                                  setShowReservationModal(true);
                                }}
                                className="btn btn-warning btn-sm border-0 text-dark"
                                style={{
                                  fontSize: "11px",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                }}>
                                Reserve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSlot({
                                    batchId: batch._id,
                                    batchName: batch.batchName,
                                    date: null,
                                  });
                                  setCancelMode("slot");
                                  setCancelModalOpen(true);
                                }}
                                className="btn btn-danger btn-sm border-0"
                                style={{
                                  fontSize: "11px",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                }}>
                                Cancel Batch
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-secondary small text-center py-3">
                  No batches defined for this course.
                </p>
              )}
            </div>
          )}

          {/* Assigned Staff */}
          {/* {course.assignedStaff && course.assignedStaff.length > 0 && (
            <div className="content-card p-4">
              <h4 className="card-heading-line mb-3">
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none">
                    <path
                      d="M20.7566 11.0859C21.4594 10.592 21.9248 9.77047 21.9248 8.84447C21.9248 7.32963 20.6996 6.10446 19.1848 6.10446C17.67 6.10446 16.4448 7.32963 16.4448 8.84447C16.4448 9.77047 16.9054 10.592 17.613 11.0859C17.0099 11.2948 16.459 11.6177 15.9937 12.0356C15.3526 11.4895 14.5975 11.0716 13.7713 10.8247C14.7732 10.2168 15.4476 9.1104 15.4476 7.85199C15.4476 5.93351 13.8947 4.38068 11.9763 4.38068C10.0578 4.38068 8.50495 5.93825 8.50495 7.85199C8.50495 9.1104 9.17451 10.2168 10.1812 10.8247C9.36446 11.0716 8.61892 11.4848 7.98259 12.0214C7.51721 11.613 6.97586 11.2948 6.38227 11.0906C7.08508 10.5967 7.55046 9.77522 7.55046 8.84922C7.55046 7.33438 6.32529 6.10921 4.81045 6.10921C3.29561 6.10921 2.07044 7.33438 2.07044 8.84922C2.07044 9.77522 2.53106 10.5967 3.23862 11.0906C1.35338 11.7412 0 13.5314 0 15.6351V15.9485C0 15.958 0.00949743 15.9675 0.0189949 15.9675H5.82667C5.79343 16.2287 5.77444 16.4994 5.77444 16.7701V17.093C5.77444 18.4891 6.90463 19.6193 8.30075 19.6193H15.6613C17.0574 19.6193 18.1876 18.4891 18.1876 17.093V16.7701C18.1876 16.4994 18.1686 16.2287 18.1353 15.9675H23.981C23.9905 15.9675 24 15.958 24 15.9485V15.6351C23.9905 13.5267 22.6419 11.7364 20.7566 11.0859ZM17.2046 8.83972C17.2046 7.74751 18.0926 6.8595 19.1848 6.8595C20.277 6.8595 21.165 7.74751 21.165 8.83972C21.165 9.91768 20.296 10.7962 19.2228 10.8199C19.2085 10.8199 19.1991 10.8199 19.1848 10.8199C19.1706 10.8199 19.1611 10.8199 19.1468 10.8199C18.0689 10.8009 17.2046 9.92243 17.2046 8.83972ZM9.25524 7.85199C9.25524 6.35614 10.4709 5.14047 11.9668 5.14047C13.4626 5.14047 14.6783 6.35614 14.6783 7.85199C14.6783 9.2956 13.5433 10.478 12.1235 10.5588C12.0712 10.5588 12.019 10.5588 11.9668 10.5588C11.9145 10.5588 11.8623 10.5588 11.8101 10.5588C10.3902 10.478 9.25524 9.2956 9.25524 7.85199ZM2.81599 8.83972C2.81599 7.74751 3.704 6.8595 4.7962 6.8595C5.88841 6.8595 6.77641 7.74751 6.77641 8.83972C6.77641 9.91768 5.9074 10.7962 4.83419 10.8199C4.81994 10.8199 4.81045 10.8199 4.7962 10.8199C4.78195 10.8199 4.77246 10.8199 4.75821 10.8199C3.685 10.8009 2.81599 9.92243 2.81599 8.83972ZM5.95964 15.203H0.769292C0.982984 13.18 2.69252 11.594 4.76771 11.5797C4.77721 11.5797 4.7867 11.5797 4.7962 11.5797C4.8057 11.5797 4.8152 11.5797 4.82469 11.5797C5.81243 11.5845 6.71468 11.9501 7.41274 12.5437C6.72893 13.2845 6.22082 14.1963 5.95964 15.203ZM17.4183 17.093C17.4183 18.0665 16.6252 18.8595 15.6518 18.8595H8.29125C7.31777 18.8595 6.52473 18.0665 6.52473 17.093V16.7701C6.52473 13.8211 8.88009 11.4088 11.8101 11.3233C11.8623 11.328 11.9193 11.328 11.9715 11.328C12.0237 11.328 12.0807 11.328 12.133 11.3233C15.0629 11.4088 17.4183 13.8211 17.4183 16.7701V17.093ZM17.9834 15.203C17.7222 14.201 17.2236 13.3035 16.5445 12.5627C17.2473 11.9549 18.1591 11.5892 19.1563 11.5797C19.1658 11.5797 19.1753 11.5797 19.1848 11.5797C19.1943 11.5797 19.2038 11.5797 19.2133 11.5797C21.2885 11.594 22.998 13.18 23.2117 15.203H17.9834Z"
                      fill="url(#paint0_linear_4557_4491)"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_4557_4491"
                        x1="6.0117"
                        y1="2.46511"
                        x2="11.3867"
                        y2="25.2998"
                        gradientUnits="userSpaceOnUse">
                        <stop stop-color="#23ADA4" />
                        <stop offset="1" stop-color="#23ADA4" />
                      </linearGradient>
                    </defs>
                  </svg>{" "}
                  Assigned Staff
                </span>
              </h4>
              <div className="d-flex flex-column gap-2">
                {course.assignedStaff.map((staff, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-center gap-3 p-2 rounded"
                    style={{
                      background: "#161616",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#23ada4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "#fff",
                        fontSize: "14px",
                        flexShrink: 0,
                      }}>
                      {staff.firstName?.[0] || "S"}
                    </div>
                    <div>
                      <p
                        className="mb-0 text-white"
                        style={{ fontSize: "14px", fontWeight: 600 }}>
                        {staff.firstName} {staff.lastName}
                      </p>
                      <p
                        className="mb-0 text-secondary"
                        style={{ fontSize: "12px" }}>
                        {staff.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </Col>
      </Row>

      {/* Attendees Drawer */}
      {drawerOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}
          onClick={() => setDrawerOpen(false)}>
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
          />

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
            }}>
            {/* Drawer Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #2d2d2d",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5
                    style={{
                      color: "#fff",
                      margin: 0,
                      fontWeight: 700,
                      fontSize: "16px",
                    }}>
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
                      style={{
                        cursor: "pointer",
                        fontSize: "11px",
                        padding: "4px 8px",
                      }}>
                      {t("cancelSlot") || "Cancel Slot"}
                    </button>
                  )}
                </div>
                <p
                  style={{
                    color: "#888",
                    margin: "4px 0 0",
                    fontSize: "13px",
                  }}>
                  {selectedSlot?.startTime
                    ? `🕒 ${formatTime(selectedSlot.startTime, true, language)} – ${formatTime(selectedSlot.endTime, true, language)} • `
                    : ""}
                  {attendeesTotal} {t("studentsCount") || "students"}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  color: "#ccc",
                  borderRadius: "8px",
                  width: 34,
                  height: 34,
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                ×
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {attendeesLoading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "200px",
                    gap: 12,
                  }}>
                  <Spinner animation="border" style={{ color: "#23ada4" }} />
                  <p style={{ color: "#888", margin: 0, fontSize: "13px" }}>
                    Loading attendees...
                  </p>
                </div>
              ) : slotAttendees.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: "60px" }}>
                  <p style={{ fontSize: "36px", margin: "0 0 12px" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none">
                      <path
                        d="M20.7566 11.0859C21.4594 10.592 21.9248 9.77047 21.9248 8.84447C21.9248 7.32963 20.6996 6.10446 19.1848 6.10446C17.67 6.10446 16.4448 7.32963 16.4448 8.84447C16.4448 9.77047 16.9054 10.592 17.613 11.0859C17.0099 11.2948 16.459 11.6177 15.9937 12.0356C15.3526 11.4895 14.5975 11.0716 13.7713 10.8247C14.7732 10.2168 15.4476 9.1104 15.4476 7.85199C15.4476 5.93351 13.8947 4.38068 11.9763 4.38068C10.0578 4.38068 8.50495 5.93825 8.50495 7.85199C8.50495 9.1104 9.17451 10.2168 10.1812 10.8247C9.36446 11.0716 8.61892 11.4848 7.98259 12.0214C7.51721 11.613 6.97586 11.2948 6.38227 11.0906C7.08508 10.5967 7.55046 9.77522 7.55046 8.84922C7.55046 7.33438 6.32529 6.10921 4.81045 6.10921C3.29561 6.10921 2.07044 7.33438 2.07044 8.84922C2.07044 9.77522 2.53106 10.5967 3.23862 11.0906C1.35338 11.7412 0 13.5314 0 15.6351V15.9485C0 15.958 0.00949743 15.9675 0.0189949 15.9675H5.82667C5.79343 16.2287 5.77444 16.4994 5.77444 16.7701V17.093C5.77444 18.4891 6.90463 19.6193 8.30075 19.6193H15.6613C17.0574 19.6193 18.1876 18.4891 18.1876 17.093V16.7701C18.1876 16.4994 18.1686 16.2287 18.1353 15.9675H23.981C23.9905 15.9675 24 15.958 24 15.9485V15.6351C23.9905 13.5267 22.6419 11.7364 20.7566 11.0859ZM17.2046 8.83972C17.2046 7.74751 18.0926 6.8595 19.1848 6.8595C20.277 6.8595 21.165 7.74751 21.165 8.83972C21.165 9.91768 20.296 10.7962 19.2228 10.8199C19.2085 10.8199 19.1991 10.8199 19.1848 10.8199C19.1706 10.8199 19.1611 10.8199 19.1468 10.8199C18.0689 10.8009 17.2046 9.92243 17.2046 8.83972ZM9.25524 7.85199C9.25524 6.35614 10.4709 5.14047 11.9668 5.14047C13.4626 5.14047 14.6783 6.35614 14.6783 7.85199C14.6783 9.2956 13.5433 10.478 12.1235 10.5588C12.0712 10.5588 12.019 10.5588 11.9668 10.5588C11.9145 10.5588 11.8623 10.5588 11.8101 10.5588C10.3902 10.478 9.25524 9.2956 9.25524 7.85199ZM2.81599 8.83972C2.81599 7.74751 3.704 6.8595 4.7962 6.8595C5.88841 6.8595 6.77641 7.74751 6.77641 8.83972C6.77641 9.91768 5.9074 10.7962 4.83419 10.8199C4.81994 10.8199 4.81045 10.8199 4.7962 10.8199C4.78195 10.8199 4.77246 10.8199 4.75821 10.8199C3.685 10.8009 2.81599 9.92243 2.81599 8.83972ZM5.95964 15.203H0.769292C0.982984 13.18 2.69252 11.594 4.76771 11.5797C4.77721 11.5797 4.7867 11.5797 4.7962 11.5797C4.8057 11.5797 4.8152 11.5797 4.82469 11.5797C5.81243 11.5845 6.71468 11.9501 7.41274 12.5437C6.72893 13.2845 6.22082 14.1963 5.95964 15.203ZM17.4183 17.093C17.4183 18.0665 16.6252 18.8595 15.6518 18.8595H8.29125C7.31777 18.8595 6.52473 18.0665 6.52473 17.093V16.7701C6.52473 13.8211 8.88009 11.4088 11.8101 11.3233C11.8623 11.328 11.9193 11.328 11.9715 11.328C12.0237 11.328 12.0807 11.328 12.133 11.3233C15.0629 11.4088 17.4183 13.8211 17.4183 16.7701V17.093ZM17.9834 15.203C17.7222 14.201 17.2236 13.3035 16.5445 12.5627C17.2473 11.9549 18.1591 11.5892 19.1563 11.5797C19.1658 11.5797 19.1753 11.5797 19.1848 11.5797C19.1943 11.5797 19.2038 11.5797 19.2133 11.5797C21.2885 11.594 22.998 13.18 23.2117 15.203H17.9834Z"
                        fill="url(#paint0_linear_4557_4491)"
                      />
                      <defs>
                        <linearGradient
                          id="paint0_linear_4557_4491"
                          x1="6.0117"
                          y1="2.46511"
                          x2="11.3867"
                          y2="25.2998"
                          gradientUnits="userSpaceOnUse">
                          <stop stop-color="#23ADA4" />
                          <stop offset="1" stop-color="#23ADA4" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </p>
                  <p style={{ color: "#555", fontSize: "14px" }}>
                    {t("noStudentsEnrolled") || "No students enrolled yet."}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}>
                  {slotAttendees.map((attendee, idx) => {
                    const user = attendee.user;
                    const initials =
                      `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() ||
                      "?";
                    const isAllMode = !selectedSlot?.batchId;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "#1e1e1e",
                          border: "1px solid #2d2d2d",
                          borderRadius: "12px",
                          padding: "14px 16px",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}>
                          {/* Avatar */}
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: "50%",
                              background: user?.profileImage
                                ? "transparent"
                                : "#23ada4",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              overflow: "hidden",
                              fontWeight: 700,
                              color: "#fff",
                              fontSize: "15px",
                            }}>
                            {user?.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.firstName}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              initials
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: "14px",
                              }}>
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "#888",
                                fontSize: "12px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}>
                              {user?.email}
                            </p>
                            {user?.contactNumber && (
                              <p
                                style={{
                                  margin: 0,
                                  color: "#666",
                                  fontSize: "11px",
                                }}>
                                {user?.countryCode} {user?.contactNumber}
                              </p>
                            )}
                          </div>

                          {/* Right — check-in status */}
                          <div style={{ flexShrink: 0, textAlign: "right" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: attendee.isFullyCheckedIn
                                  ? "rgba(40,167,69,0.15)"
                                  : attendee.checkedInQty > 0
                                    ? "rgba(255,193,7,0.15)"
                                    : "rgba(108,117,125,0.1)",
                                color: attendee.isFullyCheckedIn
                                  ? "#28a745"
                                  : attendee.checkedInQty > 0
                                    ? "#ffc107"
                                    : "#888",
                                border: `1px solid ${attendee.isFullyCheckedIn ? "rgba(40,167,69,0.3)" : attendee.checkedInQty > 0 ? "rgba(255,193,7,0.3)" : "rgba(108,117,125,0.2)"}`,
                              }}>
                              {attendee.isFullyCheckedIn
                                ? `✓ ${t("checkedIn") || "Checked In"}`
                                : attendee.checkedInQty > 0
                                  ? `${attendee.checkedInQty}/${attendee.qty} In`
                                  : t("notCheckedIn") || "Not Checked In"}
                            </span>
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontSize: "11px",
                                color: "#555",
                              }}>
                              #{attendee.bookingId?.slice(-6)}
                            </p>
                          </div>
                        </div>

                        {/* Enrolled Batches (shown only in All Enrollments mode) */}
                        {isAllMode &&
                          attendee.enrolledBatches &&
                          attendee.enrolledBatches.length > 0 && (
                            <div
                              style={{
                                marginTop: "10px",
                                paddingTop: "10px",
                                borderTop: "1px solid rgba(255,255,255,0.05)",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                              }}>
                              {attendee.enrolledBatches.map((b, bi) => (
                                <span
                                  key={bi}
                                  style={{
                                    background: "rgba(35,173,164,0.1)",
                                    border: "1px solid rgba(35,173,164,0.25)",
                                    color: "#23ada4",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    padding: "3px 10px",
                                    borderRadius: "20px",
                                  }}>
                                  {b.batchName} ·{" "}
                                  {formatTime(b.startTime, true, language)}–
                                  {formatTime(b.endTime, true, language)}
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
            <div
              style={{ padding: "16px 24px", borderTop: "1px solid #2d2d2d" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#555",
                  textAlign: "center",
                }}>
                Showing {slotAttendees.length} of {attendeesTotal} enrolled
                students
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setCancelModalOpen(false)}></div>
          <div
            style={{
              position: "relative",
              background: "#1e1e1e",
              border: "1px solid #2d2d2d",
              borderRadius: "16px",
              padding: "24px",
              width: "90%",
              maxWidth: "400px",
            }}>
            <h5
              style={{ color: "#fff", fontWeight: 700, marginBottom: "16px" }}>
              {cancelMode === "slot" ? t("cancelSlot") || "Cancel Slot" : t("cancelCourse") || "Cancel Course"}
            </h5>
            <p
              style={{ color: "#ccc", fontSize: "14px", marginBottom: "20px" }}>
              {cancelMode === "slot"
                ? (t("cancelSlotConfirm") || "Are you sure you want to cancel {date}?").replace("{date}", selectedSlot?.date ? selectedSlot.date.split("T")[0] : "")
                : t("cancelCourseConfirm") || "Are you sure you want to cancel this entire course? This will cancel all pending bookings and notify enrolled students."}
            </p>
            <div className="form-group mb-4">
              <label
                style={{
                  color: "#888",
                  fontSize: "13px",
                  marginBottom: "8px",
                  display: "block",
                }}>
                {t("reasonCancellation") || "Reason for Cancellation"} <span className="text-danger">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="form-control"
                style={{
                  background: "#111",
                  border: "1px solid #333",
                  color: "#fff",
                  borderRadius: "8px",
                  minHeight: "80px",
                  padding: "10px",
                }}
                placeholder={t("enterReasonPlaceholder") || "Enter reason *"}></textarea>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="btn"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                }}
                disabled={isCancelling}>
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleCancelCourse}
                className="btn"
                style={{
                  background: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                }}
                disabled={isCancelling || !cancelReason.trim()}>
                {isCancelling ? <Spinner size="sm" /> : t("confirmCancel") || "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && selectedSlot && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowReservationModal(false)}></div>
          <div
            style={{
              position: "relative",
              background: "#1e1e1e",
              border: "1px solid #2d2d2d",
              borderRadius: "16px",
              padding: "24px",
              width: "90%",
              maxWidth: "400px",
            }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}>
              <h5 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>
                {t("adjustReservedSeats") || "Adjust Reserved Seats"}
              </h5>
              <button
                onClick={() => setShowReservationModal(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  color: "#ccc",
                  borderRadius: "8px",
                  width: 30,
                  height: 30,
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                ×
              </button>
            </div>

            <div className="custom-modal-body">
              <div
                style={{
                  background: "#151515",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  marginBottom: "20px",
                }}>
                {selectedSlot.date && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "13px",
                      color: "#888",
                      marginBottom: "6px",
                    }}>
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none">
                        <path
                          d="M11.3334 9.33332C11.7016 9.33332 12 9.03485 12 8.66666C12 8.29847 11.7016 7.99999 11.3334 7.99999C10.9652 7.99999 10.6667 8.29847 10.6667 8.66666C10.6667 9.03485 10.9652 9.33332 11.3334 9.33332Z"
                          fill="url(#paint0_linear_4557_4578)"
                        />
                        <path
                          d="M11.3334 12C11.7016 12 12 11.7015 12 11.3333C12 10.9651 11.7016 10.6667 11.3334 10.6667C10.9652 10.6667 10.6667 10.9651 10.6667 11.3333C10.6667 11.7015 10.9652 12 11.3334 12Z"
                          fill="url(#paint1_linear_4557_4578)"
                        />
                        <path
                          d="M8.66671 8.66666C8.66671 9.03485 8.36823 9.33332 8.00004 9.33332C7.63185 9.33332 7.33337 9.03485 7.33337 8.66666C7.33337 8.29847 7.63185 7.99999 8.00004 7.99999C8.36823 7.99999 8.66671 8.29847 8.66671 8.66666Z"
                          fill="url(#paint2_linear_4557_4578)"
                        />
                        <path
                          d="M8.66671 11.3333C8.66671 11.7015 8.36823 12 8.00004 12C7.63185 12 7.33337 11.7015 7.33337 11.3333C7.33337 10.9651 7.63185 10.6667 8.00004 10.6667C8.36823 10.6667 8.66671 10.9651 8.66671 11.3333Z"
                          fill="url(#paint3_linear_4557_4578)"
                        />
                        <path
                          d="M4.66671 9.33332C5.0349 9.33332 5.33337 9.03485 5.33337 8.66666C5.33337 8.29847 5.0349 7.99999 4.66671 7.99999C4.29852 7.99999 4.00004 8.29847 4.00004 8.66666C4.00004 9.03485 4.29852 9.33332 4.66671 9.33332Z"
                          fill="url(#paint4_linear_4557_4578)"
                        />
                        <path
                          d="M4.66671 12C5.0349 12 5.33337 11.7015 5.33337 11.3333C5.33337 10.9651 5.0349 10.6667 4.66671 10.6667C4.29852 10.6667 4.00004 10.9651 4.00004 11.3333C4.00004 11.7015 4.29852 12 4.66671 12Z"
                          fill="url(#paint5_linear_4557_4578)"
                        />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M4.66671 1.16666C4.94285 1.16666 5.16671 1.39051 5.16671 1.66666V2.17514C5.60804 2.16665 6.09426 2.16665 6.62901 2.16666H9.37099C9.90575 2.16665 10.392 2.16665 10.8334 2.17514V1.66666C10.8334 1.39051 11.0572 1.16666 11.3334 1.16666C11.6095 1.16666 11.8334 1.39051 11.8334 1.66666V2.21805C12.0067 2.23126 12.1708 2.24787 12.326 2.26875C13.1077 2.37383 13.7403 2.59524 14.2392 3.09415C14.7381 3.59306 14.9595 4.22569 15.0646 5.00731C15.1667 5.76678 15.1667 6.73719 15.1667 7.96235V9.37093C15.1667 10.5961 15.1667 11.5665 15.0646 12.326C14.9595 13.1076 14.7381 13.7403 14.2392 14.2392C13.7403 14.7381 13.1077 14.9595 12.3261 15.0646C11.5666 15.1667 10.5962 15.1667 9.37101 15.1667H6.6291C5.40394 15.1667 4.4335 15.1667 3.67403 15.0646C2.89241 14.9595 2.25978 14.7381 1.76087 14.2392C1.26196 13.7403 1.04055 13.1076 0.935464 12.326C0.833355 11.5665 0.833364 10.5961 0.833374 9.37093V7.96238C0.833364 6.73721 0.833355 5.76678 0.935464 5.00731C1.04055 4.22569 1.26196 3.59306 1.76087 3.09415C2.25978 2.59524 2.89241 2.37383 3.67403 2.26875C3.82931 2.24787 3.99341 2.23126 4.16671 2.21805V1.66666C4.16671 1.39051 4.39057 1.16666 4.66671 1.16666ZM3.80727 3.25983C3.13655 3.35001 2.75012 3.51912 2.46798 3.80126C2.18584 4.0834 2.01672 4.46983 1.92655 5.14056C1.91128 5.25415 1.89851 5.37373 1.88783 5.49999H14.1123C14.1016 5.37373 14.0888 5.25415 14.0735 5.14056C13.9834 4.46983 13.8142 4.0834 13.5321 3.80126C13.25 3.51912 12.8635 3.35001 12.1928 3.25983C11.5077 3.16772 10.6046 3.16666 9.33337 3.16666H6.66671C5.39549 3.16666 4.49238 3.16772 3.80727 3.25983ZM1.83337 7.99999C1.83337 7.43065 1.83359 6.93514 1.8421 6.49999H14.158C14.1665 6.93514 14.1667 7.43065 14.1667 7.99999V9.33332C14.1667 10.6045 14.1656 11.5076 14.0735 12.1928C13.9834 12.8635 13.8142 13.2499 13.5321 13.5321C13.25 13.8142 12.8635 13.9833 12.1928 14.0735C11.5077 14.1656 10.6046 14.1667 9.33337 14.1667H6.66671C5.39549 14.1667 4.49238 14.1656 3.80727 14.0735C3.13655 13.9833 2.75012 13.8142 2.46798 13.5321C2.18584 13.2499 2.01672 12.8635 1.92655 12.1928C1.83444 11.5076 1.83337 10.6045 1.83337 9.33332V7.99999Z"
                          fill="url(#paint6_linear_4557_4578)"
                        />
                        <defs>
                          <linearGradient
                            id="paint0_linear_4557_4578"
                            x1="4.4237"
                            y1="-0.59321"
                            x2="11.5116"
                            y2="18.9812"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#23ADA4" />
                            <stop offset="1" stop-color="#23ADA4" />
                          </linearGradient>
                          <linearGradient
                            id="paint1_linear_4557_4578"
                            x1="4.4237"
                            y1="-0.59321"
                            x2="11.5116"
                            y2="18.9812"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#23ADA4" />
                            <stop offset="1" stop-color="#23ADA4" />
                          </linearGradient>
                          <linearGradient
                            id="paint2_linear_4557_4578"
                            x1="4.4237"
                            y1="-0.59321"
                            x2="11.5116"
                            y2="18.9812"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#23ADA4" />
                            <stop offset="1" stop-color="#23ADA4" />
                          </linearGradient>
                          <linearGradient
                            id="paint3_linear_4557_4578"
                            x1="4.4237"
                            y1="-0.59321"
                            x2="11.5116"
                            y2="18.9812"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#23ADA4" />
                            <stop offset="1" stop-color="#23ADA4" />
                          </linearGradient>
                          <linearGradient
                            id="paint4_linear_4557_4578"
                            x1="4.4237"
                            y1="-0.59321"
                            x2="11.5116"
                            y2="18.9812"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#23ADA4" />
                            <stop offset="1" stop-color="#23ADA4" />
                          </linearGradient>
                          <linearGradient
                            id="paint5_linear_4557_4578"
                            x1="4.4237"
                            y1="-0.59321"
                            x2="11.5116"
                            y2="18.9812"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#23ADA4" />
                            <stop offset="1" stop-color="#23ADA4" />
                          </linearGradient>
                          <linearGradient
                            id="paint6_linear_4557_4578"
                            x1="4.4237"
                            y1="-0.59321"
                            x2="11.5116"
                            y2="18.9812"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#23ADA4" />
                            <stop offset="1" stop-color="#23ADA4" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </span>
                    <span style={{ color: "#fff" }}>{selectedSlot.date}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "6px",
                  }}>
                  <span>🕒</span>
                  <span style={{ color: "#fff" }}>
                    {formatTime(selectedSlot.startTime, true, language)} -{" "}
                    {formatTime(selectedSlot.endTime, true, language)}
                  </span>
                </div>
                <div
                  style={{
                    color: "#23ada4",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginTop: "8px",
                  }}>
                  {selectedSlot.batchName || course.courseTitle}
                </div>
              </div>

              <div className="text-center mb-4">
                <p
                  style={{
                    color: "#888",
                    fontSize: "13px",
                    margin: "0 0 12px",
                  }}>
                  {t("addNumberReservedOutside") || "Add the number of seats reserved outside of Bondy"}
                </p>
                <div className="d-flex align-items-center justify-content-center gap-3">
                  <button
                    className="btn"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      fontSize: "18px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() =>
                      setTempReservedExternally((prev) => Math.max(0, prev - 1))
                    }
                    disabled={tempReservedExternally <= 0}>
                    —
                  </button>
                  <span
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "#f1c40f",
                      minWidth: "60px",
                    }}>
                    {tempReservedExternally}
                  </span>
                  <button
                    className="btn"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      fontSize: "18px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => {
                      const maxAllowed = selectedSlot.seats;
                      setTempReservedExternally((prev) =>
                        Math.min(maxAllowed, prev + 1),
                      );
                    }}
                    disabled={tempReservedExternally >= selectedSlot.seats}>
                    +
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: "#151515",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                <h6
                  style={{
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "12px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}>
                  {t("updatedCapacityOverview") || "Updated capacity overview"}
                </h6>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}>
                  <span style={{ color: "#888" }}>{t("reservedExternally") || "Reserved externally"}</span>
                  <span style={{ color: "#f1c40f", fontWeight: 600 }}>
                    {tempReservedExternally}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}>
                  <span style={{ color: "#888" }}>{t("capacity") || "Capacity"}</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>
                    {selectedSlot.seats}
                  </span>
                </div>
              </div>

              <p
                style={{
                  color: "#888",
                  fontSize: "11px",
                  fontStyle: "italic",
                  textAlign: "center",
                  marginTop: "16px",
                  marginBottom: "0",
                }}>
                {t("changeAppliesSpecificSlot") || "* This change applies only to this specific slot date."}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "end",
                gap: "10px",
                marginTop: "24px",
              }}>
              <button
                onClick={() => setShowReservationModal(false)}
                className="btn"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                }}
                disabled={isSavingReservation}>
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleSaveReservation}
                className="btn"
                style={{
                  background: "#23ada4",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
                disabled={isSavingReservation}>
                {isSavingReservation ? <Spinner size="sm" /> : t("saveChanges") || "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .course-control-center {
          color: #fff;
          font-family: "Inter", sans-serif;
        }
        .back-btn-dashboard {
          color: #888;
          text-decoration: none;
          font-size: 14px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .back-btn-dashboard:hover {
          color: #23ada4;
        }
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
        .hero-content-overlay {
          position: relative;
          z-index: 2;
        }
        .hero-poster {
          width: 130px;
          height: 130px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .hero-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .hero-text-details {
          flex: 1;
        }
        .hero-title {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .hero-category {
          font-size: 13px;
        }
        .hero-meta {
          font-size: 12px;
        }
        .badge-status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .badge-status.draft {
          background: rgba(255, 193, 7, 0.15);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.3);
        }
        .badge-status.upcoming {
          background: rgba(0, 123, 255, 0.15);
          color: #007bff;
          border: 1px solid rgba(0, 123, 255, 0.3);
        }
        .badge-status.live {
          background: rgba(40, 167, 69, 0.15);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.3);
        }
        .badge-status.past {
          background: rgba(108, 117, 125, 0.15);
          color: #999;
          border: 1px solid rgba(108, 117, 125, 0.3);
        }
        .badge-status.featured {
          background: linear-gradient(135deg, #f6d365, #fda085);
          color: #000;
        }
        .kpi-card {
          background: #1e1e1e;
          border: 1px solid #2d2d2d;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          height: 100%;
        }
        .kpi-icon {
          font-size: 26px;
          background: rgba(35, 173, 164, 0.1);
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-content {
          flex: 1;
        }
        .kpi-content h5 {
          color: #888;
          font-size: 11px;
          text-transform: uppercase;
          margin-bottom: 4px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .kpi-content h3 {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .kpi-content .total-cap {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }
        .progress-bar-container {
          background: #111;
          height: 6px;
          border-radius: 10px;
          overflow: hidden;
          width: 100%;
        }
        .progress-bar-container.light {
          background: rgba(255, 255, 255, 0.05);
        }
        .progress-bar-filled {
          background: #23ada4;
          height: 100%;
          border-radius: 10px;
          transition: width 0.4s ease;
        }
        .content-card {
          background: #1e1e1e;
          border: 1px solid #2d2d2d;
          border-radius: 14px;
        }
        .card-heading-line {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          border-bottom: 1px solid #2d2d2d;
          padding-bottom: 12px;
          color: #23ada4;
          margin-bottom: 0;
        }
        .card-heading-line span {
          position: relative;
        }
        .icon-schedule {
          font-size: 18px;
          background: rgba(255, 255, 255, 0.05);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .details-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
        }
        .details-gallery-item {
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #333;
        }
        .details-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }
        .details-gallery-item img:hover {
          transform: scale(1.08);
        }
        .ticket-tier-row {
          background: #161616;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 10px;
        }
        .pass-card {
          background: #161616;
          border: 1px solid rgba(35, 173, 164, 0.2);
          border-radius: 12px;
          padding: 18px;
        }
        .pass-icon {
          font-size: 24px;
          background: rgba(35, 173, 164, 0.1);
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pass-label {
          color: #888;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
          font-weight: 600;
        }
        .pass-price {
          color: #23ada4;
          font-size: 20px;
          font-weight: 700;
          margin: 2px 0;
        }
        .pass-sub {
          color: #555;
          font-size: 12px;
          margin: 0;
        }
        .schedule-day-block {
          background: #161616;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 12px 16px;
        }
        .schedule-day-header {
          cursor: pointer;
          padding: 0;
        }
        .schedule-day-header:hover .day-badge {
          background: #23ada4;
          color: #000;
        }
        .day-badge {
          background: rgba(35, 173, 164, 0.15);
          color: #23ada4;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          transition: all 0.2s;
          border: 1px solid rgba(35, 173, 164, 0.3);
          width: 50px;
          display: inline-block;
          text-align: center;
        }
        .day-date {
          font-size: 13px;
          color: #ccc;
          width: 80px;
          display: inline-block;
        }
        .slot-row {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .slot-clickable {
          cursor: pointer;
          transition:
            background 0.18s,
            border-color 0.18s;
        }
        .slot-clickable:hover {
          background: #222 !important;
          border-color: rgba(35, 173, 164, 0.3) !important;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function page() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: "#23ada4" }} />
        </div>
      }>
      <CourseDetailsContent />
    </Suspense>
  );
}

export default page;
