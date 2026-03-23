import React, { useState, useEffect } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import commentApi from "../api/commentApi";
import { getFullImageUrl } from "../utils/imageHelper";
import ExpandableText from "./ExpandableText";

const CommentItem = ({ comment, entityId, entityModel, onReplyAdded, depth = 0 }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [replies, setReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchReplies = async () => {
        setLoadingReplies(true);
        try {
            const response = await commentApi.getReplies({ parentCommentId: comment._id, page: 1, limit: 100 });
            if (response.status) {
                setReplies(response.data.comments || []);
            }
        } catch (error) {
            console.error("Error fetching replies:", error);
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleToggleReplies = () => {
        if (!showReplies && replies.length === 0 && comment.totalReplies > 0) {
            fetchReplies();
        }
        setShowReplies(!showReplies);
    };



    const handleReplySubmit = async (e) => {
        if (e) e.preventDefault();
        if (!replyContent.trim()) return;

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            window.location.href = "/login";
            return;
        }

        setSubmitting(true);
        try {
            const response = await commentApi.createComment({
                content: replyContent,
                entityId,
                entityModel,
                parentCommentId: comment._id
            });

            if (response.status) {
                setReplyContent("");
                setShowReplyForm(false);
                // Refresh replies
                fetchReplies();
                setShowReplies(true);
                if (onReplyAdded) onReplyAdded();
            }
        } catch (error) {
            console.error("Error submitting reply:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`d-flex mb-4 ${depth > 0 ? "ms-4 border-start ps-3 border-2 border-light" : ""}`}>
            <img
                src={comment.user?.profileImage ? getFullImageUrl(comment.user.profileImage) : "/img/default-user.png"}
                alt="User"
                className="rounded-circle me-3 flex-shrink-0 object-fit-cover"
                width={depth > 0 ? "40" : "48"}
                height={depth > 0 ? "40" : "48"}
            />
            <div className="flex-grow-1">
                <div className="p-3 rounded-3 shadow-sm" style={{ backgroundColor: "#1e1e1e", border: "1px solid #333" }}>
                    <h6 className="mb-1 fw-bold" style={{ fontSize: depth > 0 ? "0.9rem" : "1rem", color: "var(--white, #fff)" }}>
                        {comment.user?.firstName} {comment.user?.lastName}
                    </h6>
                    <div style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                        <ExpandableText text={comment.content} limit={depth > 0 ? 150 : 250} className="mb-0" />
                    </div>
                </div>

                <div className="d-flex align-items-center mt-2 ms-2" style={{ fontSize: "0.85rem" }}>
                    <span className="me-3" style={{ color: "#777" }}>
                        {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                        className="btn btn-link p-0 text-decoration-none fw-semibold me-3"
                        style={{ color: "#999" }}
                        onClick={() => setShowReplyForm(!showReplyForm)}
                    >
                        Reply
                    </button>

                    {comment.totalReplies > 0 && (
                        <button
                            className="btn btn-link p-0 text-decoration-none fw-semibold"
                            style={{ color: "var(--primary-teal, #23ada4)" }}
                            onClick={handleToggleReplies}
                        >
                            {showReplies ? "Hide Replies" : `View ${comment.totalReplies} Replies`}
                        </button>
                    )}
                </div>

                {showReplyForm && (
                    <div className="mt-3 d-flex align-items-start">
                        <Form.Control
                            type="text"
                            placeholder="Write a reply..."
                            size="sm"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="me-2"
                            onKeyPress={(e) => { if (e.key === 'Enter') handleReplySubmit(e); }}
                            style={{
                                backgroundColor: "#111",
                                color: "#fff",
                                border: "1px solid #444",
                                borderRadius: "20px",
                                paddingLeft: "15px"
                            }}
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={!replyContent.trim() || submitting}
                            onClick={handleReplySubmit}
                            style={{ backgroundColor: "var(--primary-teal, #23ada4)", borderColor: "var(--primary-teal, #23ada4)", whiteSpace: "nowrap" }}
                        >
                            {submitting ? <Spinner animation="border" size="sm" /> : "Post"}
                        </Button>
                    </div>
                )}

                {showReplies && (
                    <div className="mt-3">
                        {loadingReplies ? (
                            <div className="ms-2">
                                <Spinner animation="border" size="sm" className="text-muted" />
                            </div>
                        ) : (
                            replies.map(reply => (
                                <CommentItem
                                    key={reply._id}
                                    comment={reply}
                                    entityId={entityId}
                                    entityModel={entityModel}
                                    onReplyAdded={() => fetchReplies()}
                                    depth={depth + 1}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function CommentsSection({ entityId, entityModel }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const fetchComments = async (pageNum = 1, append = false) => {
        try {
            const response = await commentApi.getComments({ entityId, page: pageNum, limit: 10 });
            if (response.status) {
                setTotal(response.data.total || 0);
                const fetchedComments = response.data.comments || [];
                if (append) {
                    setComments(prev => [...prev, ...fetchedComments]);
                } else {
                    setComments(fetchedComments);
                }
                setHasMore(fetchedComments.length === 10);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (entityId) {
            fetchComments(1, false);
            setPage(1);
        }
    }, [entityId]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchComments(nextPage, true);
    };

    const handleCommentSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!newComment.trim()) return;

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            window.location.href = "/login";
            return;
        }

        setSubmitting(true);
        try {
            const response = await commentApi.createComment({
                content: newComment,
                entityId,
                entityModel
            });

            if (response.status) {
                setNewComment("");
                fetchComments(1, false); // Refresh list
                setPage(1);
            }
        } catch (error) {
            console.error("Error submitting comment:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="py-4 text-center">
                <Spinner animation="border" className="text-muted" />
            </div>
        );
    }

    return (
        <div className="comments-section mt-5 pt-4" style={{ borderTop: "1px solid #333" }}>
            <h3 className="mb-4" style={{ color: "var(--white, #fff)" }}>Comments ({total})</h3>

            <div className="mb-5 d-flex align-items-start">




                <div className="flex-grow-1 me-3">
                    <textarea
                        rows={2}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        style={{
                            resize: "none",
                            width: "100%",
                            backgroundColor: "transparent",
                            color: "#fff",
                            border: "1px solid #444",
                            borderRadius: "8px",
                            padding: "8px 12px"
                        }}
                    />
                </div>
                <div className="d-flex align-items-end h-100 mt-2">
                    <Button
                        className="common_btn"
                        disabled={!newComment.trim() || submitting}
                        onClick={handleCommentSubmit}
                        style={{ border: "none" }}
                    >
                        {submitting ? <Spinner animation="border" size="sm" /> : "Add Comment"}
                    </Button>
                </div>
            </div>

            <div className="comments-list">
                {comments.length > 0 ? (
                    <>
                        {comments.map(comment => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                entityId={entityId}
                                entityModel={entityModel}
                                onReplyAdded={() => {
                                    fetchComments(1, false);
                                    setPage(1);
                                }}
                            />
                        ))}
                        {hasMore && (
                            <div className="text-center mt-4 mb-4">
                                <Button
                                    variant="outline-secondary"
                                    onClick={loadMore}
                                    style={{ borderRadius: "20px", color: "#999", borderColor: "#444" }}
                                >
                                    Load More Comments
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-muted text-center py-4">No comments yet. Be the first to comment!</p>
                )}
            </div>
            <style jsx>{`
                .comments-section textarea::placeholder,
                .comments-section :global(.form-control::placeholder) {
                    color: #777 !important;
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
