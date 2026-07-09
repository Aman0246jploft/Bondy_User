"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Col, Row, Form, Modal, Spinner, Tab, Tabs } from "react-bootstrap";
import courseApi from "@/api/courseApi";
import authApi from "@/api/authApi";
import categoryApi from "@/api/categoryApi";
import promotionsApi from "@/api/promotionsApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import PaginationComponent from "@/components/PaginationComponent";

function CoursesManagement() {
  const { t, language } = useLanguage();
  const locale = language === "mn" ? "mn-MN" : "en-US";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    enrollmentType: "", // "" (All), "Ongoing", "fixedStart"
  });
  const [activeTab, setActiveTab] = useState("all");
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
      const response = await categoryApi.getCategories({
        type: "course",
        limit: 1000,
      });
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
        enrollmentType: filters.enrollmentType,
      };

      if (activeTab === "drafts") {
        params.isDraft = "true";
      } else {
        params.isDraft = "false";
        params.status =
          activeTab === "all"
            ? ""
            : activeTab === "live"
              ? "Live"
              : activeTab === "upcoming"
                ? "Upcoming"
                : activeTab === "past"
                  ? "Past"
                  : "";
      }

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
  }, [
    pagination.page,
    filters.categoryId,
    activeTab,
    filters.enrollmentType,
  ]);

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

  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const visiblePages = new Set([1, 2, 3, totalPages - 1, totalPages]);

    if (pagination.page <= 4) {
      visiblePages.add(4);
    } else if (pagination.page >= totalPages - 3) {
      visiblePages.add(totalPages - 3);
    } else {
      visiblePages.add(pagination.page - 1);
      visiblePages.add(pagination.page);
      visiblePages.add(pagination.page + 1);
    }

    const sortedPages = Array.from(visiblePages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    const items = [];
    sortedPages.forEach((page, index) => {
      const previousPage = sortedPages[index - 1];
      if (index > 0 && page - previousPage > 1) {
        items.push("ellipsis");
      }
      items.push(page);
    });

    return items;
  };

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
        <div
          className="mb-4 mt-3 p-3 rounded"
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
          <Form onSubmit={handleSearchSubmit}>
            <Row className="align-items-center g-3">
              {/* Search */}
              <Col lg={4} md={6} xs={12}>
                <Form.Group className="mb-0">
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={
                        t("searchCourses") || "Search program name..."
                      }
                      value={filters.search}
                      onChange={handleSearchChange}
                      style={{
                        backgroundColor: "#111",
                        border: "1px solid rgba(35, 173, 164, 0.3)",
                        color: "white",
                        height: "45px",
                        paddingRight: "45px",
                      }}
                    />
                    <button
                      type="submit"
                      className="btn position-absolute end-0 top-0 h-100 border-0 bg-transparent"
                      style={{ color: "#23ada4" }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none">
                        <g clip-path="url(#clip0_4551_14469)">
                          <path
                            d="M17.8294 17.0207L13.1821 12.4477C14.3991 11.1255 15.1468 9.37682 15.1468 7.45261C15.1462 3.33639 11.7558 0 7.57321 0C3.3906 0 0.000183105 3.33639 0.000183105 7.45261C0.000183105 11.5688 3.3906 14.9052 7.57321 14.9052C9.38038 14.9052 11.0379 14.2802 12.3398 13.241L17.0052 17.832C17.2325 18.056 17.6015 18.056 17.8289 17.832C18.0567 17.6081 18.0567 17.2447 17.8294 17.0207ZM7.57321 13.7586C4.03426 13.7586 1.1654 10.9353 1.1654 7.45261C1.1654 3.96991 4.03426 1.14663 7.57321 1.14663C11.1122 1.14663 13.981 3.96991 13.981 7.45261C13.981 10.9353 11.1122 13.7586 7.57321 13.7586Z"
                            fill="#737373"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_4551_14469">
                            <rect width="18" height="18" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </button>
                  </div>
                </Form.Group>
              </Col>

              {/* Category */}
              {/* <Col lg={3} md={6} xs={12}>
                <Form.Select
                  value={filters.categoryId}
                  onChange={handleCategoryChange}
                  style={{
                    backgroundColor: "#111",
                    border: "1px solid rgba(35, 173, 164, 0.3)",
                    color: "white",
                    height: "45px",
                  }}>
                  <option value="">
                    {t("allCategories") || "All Categories"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Col> */}
              {/* Enrollment type toggles */}
              <Col lg={3} md={6} xs={12}>
                <Form.Select
                  value={filters.enrollmentType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      enrollmentType: e.target.value,
                    }))
                  }
                  style={{
                    backgroundColor: "#111",
                    border: "1px solid rgba(35, 173, 164, 0.3)",
                    color: "white",
                    height: "45px",
                  }}>
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
          <div className="d-flex mb-3 justify-content-between align-items-center flex-wrap">
            <Tabs activeKey={activeTab} onSelect={(k) => { setActiveTab(k); setPagination((prev) => ({ ...prev, page: 1 })); }} className="">
              <Tab eventKey="all" title={t("all")} />
              <Tab eventKey="upcoming" title={t("upcoming")} />
              <Tab eventKey="live" title={t("ongoing") || "Ongoing"} />
              <Tab eventKey="past" title={t("past")} />
              <Tab eventKey="drafts" title={t("draftCourses") || "Draft Courses"} />
            </Tabs>
          </div>
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
                              "/img/sidebar-logo.svg"
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
                                style={{
                                  maxWidth: "250px",
                                  fontWeight: "600",
                                  color: "#fff",
                                }}>
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
                                  }}>
                                  ⭐ {t("featured")}
                                </span>
                              )}
                            </h5>
                            <p
                              className="ref text-truncate-1 mb-2"
                              style={{
                                maxWidth: "300px",
                                fontSize: "14px",
                                color: "#888",
                                textTransform: "capitalize",
                              }}>
                              {course.courseCategory?.name || ""}
                            </p>

                            {/* Date info */}
                            <div
                              className="d-flex align-items-center gap-1 text-muted"
                              style={{ fontSize: "12px" }}>
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
                                </svg>
                              </span>
                              <span>
                                {course.startDate
                                  ? new Date(
                                    course.startDate,
                                  ).toLocaleDateString(locale, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                  : "N/A"}
                                {course.enrollmentType !== "Ongoing" && (
                                  <>
                                    {" - "}
                                    {course.endDate
                                      ? new Date(course.endDate).toLocaleDateString(
                                        locale,
                                        {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        },
                                      )
                                      : "N/A"}
                                  </>
                                )}
                              </span>
                            </div>

                            {isFeaturedActive(course) && (
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#fda085",
                                  marginTop: "4px",
                                  marginBottom: 0,
                                }}>
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
                              style={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                backgroundColor: "rgba(255, 193, 7, 0.15)",
                                color: "#ffc107",
                                border: "1px solid rgba(255, 193, 7, 0.3)",
                              }}>
                              {t("draft") || "Draft"}
                            </span>
                          ) : (
                            <span
                              className="px-2 py-1 rounded text-uppercase"
                              style={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                backgroundColor: "rgba(40, 167, 69, 0.15)",
                                color: "#28a745",
                                border: "1px solid rgba(40, 167, 69, 0.3)",
                              }}>
                              {t("published") || "Published"}
                            </span>
                          )}

                          {/* Session status (Live, Upcoming, Past) */}
                          {!course.isDraft && course.status && (
                            <span
                              className="px-2 py-1 rounded text-uppercase"
                              style={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                backgroundColor:
                                  course.status === "Live"
                                    ? "rgba(35, 173, 164, 0.15)"
                                    : course.status === "Upcoming"
                                      ? "rgba(0, 123, 255, 0.15)"
                                      : "rgba(108, 117, 125, 0.15)",
                                color:
                                  course.status === "Live"
                                    ? "#23ada4"
                                    : course.status === "Upcoming"
                                      ? "#007bff"
                                      : "#6c757d",
                                border: `1px solid ${course.status === "Live"
                                  ? "rgba(35, 173, 164, 0.3)"
                                  : course.status === "Upcoming"
                                    ? "rgba(0, 123, 255, 0.3)"
                                    : "rgba(108, 117, 125, 0.3)"
                                  }`,
                              }}>
                              {t(course.status.toLowerCase()) || course.status}
                            </span>
                          )}

                          {/* Enrollment type */}
                          <span
                            className="px-2 py-1 rounded text-uppercase"
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              backgroundColor: "rgba(255,255,255,0.08)",
                              color: "#ccc",
                              border: "1px solid rgba(255,255,255,0.15)",
                            }}>
                            {t(course.enrollmentType?.toLowerCase()) ||
                              course.enrollmentType ||
                              t("ongoing")}
                          </span>
                        </div>

                        <p
                          className="text-truncate-1 mt-2 mb-0"
                          style={{ fontSize: "14px", color: "#ccc" }}>
                          {t("duration")}{" "}
                          <span style={{ color: "#23ada4", fontWeight: "600" }}>
                            {getCourseDurationText(course)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div
                      className="ticket-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 mt-2"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="d-flex gap-4">
                        <p className="mb-0">
                          {t("price")}{" "}
                          <span style={{ color: "#fff", fontWeight: "600" }}>
                            ₮{course.price?.toLocaleString() || 0}
                          </span>
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
                        {(course.status?.toLowerCase() === "upcoming" || course.isDraft) && (
                          <Link
                            href={`/AddProgram?courseId=${course._id}`}
                            className="text-decoration-none"
                            style={{ color: "#23ada4" }}>
                            {t("edit")}{" "}
                            <img src="/img/Arrow-Right.svg" alt="arrow" />
                          </Link>
                        )}

                        <Link
                          href={`/CourseDetailOrganiser?courseId=${course._id}`}
                          className="text-decoration-none"
                          style={{ color: "#fff" }}>
                          {t("viewDetails")}{" "}
                          <img src="/img/Arrow-Right.svg" alt="arrow" />
                        </Link>

                        {course.status?.toLowerCase() === "upcoming" && !course.isDraft &&
                          (isFeaturedActive(course) ? (
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
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => openPromoModal(course)}>
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
                  </div>
                );
              })
            )}
          </div>

          <PaginationComponent
            currentPage={pagination.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
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
            </svg>{" "}
            {t("promote")}:{" "}
            <span
              className="text-truncate-1"
              style={{
                color: "#23ada4",
                maxWidth: "400px",
                display: "inline-block",
                verticalAlign: "bottom",
              }}>
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
                        }}>
                        <h5
                          className="text-truncate-1"
                          style={{ color: "#fff", marginBottom: "4px" }}>
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
                          }}>
                          {pkg.durationInDays}{" "}
                          {pkg.durationInDays > 1 ? t("days") : t("day")}
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
                  }}>
                  <div>
                    <p style={{ color: "#999", margin: 0, fontSize: "13px" }}>
                      {t("selectedPlan")}
                    </p>
                    <p style={{ color: "#fff", margin: 0, fontWeight: 600 }}>
                      {selectedPackage.name} — {selectedPackage.durationInDays}{" "}
                      {selectedPackage.durationInDays > 1
                        ? t("days")
                        : t("day")}
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
            {t("cancel")}
          </button>
          <button
            className="custom-btn"
            onClick={handleCheckout}
            disabled={!selectedPackage || checkingOut}
            style={{ minWidth: "140px" }}>
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
