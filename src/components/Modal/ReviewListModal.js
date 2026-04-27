"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Spinner, ListGroup } from "react-bootstrap";
import { useRouter } from "next/navigation";
import reviewApi from "@/api/reviewApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import VerifyDropdwons from "@/components/VerifyDropdwons";

const ReviewListModal = ({ show, onHide, entityId, entityModel }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();
    const scrollRef = useRef(null);

    const fetchReviews = useCallback(async (pageNum) => {
        if (!entityId) return;
        setLoading(true);
        try {
            // Updated to use organizerId as expected by the /review/organizer-list endpoint
            const params = { organizerId: entityId, page: pageNum, limit: 10 };
            const response = await reviewApi.getReviews(params);

            if (response?.status) {
                const data = response?.data?.reviews || [];
                if (data.length === 0) {
                    if (pageNum === 1) setReviews([]);
                    setHasMore(false);
                } else {
                    setReviews(prev => pageNum === 1 ? data : [...prev, ...data]);
                    if (data.length < 10) setHasMore(false);
                }
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    }, [entityId]);

    useEffect(() => {
        if (show && entityId) {
            setReviews([]);
            setPage(1);
            setHasMore(true);
            fetchReviews(1);
        }
    }, [show, entityId, entityModel, fetchReviews]);

    const handleScroll = () => {
        if (!scrollRef.current || loading || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 30) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchReviews(nextPage);
        }
    };

    const handleUserClick = (id) => {
        onHide();
        router.push(`/profile?id=${id}`);
    };

    return (
        <Modal show={show} onHide={onHide} centered scrollable className="review-modal">
            <Modal.Header closeButton className="bg-dark text-white border-secondary py-3">
                <Modal.Title className="fw-bold h5 mb-0">Reviews & Ratings</Modal.Title>
            </Modal.Header>
            <Modal.Body
                onScroll={handleScroll}
                ref={scrollRef}
                className="bg-dark p-3 custom-scrollbar"
                style={{ height: "500px", overflowY: "auto" }}
            >
                {reviews.length === 0 && !loading ? (
                    <div className="p-5 text-center text-muted">
                        <img src="/img/sidebar-logo.svg" width="60" className="mb-3 opacity-25" alt="No reviews" />
                        <p>No reviews found yet.</p>
                    </div>
                ) : (
                    <div className="review-list">
                        {reviews.map((review, idx) => {
                            const user = review.userId;
                            if (!user) return null;
                            return (
                                <div
                                    key={review._id + idx}
                                    className="review-card mb-3 p-3"
                                    onClick={() => handleUserClick(user._id)}
                                >
                                    <div className="d-flex align-items-start mb-3">
                                        <div className="position-relative me-3">
                                            <img
                                                src={user.profileImage ? getFullImageUrl(user.profileImage) : "/img/sidebar-logo.svg"}
                                                alt={`${user.firstName}`}
                                                className="rounded-circle object-fit-cover shadow-sm img-placeholder"
                                                width="50"
                                                height="50"
                                                onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                                            />
                                            {/* {user.isVerified && (
                                                <div className="position-absolute bottom-0 end-0 bg-dark rounded-circle" style={{ padding: '2px' }}>
                                                    <VerifyDropdwons />
                                                </div>
                                            )} */}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start text-dark">
                                                <div>
                                                    <h6 className="mb-0 fw-bold text-white">
                                                        {user.firstName} {user.lastName}
                                                    </h6>
                                                    <div className="review-timestamp text-muted">
                                                        {new Date(review.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>
                                                <div className="rating-tag px-2 py-1 rounded-pill d-flex align-items-center">
                                                    <span className="me-1 fw-bold">{review.rating}</span>
                                                    <img src="/img/star-icon.svg" width="12" alt="star" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="review-bubble p-3 rounded-3 position-relative">
                                        <p className="mb-0 text-light-gray">
                                            {review.review}
                                        </p>
                                        {review.entityId && (
                                            <div className="mt-2 pt-2 border-top border-secondary opacity-75">
                                                <span className="small-label me-1">Posted for:</span>
                                                <span className="event-label">{review.entityId.eventTitle || review.entityId.courseTitle}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {loading && (
                    <div className="p-3 text-center">
                        <Spinner animation="border" variant="info" size="sm" />
                    </div>
                )}
            </Modal.Body>
            <style jsx global>{`
                .review-modal .modal-content {
                    border-radius: 20px;
                    border: 1px solid #333;
                    background-color: #121212;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .review-card {
                    background-color: #1a1a1a;
                    border-radius: 12px;
                    border: 1px solid #2a2a2a;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .review-card:hover {
                    border-color: #444;
                    transform: translateY(-2px);
                    background-color: #1e1e1e;
                }
                .review-bubble {
                    background-color: #222;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                .text-light-gray {
                    color: rgba(255, 255, 255, 0.85);
                }
                .review-timestamp {
                    font-size: 0.75rem;
                }
                .rating-tag {
                    background-color: rgba(35, 173, 164, 0.1);
                    color: var(--primary-teal, #23ada4);
                    border: 1px solid rgba(35, 173, 164, 0.2);
                    font-size: 0.8rem;
                }
                .small-label {
                    font-size: 0.7rem;
                    color: #777;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .event-label {
                    font-size: 0.75rem;
                    color: var(--primary-teal, #23ada4);
                    font-weight: 500;
                }
                .review-modal .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .review-modal .custom-scrollbar::-webkit-scrollbar-track {
                    background: #121212;
                }
                .review-modal .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 10px;
                }
                .review-modal .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #444;
                }
            `}</style>
        </Modal>
    );
};

export default ReviewListModal;
