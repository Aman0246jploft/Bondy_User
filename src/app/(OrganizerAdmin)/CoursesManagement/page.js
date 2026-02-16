"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Col, Row, Form, Pagination } from "react-bootstrap";
import courseApi from "@/api/courseApi";
import authApi from "@/api/authApi";

function CoursesManagement() {
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

    return (
        <div>
            <div className="cards">
                <div className="card-header">
                    <div>
                        <h2 className="card-title">Courses Management</h2>
                        <p className="card-desc">
                            Manage your courses, track enrollments and revenue.
                        </p>
                    </div>

                    <Link href="/AddProgram" className="custom-btn">
                        Create New Course
                    </Link>
                </div>

                <Row>
                    <Col md={4}>
                        <div className="event-cards">
                            <h5>Total Revenue</h5>
                            <h3>${stats.totalRevenue?.toLocaleString() || 0}</h3>
                            <p>From all courses</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="event-cards">
                            <h5>Total Enrollments</h5>
                            <h3>{stats.totalEnrollments?.toLocaleString() || 0}</h3>
                            <p>Active students</p>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="event-cards">
                            <h5>Total Courses</h5>
                            <h3>{pagination.total || 0}</h3>
                            <p>Published courses</p>
                        </div>
                    </Col>
                </Row>

                {/* Search and Filters */}
                {/* <Row className="mb-4 mt-4">
                    <Col md={6}>
                        <Form onSubmit={handleSearchSubmit}>
                            <Form.Group>
                                <div className="input-group">
                                    <Form.Control
                                        type="text"
                                        placeholder="Search courses..."
                                        value={filters.search}
                                        onChange={handleSearchChange}
                                    />
                                    <button type="submit" className="custom-btn">
                                        Search
                                    </button>
                                </div>
                            </Form.Group>
                        </Form>
                    </Col>
                    <Col md={6}>
                        <Form.Select
                            value={filters.categoryId}
                            onChange={handleCategoryChange}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                </Row> */}

                {/* Course Listing */}
                <div className="ticket-tabs">
                    <div className="ticket-listing">
                        {loading ? (
                            <p className="text-center py-5">Loading courses...</p>
                        ) : courses.length === 0 ? (
                            <p className="text-center py-5">No courses found.</p>
                        ) : (
                            courses.map((course) => (
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
                                                />
                                                <div>
                                                    <h5>{course.courseTitle}</h5>
                                                    <p className="ref">
                                                        {course.courseCategory?.name || "General"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ticket-rgt">
                                            <span className="status-badge">
                                                {course.enrollmentType || "Ongoing"}
                                            </span>
                                            <p>
                                                Duration <span>{course.duration || "N/A"}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ticket-bottom">
                                        <p>
                                            Price <span>${course.price?.toFixed(2) || 0}</span>
                                        </p>
                                        <p>
                                            Total Revenue{" "}
                                            <span>${course.totalRevenue?.toLocaleString() || 0}</span>
                                        </p>
                                        <p>
                                            Seats{" "}
                                            <span>
                                                {course.totalEnrollments || 0}/{course.totalSeats || 0}
                                            </span>
                                        </p>

                                        <Link href={`/AddProgram?courseId=${course._id}`}>
                                            Edit <img src="/img/Arrow-Right.svg" alt="arrow" />
                                        </Link>

                                        <Link href={`/course-details/${course._id}`}>
                                            View Details{" "}
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
        </div>
    );
}

export default CoursesManagement;
