"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import { Container } from "react-bootstrap";
import SessionCart from "@/components/SessionCart";
import VerifyDropdwons from "@/components/VerifyDropdwons";
import Footer from "@/components/Footer";
import FollowListModal from "@/components/Modal/FollowListModal";
import ReviewListModal from "@/components/Modal/ReviewListModal";
import authApi from "@/api/authApi";
import blockUserApi from "@/api/blockUser";
import reportUserApi from "@/api/reportUser";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

function ProfileContent() {
  const searchParams = useSearchParams();
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState("followers");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const userId = searchParams.get("id");
  const router = useRouter();

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null); // Logged-in user's role

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportError, setReportError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          setLoading(true);
          const response = await authApi.getUserProfileById(userId);
          if (response.status) {
            setUserProfile(response.data.user);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [userId]);

  const { t } = useLanguage();

  // Fetch logged-in user's role
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await authApi.getSelfProfile();
        if (response.status) {
          setCurrentUserRole(response.data.user.role);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (userProfile?.firstName || userProfile?.lastName) {
      document.title = `${userProfile.firstName || ''} ${userProfile.lastName || ''} | Bondy`;
    } else {
      document.title = 'Profile | Bondy';
    }
  }, [userProfile]);

  const handleFollow = async () => {
    try {
      const response = await authApi.followUser({ toUser: userId });
      if (response.status) {
        setUserProfile((prev) => ({
          ...prev,
          isFollowed: true,
          totalFollowers: (prev.totalFollowers || 0) + 1,
        }));
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async () => {
    try {
      const response = await authApi.unfollowUser({ toUser: userId });
      if (response.status) {
        setUserProfile((prev) => ({
          ...prev,
          isFollowed: false,
          totalFollowers: Math.max((prev.totalFollowers || 0) - 1, 0),
        }));
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", backgroundColor: "#000", color: "#fff" }}
      >
        {t("loadingProfile")}
      </div>
    );
  }

  if (!userProfile && !loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", backgroundColor: "#000", color: "#fff" }}
      >
        {t("userNotFound")}
      </div>
    );
  }

  const handleAction = (type) => {
    setActionType(type);
    setShowMenu(false);

    if (type === "report") {
      setShowReportModal(true);
    } else {
      setShowConfirm(true);
    }
  };

  const handleConfirm = async () => {
    try {
      if (actionType === "block") {
        const res = await blockUserApi.blockUser({ toUser: userId });
        setShowConfirm(false);
        if (res.status === true) {
          toast.success(res.message);
        } else {
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReportSubmit = async () => {
    const reason = reportReason.trim();
    const description = reportDescription.trim();

    if (!reason) {
      setReportError("Reason is required");
      return;
    }
    setReportError("");
    try {
      const res = await reportUserApi.reportUser({
        toUser: userId,
        reason,
        description,
      });

      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
      if (res.status === true) {
        toast.success(res.message);
      } else {
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Header />
      <div className="profile-page">
        <div className="profile_cover">
          <img
            src="/img/sidebar-logo.svg"
            alt="Background"
            className="banner-img"
          />
        </div>

        <Container>
          <div className="profile-content-wrapper">
            <div className="row align-items-start">
              <div className="col-auto">
                <div className="profile-image-box">
                  <img
                    src={
                      userProfile?.profileImage
                        ? userProfile.profileImage
                        : "/img/sidebar-logo.svg"
                    }
                    alt={userProfile?.firstName}
                    className="object-fit-cover"
                    style={{ width: "100%", height: "100%" }}
                    onError={(e) => (e.target.src = "/img/sidebar-logo.svg")}
                  />
                </div>
              </div>

              <div className="col">
                <div className="user_profile_content">
                  <div
                    style={{
                      position: "absolute",
                      right: "-20px",
                      top: "10px",
                    }}
                  >
                    {!userProfile?.isMyProfile && (
                      <>
                        <div
                          onClick={() => setShowMenu(!showMenu)}
                          style={{
                            cursor: "pointer",
                            fontSize: "20px",
                            color: "#fff",
                          }}
                        >
                          ⋮
                        </div>

                        {showMenu && (
                          <div className="menu_dropdown">
                              <div onClick={() => handleAction("block")}>
                                {t("block")}
                              </div>
                              <div onClick={() => handleAction("report")}>
                                {t("report")}
                              </div>
                            </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="user-info">
                    <h2 className="user-name">
                      {userProfile?.firstName} {userProfile?.lastName}
                      <span className="verified-badge">
                        {userProfile?.organizerVerificationStatus ===
                          "approved" && <VerifyDropdwons />}
                      </span>
                    </h2>
                    <p className="designation">
                      {userProfile?.role === "ORGANIZER"
                        ? t("eventOrganizer")
                        : t("userRole")}
                    </p>
                    <div className="stats-row">
                      {userProfile?.role === "ORGANIZER" && (
                        <span className="me-3">
                          {" "}
                          <img src="/img/event_icon_01.svg" />
                          {userProfile?.totalEventsHosted || 0} {t("eventsHosted")}
                        </span>
                      )}
                      {userProfile?.role !== "CUSTOMER" && (
                        <span
                          className="me-3"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setFollowModalType("followers");
                            setShowFollowModal(true);
                          }}
                        >
                          <img src="/img/user_icon.svg" alt="followers" />{" "}
                          {userProfile?.totalFollowers || 0} {t("followers")}
                        </span>
                      )}
                      {userProfile?.isMyProfile && (
                        <span
                          className="me-3"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setFollowModalType("following");
                            setShowFollowModal(true);
                          }}
                        >
                          <img src="/img/user_icon.svg" alt="following" />{" "}
                          {userProfile?.totalFollowing || 0} {t("following")}
                        </span>
                      )}
                      {userProfile?.role === "ORGANIZER" && (
                        <span
                          style={{ cursor: "pointer" }}
                          onClick={() => setShowReviewModal(true)}
                        >
                          <img src="/img/star-icon.svg" alt="star" />{" "}
                          {userProfile?.averageRating || 0}/5 {t("rating")} (
                          {userProfile?.reviewCount || 0})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="action-buttons">
                    {userProfile?.role === "ORGANIZER" &&
                      !userProfile?.isFollowed &&
                      !userProfile?.isMyProfile && (
                        <button className="btn-follow" onClick={handleFollow}>
                          <img src="/img/User_plus.svg" /> {t("follow")}
                        </button>
                      )}

                    {userProfile?.role === "ORGANIZER" &&
                      userProfile?.isFollowed &&
                      !userProfile?.isMyProfile && (
                        <button className="btn-follow" onClick={handleUnfollow}>
                          <img src="/img/User_plus.svg" /> {t("followed")}
                        </button>
                      )}

                    {!userProfile?.isMyProfile && (
                        <button
                        className="btn-message"
                        onClick={() => {
                          console.log("User Profile State:", userProfile);
                          console.log("Current User Role:", currentUserRole);

                          // Route based on LOGGED-IN user's role, not the profile being viewed
                          if (currentUserRole === "ORGANIZER") {
                            router.push(`/Message?userId=${userId}`);
                          } else {
                            router.push(`/Messagee?userId=${userId}`);
                          }
                        }}
                        >
                        <img src="/img/message.svg" /> {t("messages")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Statistics */}

                <div className="about-section mt-4">
                  <h4 className="about-title">{t("aboutMe")}</h4>
                  <p className="about-text">
                    {userProfile?.bio || t("noBioAvailable")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <div className="new_session_sec">
        <Container>
          <div>
            <Tab.Container id="left-tabs-example" defaultActiveKey="first">
              <Row>
                {/* <Col sm={12}>
                  <Nav variant="pills">
                    <Nav.Item>
                      <Nav.Link eventKey="first">Concert</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="second">Music</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="Third">Art</Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col> */}
                {userProfile?.role === "ORGANIZER" && (
                  <Col sm={12}>
                    <Tab.Content>
                      <Tab.Pane eventKey="first">
                        <SessionCart
                          title={t("nextSession")}
                          events={userProfile?.events?.upcoming_events}
                        />
                        <SessionCart
                          title={t("pastSessions")}
                          events={userProfile?.events?.previous_events}
                        />
                      </Tab.Pane>
                    </Tab.Content>
                  </Col>
                )}
              </Row>
            </Tab.Container>
          </div>
        </Container>
      </div>
      {showConfirm && (
        <div className="confirm_modal">
          <div className="confirm_box">
            <h4>
              {actionType === "block"
                ? t("confirmBlockUser")
                : t("confirmReportUser")}
            </h4>

            <p style={{ fontSize: "13px", color: "#aaa" }}>
              {actionType === "block"}
            </p>

            <div className="btns">
              <button
                onClick={() => setShowConfirm(false)}
                style={{ background: "#444", color: "#fff" }}
              >
                {t("cancel")}
              </button>

              <button
                onClick={handleConfirm}
                style={{
                  background: actionType === "block" ? "#e74c3c" : "#1abc9c",
                  color: "#fff",
                }}
              >
                {t("yes")}, {t(actionType)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="confirm_modal">
          <div className="confirm_box">
            <h4>{t("reportUser")}</h4>

            <input
              type="text"
              placeholder={t("enterReasonPlaceholder")}
              value={reportReason}
              onChange={(e) => {
                setReportReason(e.target.value);
                setReportError("");
              }}
              className="report_input"
            />

            {reportError && (
              <p
                style={{ color: "#e74c3c", fontSize: "12px", marginTop: "5px" }}
              >
                {reportError}
              </p>
            )}

            <textarea
              placeholder={t("descriptionPlaceholder")}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              className="report_input"
            />

            <div className="btns">
              <button
                onClick={() => setShowReportModal(false)}
                style={{ background: "#444", color: "#fff" }}
              >
                {t("cancel")}
              </button>

              <button
                onClick={handleReportSubmit}
                style={{ background: "#1abc9c", color: "#fff" }}
              >
                {t("submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <FollowListModal
        show={showFollowModal}
        onHide={() => setShowFollowModal(false)}
        userId={userId}
        type={followModalType}
      />
      <ReviewListModal
        show={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        entityId={userId}
        entityModel="User"
      />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
