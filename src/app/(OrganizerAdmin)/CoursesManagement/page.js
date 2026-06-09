"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Col, Row, Form, Pagination, Modal, Spinner } from "react-bootstrap";
import courseApi from "@/api/courseApi";
import authApi from "@/api/authApi";
import categoryApi from "@/api/categoryApi";
import promotionsApi from "@/api/promotionsApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

function CoursesManagement() {
  const { t, language } = useLanguage();
  const locale = language === "mn" ? "mn-MN" : "en-US";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    isDraft: "", // "" (All), "false" (Published), "true" (Drafts)
    enrollmentType: "", // "" (All), "Ongoing", "fixedStart"
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Promotion modal state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [promoPackages, setPromoPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories({ type: "course", limit: 1000 });
      if (response?.data) {
        setCategories(response?.data?.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        categoryId: filters.categoryId,
        isDraft: filters.isDraft,
        enrollmentType: filters.enrollmentType,
      };

      const response = await courseApi.getOrganizerCourses(params);
      if (response?.data) {
        setCourses(response?.data?.courses);
        setPagination((prev) => ({
          ...prev,
          total: response?.data?.totalCourses,
          page: response?.data?.currentPage,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    document.title = "Courses Management - Bondy";
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [pagination.page, filters.categoryId, filters.isDraft, filters.enrollmentType]);

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCourses();
  };

  const handleCategoryChange = (e) => {
    setFilters((prev) => ({ ...prev, categoryId: e.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const getCourseDurationText = (course) => {
    const baseDuration =
      language === "mn"
        ? course?.durationTranslation || course?.duration
        : course?.duration;

    if (!baseDuration) return "N/A";

    const cleaned = String(baseDuration)
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[,:;]+$/, "");

    if (language !== "mn") return cleaned;

    return cleaned
      .replace(/(\d+)\s*(?:h|hr|hrs|hour|hours)\b/gi, "$1 Цаг")
      .replace(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/gi, "$1 мин")
      .replace(/\bH\b/g, "Цаг")
      .replace(/\bm\b/g, "мин")
      .replace(/\s+/g, " ")
      .trim();
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Calculate total revenue and enrollments
  const stats = courses.reduce(
    (acc, course) => ({
      totalRevenue: acc.totalRevenue + (course.totalRevenue || 0),
      totalEnrollments: acc.totalEnrollments + (course.totalEnrollments || 0),
    }),
    { totalRevenue: 0, totalEnrollments: 0 },
  );

  // ---- Promotion Helpers ----
  const isFeaturedActive = (course) =>
    course.isFeatured &&
    course.featuredExpiry &&
    new Date(course.featuredExpiry) > new Date();

  const openPromoModal = async (course) => {
    setSelectedCourse(course);
    setSelectedPackage(null);
    setShowPromoModal(true);
    setLoadingPackages(true);
    try {
      const res = await promotionsApi.getCoursePackages();
      console.log("resresresresres>>>", res);
      if (res?.status) {
        setPromoPackages(res?.data || []);
      }
    } catch (err) {
      toast.error(
        t("failedToLoadPromotionPackages") ||
        "Failed to load promotion packages",
      );
    } finally {
      setLoadingPackages(false);
    }
  };

  const closePromoModal = () => {
    setShowPromoModal(false);
    setSelectedCourse(null);
    setSelectedPackage(null);
    setPromoPackages([]);
  };

  const handleCheckout = async () => {
    if (!selectedPackage) {
      toast.error(
        t("selectPackageFirst") || "Please select a promotion package first.",
      );
      return;
    }
    setCheckingOut(true);
    try {
      const res = await promotionsApi.checkoutCoursePromotion({
        courseId: selectedCourse._id,
        packageId: selectedPackage._id,
      });
      if (res?.status) {
        toast.success(
          t("promotionActivated") || "Promotion activated successfully! 🎉",
        );
        closePromoModal();
        fetchCourses();
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        t("checkoutFailed") ||
        "Checkout failed. Please try again.",
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
            <h2 className="card-title">{t("coursesManagement")}</h2>
            <p className="card-desc">{t("manageCoursesDesc")}</p>
          </div>

          <Link href="/AddProgram" className="custom-btn">
            {t("createNewCourse")}
          </Link>
        </div>

        <Row>
          <Col md={4}>
            <div className="event-cards">
              <h5>{t("totalRevenue")}</h5>
              <h3>₮{stats.totalRevenue?.toLocaleString() || 0}</h3>
              <p>{t("fromAllCourses")}</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="event-cards">
              <h5>{t("totalEnrollments")}</h5>
              <h3>{stats.totalEnrollments?.toLocaleString() || 0}</h3>
              <p>{t("activeStudents")}</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="event-cards">
              <h5>{t("totalCourses")}</h5>
              <h3>{pagination.total || 0}</h3>
              <p>{t("publishedCourses")}</p>
            </div>
          </Col>
        </Row>

        {/* Filters Row */}
        <div className="mb-4 mt-3 p-3 rounded" style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)" }}>
          <Form onSubmit={handleSearchSubmit}>
            <Row className="align-items-center g-3">
              {/* Search */}
              <Col lg={4} md={6} xs={12}>
                <Form.Group className="mb-0">
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t("searchCourses") || "Search program name..."}
                      value={filters.search}
                      onChange={handleSearchChange}
                      style={{
                        backgroundColor: "#111",
                        border: "1px solid rgba(35, 173, 164, 0.3)",
                        color: "white",
                        height: "45px",
                        paddingRight: "45px"
                      }}
                    />
                    <button
                      type="submit"
                      className="btn position-absolute end-0 top-0 h-100 border-0 bg-transparent"
                      style={{ color: "#23ada4" }}
                    >
                      🔍
                    </button>
                  </div>
                </Form.Group>
              </Col>

              {/* Category */}
              <Col lg={3} md={6} xs={12}>
                <Form.Select
                  value={filters.categoryId}
                  onChange={handleCategoryChange}
                  style={{
                    backgroundColor: "#111",
                    border: "1px solid rgba(35, 173, 164, 0.3)",
                    color: "white",
                    height: "45px"
                  }}
                >
                  <option value="">{t("allCategories") || "All Categories"}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* Draft status toggles */}
              <Col lg={3} md={6} xs={12}>
                <div className="d-flex rounded" style={{ border: "1px solid rgba(35, 173, 164, 0.3)", overflow: "hidden", height: "45px" }}>
                  <button
                    type="button"
                    className="flex-grow-1 border-0"
                    style={{
                      backgroundColor: filters.isDraft === "" ? "#23ada4" : "#111",
                      color: filters.isDraft === "" ? "black" : "white",
                      fontSize: "13px",
                      fontWeight: filters.isDraft === "" ? "bold" : "normal",
                      transition: "all 0.2s"
                    }}
                    onClick={() => setFilters(prev => ({ ...prev, isDraft: "" }))}
                  >
                    All Status
                  </button>
                  <button
                    type="button"
                    className="flex-grow-1 border-0"
                    style={{
                      backgroundColor: filters.isDraft === "false" ? "#23ada4" : "#111",
                      color: filters.isDraft === "false" ? "black" : "white",
                      fontSize: "13px",
                      fontWeight: filters.isDraft === "false" ? "bold" : "normal",
                      borderLeft: "1px solid rgba(35, 173, 164, 0.2)",
                      transition: "all 0.2s"
                    }}
                    onClick={() => setFilters(prev => ({ ...prev, isDraft: "false" }))}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    className="flex-grow-1 border-0"
                    style={{
                      backgroundColor: filters.isDraft === "true" ? "#23ada4" : "#111",
                      color: filters.isDraft === "true" ? "black" : "white",
                      fontSize: "13px",
                      fontWeight: filters.isDraft === "true" ? "bold" : "normal",
                      borderLeft: "1px solid rgba(35, 173, 164, 0.2)",
                      transition: "all 0.2s"
                    }}
                    onClick={() => setFilters(prev => ({ ...prev, isDraft: "true" }))}
                  >
                    Drafts
                  </button>
                </div>
              </Col>

              {/* Enrollment type toggles */}
              <Col lg={2} md={6} xs={12}>
                <Form.Select
                  value={filters.enrollmentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, enrollmentType: e.target.value }))}
                  style={{
                    backgroundColor: "#111",
                    border: "1px solid rgba(35, 173, 164, 0.3)",
                    color: "white",
                    height: "45px"
                  }}
                >
                  <option value="">All Types</option>
                  <option value="Ongoing">Ongoing Classes</option>
                  <option value="fixedStart">Fixed Start</option>
                </Form.Select>
              </Col>
            </Row>
          </Form>
        </div>

        {/* Course Listing */}
        <div className="ticket-tabs">
          <div className="ticket-listing">
            {loading ? (
              <p className="text-center py-5">{t("loadingCourses")}</p>
            ) : courses.length === 0 ? (
              <p className="text-center py-5">{t("noCoursesFound")}</p>
            ) : (
              courses.map((course) => {
                const isPast = course.status?.toLowerCase() === "past";
                return (
                  <div className="ticket-cards" key={course._id}>
                    <div className="ticket-inner">
                      <div className="ticket-lft">
                        <div className="event-info-box-img">
                          <img
                            src={
                              course.posterImage?.[0] ||
                              "/img/details_img02.png"
                            }
                            alt={course.courseTitle}
                            style={{
                              width: "90px",
                              height: "90px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                            onError={(e) => {
                              e.target.src = "/img/sidebar-logo.svg";
                            }}
                          />
                          <div>
                            <h5 className="d-flex align-items-center gap-2 flex-wrap mb-1">
                              <span
                                className="text-truncate-1"
                                style={{ maxWidth: "250px", fontWeight: "600", color: "#fff" }}
                              >
                                {course.courseTitle}
                              </span>
                              {isFeaturedActive(course) && (
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
                              className="ref text-truncate-1 mb-2"
                              style={{ maxWidth: "300px", fontSize: "14px", color: "#888" }}
                            >
                              {course.courseCategory?.name || "General"}
                            </p>

                            {/* Date info */}
                            <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: "12px" }}>
                              <span>📅</span>
                              <span>
                                {course.startDate ? new Date(course.startDate).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                                {" - "}
                                {course.endDate ? new Date(course.endDate).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                              </span>
                            </div>

                            {isFeaturedActive(course) && (
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#fda085",
                                  marginTop: "4px",
                                  marginBottom: 0,
                                }}
                              >
                                {t("featuredUntil")}{" "}
                                {new Date(
                                  course.featuredExpiry,
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
                      <div className="ticket-rgt d-flex flex-column align-items-end gap-2">
                        <div className="d-flex gap-2 flex-wrap justify-content-end">
                          {/* Publication Status */}
                          {course.isDraft ? (
                            <span
                              className="px-2 py-1 rounded text-uppercase"
                              style={{ fontSize: "11px", fontWeight: "bold", backgroundColor: "rgba(255, 193, 7, 0.15)", color: "#ffc107", border: "1px solid rgba(255, 193, 7, 0.3)" }}
                            >
                              {t("draft") || "Draft"}
                            </span>
                          ) : (
                            <span
                              className="px-2 py-1 rounded text-uppercase"
                              style={{ fontSize: "11px", fontWeight: "bold", backgroundColor: "rgba(40, 167, 69, 0.15)", color: "#28a745", border: "1px solid rgba(40, 167, 69, 0.3)" }}
                            >
                              {t("published") || "Published"}
                            </span>
                          )}

                          {/* Session status (Live, Upcoming, Past) */}
                          {course.status && (
                            <span
                              className="px-2 py-1 rounded text-uppercase"
                              style={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                backgroundColor:
                                  course.status === "Live" ? "rgba(35, 173, 164, 0.15)" :
                                    course.status === "Upcoming" ? "rgba(0, 123, 255, 0.15)" :
                                      "rgba(108, 117, 125, 0.15)",
                                color:
                                  course.status === "Live" ? "#23ada4" :
                                    course.status === "Upcoming" ? "#007bff" :
                                      "#6c757d",
                                border: `1px solid ${course.status === "Live" ? "rgba(35, 173, 164, 0.3)" :
                                  course.status === "Upcoming" ? "rgba(0, 123, 255, 0.3)" :
                                    "rgba(108, 117, 125, 0.3)"
                                  }`
                              }}
                            >
                              {t(course.status.toLowerCase()) || course.status}
                            </span>
                          )}

                          {/* Enrollment type */}
                          <span
                            className="px-2 py-1 rounded text-uppercase"
                            style={{ fontSize: "11px", fontWeight: "bold", backgroundColor: "rgba(255,255,255,0.08)", color: "#ccc", border: "1px solid rgba(255,255,255,0.15)" }}
                          >
                            {t(course.enrollmentType?.toLowerCase()) || course.enrollmentType || t("ongoing")}
                          </span>
                        </div>

                        <p
                          className="text-truncate-1 mt-2 mb-0"
                          style={{ fontSize: "14px", color: "#ccc" }}
                        >
                          {t("duration")}{" "}
                          <span style={{ color: "#23ada4", fontWeight: "600" }}>{getCourseDurationText(course)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="ticket-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="d-flex gap-4">
                        <p className="mb-0">
                          {t("price")}{" "}
                          <span style={{ color: "#fff", fontWeight: "600" }}>₮{course.price?.toLocaleString() || 0}</span>
                        </p>
                        <p className="mb-0">
                          {t("totalRevenue")}{" "}
                          <span style={{ color: "#28a745", fontWeight: "600" }}>
                            ₮{course.totalRevenue?.toLocaleString() || 0}
                          </span>
                        </p>
                        <p className="mb-0">
                          {t("seats")}{" "}
                          <span style={{ color: "#ffc107", fontWeight: "600" }}>
                            {course.totalEnrollments || 0}/
                            {course.totalSeats || 0}
                          </span>
                        </p>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        {!isPast && (
                          <Link href={`/AddProgram?courseId=${course._id}`} className="text-decoration-none" style={{ color: "#23ada4" }}>
                            {t("edit")}{" "}
                            <img src="/img/Arrow-Right.svg" alt="arrow" />
                          </Link>
                        )}

                        <Link href={`/CourseDetailOrganiser?courseId=${course._id}`} className="text-decoration-none" style={{ color: "#fff" }}>
                          {t("viewDetails")}{" "}
                          <img src="/img/Arrow-Right.svg" alt="arrow" />
                        </Link>

                        {!isPast &&
                          (isFeaturedActive(course) ? (
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
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => openPromoModal(course)}
                            >
                              🚀 {t("promote")}
                            </button>
                          ))}
                      </div>
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
            🚀 {t("promote")}: {" "}
            <span
              className="text-truncate-1"
              style={{
                color: "#23ada4",
                maxWidth: "400px",
                display: "inline-block",
                verticalAlign: "bottom",
              }}
            >
              {selectedCourse?.courseTitle}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#1a1a1a", padding: "24px" }}>
          {loadingPackages ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3" style={{ color: "#999" }}>
                {t("loadingPromotionPackages")}
              </p>
            </div>
          ) : promoPackages.length === 0 ? (
            <p className="text-center py-4" style={{ color: "#999" }}>
              {t("noPromotionPackagesCourse")}
            </p>
          ) : (
            <>
              <p style={{ color: "#999", marginBottom: "20px" }}>
                {t("boostCourseVisibility")}
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
                          {pkg.durationInDays}{" "}
                          {pkg.durationInDays > 1 ? t("days") : t("day")}
                        </p>
                        {isSelected && (
                          <div
                            style={{
                              marginTop: "12px",
                              color: "#23ada4",
                              fontWeight: 600,
                              fontSize: "13px",
                            }}
                          >
                            ✓ {t("selected")}
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
                      {t("selectedPlan")}
                    </p>
                    <p style={{ color: "#fff", margin: 0, fontWeight: 600 }}>
                      {selectedPackage.name} — {selectedPackage.durationInDays}{" "}
                      {selectedPackage.durationInDays > 1 ? t("days") : t("day")}
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
            {t("cancel")}
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
                {t("processing")}
              </>
            ) : (
              t("confirmPay")
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CoursesManagement;
