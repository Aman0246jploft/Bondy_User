"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Col, Row, Form, Pagination, Modal, Spinner } from "react-bootstrap";
import courseApi from "@/api/courseApi";
import authApi from "@/api/authApi";
import promotionsApi from "@/api/promotionsApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

function CoursesManagement() {
    const { t, language } = useLanguage();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        search: "",
        categoryId: "",
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
            const response = await authApi.getCategories();
            if (response.data) {
                setCategories(response.data.categories || []);
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
            };

            const response = await courseApi.getOrganizerCourses(params);
            if (response.data) {
                setCourses(response.data.courses);
                setPagination((prev) => ({
                    ...prev,
                    total: response.data.totalCourses,
                    page: response.data.currentPage,
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
    }, [pagination.page, filters.categoryId]);

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

    const totalPages = Math.ceil(pagination.total / pagination.limit);

    // Calculate total revenue and enrollments
    const stats = courses.reduce(
        (acc, course) => ({
            totalRevenue: acc.totalRevenue + (course.totalRevenue || 0),
            totalEnrollments: acc.totalEnrollments + (course.totalEnrollments || 0),
        }),
        { totalRevenue: 0, totalEnrollments: 0 }
    );

    // ---- Promotion Helpers ----
    const isFeaturedActive = (course) =>
        course.isFeatured && course.featuredExpiry && new Date(course.featuredExpiry) > new Date();

    const openPromoModal = async (course) => {
        setSelectedCourse(course);
        setSelectedPackage(null);
        setShowPromoModal(true);
        setLoadingPackages(true);
        try {
            const res = await promotionsApi.getCoursePackages();
            console.log("resresresresres>>>", res)
            if (res?.status) {
                setPromoPackages(res?.data || []);
            }
        } catch (err) {
            toast.error(t("failedToLoadPackages") || "Failed to load promotion packages");
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
            toast.error(t("selectPackageFirst") || "Please select a promotion package first.");
            return;
        }
        setCheckingOut(true);
        try {
            const res = await promotionsApi.checkoutCoursePromotion({
                courseId: selectedCourse._id,
                packageId: selectedPackage._id,
            });
            if (res?.status) {
                toast.success(t("promotionActivated") || "Promotion activated successfully! 🎉");
                closePromoModal();
                fetchCourses();
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || t("checkoutFailed") || "Checkout failed. Please try again.");
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
                        <p className="card-desc">
                            {t("manageCoursesDesc")}
                        </p>
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
                                                <Form.Check />
                                                <div className="event-info-box-img">
                                                    <img
                                                        src={
                                                            course.posterImage?.[0] || "/img/details_img02.png"
                                                        }
                                                        alt={course.courseTitle}
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
                                                            <span className="text-truncate-1" style={{ maxWidth: "250px" }}>
                                                                {course.courseTitle}
                                                            </span>
                                                            {isFeaturedActive(course) && (
                                                                <span
                                                                    style={{
                                                                        background: "linear-gradient(135deg, #f6d365, #fda085)",
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
                                                        <p className="ref text-truncate-1" style={{ maxWidth: "300px" }}>
                                                            {course.courseCategory?.name || "General"}
                                                        </p>
                                                        {isFeaturedActive(course) && (
                                                            <p style={{ fontSize: "11px", color: "#fda085", margin: 0 }}>
                                                                {t("featuredUntil")}{" "}
                                                                {new Date(course.featuredExpiry).toLocaleDateString("en-GB", {
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
                                                <span className="status-badge">
                                                    {t(course.enrollmentType?.toLowerCase()) || course.enrollmentType || t("ongoing")}
                                                </span>
                                                <p className="text-truncate-1" style={{ maxWidth: "200px" }}>
                                                    {t("duration")} <span>{(language === "mn" ? course.durationTranslation || course.duration : course.duration) || "N/A"}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ticket-bottom">
                                            <p>
                                                {t("price")} <span>₮{course.price?.toLocaleString() || 0}</span>
                                            </p>
                                            <p>
                                                {t("totalRevenue")}{" "}
                                                <span>₮{course.totalRevenue?.toLocaleString() || 0}</span>
                                            </p>
                                            <p>
                                                {t("seats")}{" "}
                                                <span>
                                                    {course.totalEnrollments || 0}/{course.totalSeats || 0}
                                                </span>
                                            </p>

                                            {!isPast && (
                                                <Link href={`/AddProgram?courseId=${course._id}`}>
                                                    {t("edit")} <img src="/img/Arrow-Right.svg" alt="arrow" />
                                                </Link>
                                            )}

                                            <Link href={`/course-details/${course._id}`}>
                                                {t("viewDetails")}{" "}
                                                <img src="/img/Arrow-Right.svg" alt="arrow" />
                                            </Link>

                                            {!isPast && (
                                                isFeaturedActive(course) ? (
                                                    <span style={{ color: "#fda085", fontSize: "13px", fontWeight: 500 }}>
                                                        ⭐ {t("activePromotion") || "Active Promotion"}
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="custom-btn"
                                                        style={{ padding: "8px 16px", fontSize: "13px" }}
                                                        onClick={() => openPromoModal(course)}>
                                                        🚀 {t("promote")}
                                                    </button>
                                                )
                                            )}
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
                <Modal.Header closeButton style={{ background: "#1a1a1a", border: "1px solid #333" }}>
                    <Modal.Title style={{ color: "#fff" }}>
                        🚀 Promote:{" "}
                        <span className="text-truncate-1" style={{ color: "#23ada4", maxWidth: "400px", display: "inline-block", verticalAlign: "bottom" }}>{selectedCourse?.courseTitle}</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: "#1a1a1a", padding: "24px" }}>
                    {loadingPackages ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3" style={{ color: "#999" }}>Loading packages...</p>
                        </div>
                    ) : promoPackages.length === 0 ? (
                        <p className="text-center py-4" style={{ color: "#999" }}>
                            No active promotion packages available at the moment.
                        </p>
                    ) : (
                        <>
                            <p style={{ color: "#999", marginBottom: "20px" }}>
                                Select a plan to boost your course's visibility across the platform.
                            </p>
                            <Row className="gx-3 gy-3">
                                {promoPackages.map((pkg) => {
                                    const isSelected = selectedPackage?._id === pkg._id;
                                    return (
                                        <Col md={4} xs={12} key={pkg._id}>
                                            <div
                                                onClick={() => setSelectedPackage(pkg)}
                                                style={{
                                                    background: isSelected ? "rgba(35,173,164,0.12)" : "#242424",
                                                    border: `2px solid ${isSelected ? "#23ada4" : "#333"}`,
                                                    borderRadius: "16px",
                                                    padding: "20px",
                                                    cursor: "pointer",
                                                    transition: "all 0.25s ease",
                                                    height: "100%",
                                                }}>
                                                <h5 className="text-truncate-1" style={{ color: "#fff", marginBottom: "4px" }}>{pkg.name}</h5>
                                                <h3 style={{ color: "#23ada4", margin: "8px 0" }}>
                                                    ₮{pkg.price?.toLocaleString()}
                                                </h3>
                                                <p style={{ color: "#999", fontSize: "13px", marginBottom: "12px" }}>
                                                    {pkg.durationInDays} day{pkg.durationInDays > 1 ? "s" : ""}
                                                </p>
                                                {isSelected && (
                                                    <div style={{ marginTop: "12px", color: "#23ada4", fontWeight: 600, fontSize: "13px" }}>
                                                        ✓ Selected
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
                                        <p style={{ color: "#999", margin: 0, fontSize: "13px" }}>Selected Plan</p>
                                        <p style={{ color: "#fff", margin: 0, fontWeight: 600 }}>
                                            {selectedPackage.name} — {selectedPackage.durationInDays} days
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
                <Modal.Footer style={{ background: "#1a1a1a", border: "1px solid #333", gap: "12px" }}>
                    <button
                        className="outline-btn"
                        onClick={closePromoModal}
                        style={{ padding: "10px 24px" }}>
                        Cancel
                    </button>
                    <button
                        className="custom-btn"
                        onClick={handleCheckout}
                        disabled={!selectedPackage || checkingOut}
                        style={{ minWidth: "140px" }}>
                        {checkingOut ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Processing...
                            </>
                        ) : (
                            "Confirm & Pay"
                        )}
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default CoursesManagement;
