"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import { Container } from "react-bootstrap";
import SessionCart from "@/components/SessionCart";
import VerifyDropdwons from "@/components/VerifyDropdwons";
import Footer from "@/components/Footer";
import GiveRating from "@/components/Modal/GiveRating";
import authApi from "@/api/authApi";

export default function page() {
  const [modalShow, setModalShow] = useState(false);
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          setLoading(true);
          const response = await authApi.getUserProfileById(userId);
          if (response.status) {
            setUserProfile(response.data.profile);
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
        Loading profile...
      </div>
    );
  }

  if (!userProfile && !loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", backgroundColor: "#000", color: "#fff" }}
      >
        User not found
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="profile-page">
        <div className="profile_cover">
          <img
            src="/img/profile_cover.png"
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
                        : "/img/default-user.png"
                    }
                    alt={userProfile?.firstName}
                    className="object-fit-cover"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>

              <div className="col">
                <div className="user_profile_content">
                  <div className="user-info">
                    <h2 className="user-name">
                      {userProfile?.firstName} {userProfile?.lastName}
                      <span className="verified-badge">
                        {userProfile?.organizerVerificationStatus ===
                          "approved" && <VerifyDropdwons />}
                      </span>
                    </h2>
                    <p className="designation">
                      {userProfile?.role === "ORGANISER"
                        ? "Event Organizer"
                        : "User"}
                    </p>
                    <div className="stats-row">
                      {userProfile?.role === "ORGANISER" && (
                        <span className="me-3">
                          {" "}
                          <img src="/img/event_icon_01.svg" />
                          {userProfile?.totalEventsHosted || 0} Events Hosted
                        </span>
                      )}
                      <span className="me-3">
                        <img src="/img/user_icon.svg" />{" "}
                        {userProfile?.totalFollowers || 0} Followers
                      </span>
                      {/* <span>
                        <img src="/img/star-icon.svg" /> 4/5 Rating
                      </span> */}
                    </div>
                  </div>

                  <div className="action-buttons">
                    {/* <button
                      className="btn-message"
                      onClick={() => setModalShow(true)}>
                      <img src="/img/star-icon.svg" /> Give Rating
                    </button> */}
                    {userProfile?.role === "ORGANISER" &&
                      !userProfile?.isFollowed &&
                      !userProfile?.isMyProfile && (
                        <button className="btn-follow" onClick={handleFollow}>
                          <img src="/img/User_plus.svg" /> Follow
                        </button>
                      )}

                    {userProfile?.role === "ORGANISER" &&
                      userProfile?.isFollowed &&
                      !userProfile?.isMyProfile && (
                        <button className="btn-follow" onClick={handleUnfollow}>
                          <img src="/img/User_plus.svg" /> Followed
                        </button>
                      )}

                    <button className="btn-message">
                      <img src="/img/message.svg" /> Messages
                    </button>
                  </div>
                </div>

                {/* Statistics */}

                <div className="about-section mt-4">
                  <h4 className="about-title">About me</h4>
                  <p className="about-text">
                    {userProfile?.bio || "No bio available."}
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
                {userProfile?.role === "ORGANISER" && (
                  <Col sm={12}>
                    <Tab.Content>
                      <Tab.Pane eventKey="first">
                        <SessionCart
                          title="Next Session"
                          events={userProfile?.events?.next}
                        />
                        <SessionCart
                          title="Past Sessions"
                          events={userProfile?.events?.past}
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

      <Footer />
      <GiveRating show={modalShow} onHide={() => setModalShow(false)} />
    </>
  );
}
