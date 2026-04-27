"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Spinner, ListGroup } from "react-bootstrap";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import VerifyDropdwons from "@/components/VerifyDropdwons";

const FollowListModal = ({ show, onHide, userId, type }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();
    const scrollRef = useRef(null);

    const fetchList = useCallback(async (pageNum) => {
        if (!userId) return;
        setLoading(true);
        try {
            const params = { userId, pageNo: pageNum, size: 10 };
            const response = type === "followers"
                ? await authApi.getFollowers(params)
                : await authApi.getFollowing(params);

            if (response?.status) {
                const data = type === "followers" ? response?.data?.followers : response?.data?.following;
                if (data.length === 0) {
                    if (pageNum === 1) setList([]);
                    setHasMore(false);
                } else {
                    setList(prev => pageNum === 1 ? data : [...prev, ...data]);
                    if (data.length < 10) setHasMore(false);
                }
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
        } finally {
            setLoading(false);
        }
    }, [userId, type]);

    useEffect(() => {
        if (show && userId) {
            setList([]);
            setPage(1);
            setHasMore(true);
            fetchList(1);
        }
    }, [show, userId, type, fetchList]);

    const handleScroll = () => {
        if (!scrollRef.current || loading || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 30) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchList(nextPage);
        }
    };

    const handleFollowToggle = async (e, targetUserId, isCurrentlyFollowed, index) => {
        e.stopPropagation();
        try {
            const response = isCurrentlyFollowed
                ? await authApi.unfollowUser({ toUser: targetUserId })
                : await authApi.followUser({ toUser: targetUserId });

            if (response?.status) {
                setList(prev => {
                    const newList = [...prev];
                    newList[index] = { ...newList[index], isFollowed: !isCurrentlyFollowed };
                    return newList;
                });
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        }
    };

    const handleUserClick = (id) => {
        onHide();
        router.push(`/profile?id=${id}`);
    };

    return (
        <Modal show={show} onHide={onHide} centered scrollable className="follow-modal">
            <Modal.Header closeButton className="bg-dark text-white border-secondary">
                <Modal.Title className="text-capitalize">
                    {type === "followers" ? "Followers" : "Following"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body
                onScroll={handleScroll}
                ref={scrollRef}
                className="bg-dark p-0 custom-scrollbar"
                style={{ height: "450px", overflowY: "auto" }}
            >
                {list.length === 0 && !loading ? (
                    <div className="p-4 text-center text-muted">
                        No {type} found.
                    </div>
                ) : (
                    <ListGroup variant="flush">
                        {list.map((item, idx) => {
                            const user = type === "followers" ? item.fromUser : item.toUser;
                            if (!user) return null;
                            return (
                                <ListGroup.Item
                                    key={user._id + idx}
                                    className="bg-dark text-white border-secondary d-flex align-items-center p-3"
                                    action
                                    style={{ borderBottom: "1px solid #333" }}
                                    onClick={() => handleUserClick(user._id)}
                                >
                                    <img
                                        src={user.profileImage ? getFullImageUrl(user.profileImage) : "/img/sidebar-logo.svg"}
                                        alt={user.firstName}
                                        className="rounded-circle me-3 object-fit-cover img-placeholder"
                                        width="45"
                                        height="45"
                                        onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                                    />
                                    <div className="flex-grow-1">
                                        <h6 className="mb-0 fw-semibold">
                                            {user.firstName} {user.lastName}
                                            {user.isVerified && <VerifyDropdwons />}
                                        </h6>
                                    </div>
                                    <div>
                                        <button
                                            className={`btn btn-sm ${item.isFollowed ? 'btn-outline-teal' : 'btn-teal'}`}
                                            style={{
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                padding: '4px 15px',
                                                minWidth: '80px',
                                                borderColor: 'var(--primary-teal, #23ada4)',
                                                backgroundColor: item.isFollowed ? 'transparent' : 'var(--primary-teal, #23ada4)',
                                                color: item.isFollowed ? 'var(--primary-teal, #23ada4)' : '#fff'
                                            }}
                                            onClick={(e) => handleFollowToggle(e, user._id, item.isFollowed, idx)}
                                        >
                                            {item.isFollowed ? 'Following' : 'Follow'}
                                        </button>
                                    </div>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                )}
                {loading && (
                    <div className="p-3 text-center">
                        <Spinner animation="border" variant="info" size="sm" />
                    </div>
                )}
            </Modal.Body>
            <style jsx global>{`
                .follow-modal .modal-content {
                    border-radius: 15px;
                    border: 1px solid #444;
                    overflow: hidden;
                }
                .follow-modal .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .follow-modal .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1a1a1a;
                }
                .follow-modal .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #444;
                    border-radius: 10px;
                }
                .follow-modal .list-group-item-action:hover {
                    background-color: #2a2a2a !important;
                    color: #fff;
                }
            `}</style>
        </Modal>
    );
};

export default FollowListModal;
