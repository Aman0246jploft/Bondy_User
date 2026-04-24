"use client";
import React, { useEffect, useState } from "react";
import { Col, Row, Form } from "react-bootstrap";
import TicketDistributionChart from "../Components/TicketDistributionChart";
import GenderRatioChart from "../Components/GenderRatioChart";
import Link from "next/link";
import organizerApi from "../../../api/organizerApi";
import { useLanguage } from "@/context/LanguageContext";
import apiClient from "../../../api/apiClient";
import eventApi from "../../../api/eventApi";
import notificationApi from "../../../api/notificationApi";
import { getFullImageUrl } from "../../../utils/imageHelper";
import { formatTime } from "../../../utils/timeHelper";

function page() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    totalDraftEvents: 0,
    totalPendingEvents: 0,
    totalLiveEvents: 0,
    totalCompletedEvents: 0,
    totalTicketsSold: 0,
    netRevenue: 0,
    totalAttendees: 0,
  });
  const [userData, setUserData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("none");

  const fetchDashboardStats = async () => {
    try {
      const response = await organizerApi.getDashboardData();
      console.log("response122", response)

      if (response && response.status === true) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get("/user/selfProfile");
      if (res.data && res.data.user) {
        const profile = res.data.user;
        setUserData(profile);
        setStatus(profile.organizerVerificationStatus || "none");
      }
    } catch (error) {
      console.error("Error fetching profile", error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const response = await eventApi.getOrganizerEvents({ status: "Upcoming", limit: 4 });
      if (response && response.status === true) {
        setUpcomingEvents(response.data.events);
      }
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await organizerApi.getAnalyticsStats();
      if (response && response.status === true) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error("Error fetching analytics stats:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getMyNotifications({ pageNo: 1, limit: 5 });
      if (response?.status || response?.status === "SUCCESS") {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { weekday: "short", day: "2-digit", month: "short" };
    return date.toLocaleDateString("en-US", options);
  };

  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchProfile();
    fetchUpcomingEvents();
    fetchAnalytics();
    fetchNotifications();
    document.title = "Dashboard Organizer - Bondy";
  }, []);

  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">{t("dashboard")}</h2>
            <p className="card-desc">
              {t("heyUser")}, {userData?.firstName || ""}! {t("welcomeBackSnapshot") || "Welcome back! Here's a snapshot of your events and tasks."}
            </p>
          </div>
        </div>
        <div className="dashbord-card-grid">
          <div className="dashboard-counter">
            <h5>{t("Total Events Hosted") || "Total Events Hosted"}</h5>
            <span className="counter">{userData?.totalEventsHosted || 0}</span>
          </div>

          <div className="dashboard-counter">
            <h5>{t("totalCourses") || "Total Courses"}</h5>
            <span className="counter pending">{userData?.totalCoursesAdded || 0}</span>
          </div>

          <div className="dashboard-counter">
            <h5>{t("upcomingEventsCount") || "Upcoming Events"}</h5>
            <span className="counter live">{userData?.totalUpcomingEvents || 0}</span>
          </div>

          <div className="dashboard-counter">
            <h5>{t("totalTickets")}</h5>
            <span className="counter live">{userData?.totalTicketSold || 0}</span>
          </div>
          <div className="dashboard-counter">
            <h5>{t("completedEvents")}</h5>
            <span className="counter completed">{stats.totalCompletedEvents || 0}</span>
          </div>
        </div>
        <Row>
          <Col sm={12} md={4}>
            <div className="card-varticl mb-3">
              <span>{t("netRevenue")}</span>
              <h3>₮{(Number(userData?.netEarningEvents || 0) + Number(userData?.netEarningCourses || 0)).toFixed(2)}</h3>
            </div>
            <div className="card-varticl mb-3">
              <span>{t("totalTicketsSold")}</span>
              <h3>{userData?.totalTicketSold || 0}</h3>
            </div>
            <div className="card-varticl mb-3">
              <span>{t("Total Bookings") || "Total Bookings"}</span>
              <h3>{analyticsData?.performance?.totalBookings || 0}</h3>
            </div>
          </Col>
          <Col md={8} sm={12}>
            <div className="analytics-chart">
              <h4 className="mb-2">{t("recentNotifications") || "Recent Notifications"}</h4>
              {notifications && notifications.length > 0 ? (
                notifications.map((item) => (
                  <div className="card-varticl-attention mb-2" key={item._id}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.message}</p>
                    </div>
                    <div>
                      <span className={`status-badge ${item.isRead ? "complete" : "pending"}`}>
                        {item.isRead ? t("read") || "Read" : t("new") || "New"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 opacity-50">
                  <p>{t("noNotifications") || "No recent notifications."}</p>
                </div>
              )}
            </div>
          </Col>
        </Row>
        <div className="recomanded-head">
          <h5>{t("upcoming")}</h5>
          <Link href="/EventsManagement">{t("seeAll")}</Link>
        </div>
        <div className="ticket-listing">
          {upcomingEvents && upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div className="ticket-cards" key={event._id}>
                <div className="ticket-inner">
                  <div className="ticket-lft">
                    {/* <Form.Check /> */}
                    <div className="event-info-box-img">
                      <img
                        src={getFullImageUrl(event.posterImage?.[0]) || "/img/sidebar-logo.svg"}
                        alt={event.eventTitle}
                        onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
                      />
                      <div>
                        <h5>{truncate(event.eventTitle, 25)}</h5>
                        <p className="ref">{event.eventCategory?.name || t("sports")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ticket-rgt">
                    <p>
                      {t("venue")} <span>{truncate(event.venueName, 25)}</span>
                    </p>
                  </div>
                </div>
                <div className="ticket-bottom">
                  <p>
                    {t("createDate")} <span>{formatDate(event.startDate)}</span>{" "}
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="4"
                        height="4"
                        viewBox="0 0 4 4"
                        fill="none">
                        <circle cx="2" cy="2" r="2" fill="#999999" />
                      </svg>
                    </span>{" "}
                    <span>{event.startTime}</span>
                                      <span>{formatTime(event.startTime, true, language)}</span>
                  </p>
                  <p>
                    {t("totalBookingRevenue")} <span>₮{event.totalRevenue || 0}</span>
                  </p>
                  <p>
                    <span>
                      <img src="/img/ticket-white.svg" />
                    </span>{" "}
                    <span>{(event.totalTickets || 0) - (event.ticketQtyAvailable || 0)} {t("ticketsSuffix")}</span>
                  </p>
                  <Link href={`/EventDetailOrganiser?eventId=${event._id}`}>
                    {t("info") || "Info"} <img src="/img/Arrow-Right.svg" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="no-events-found p-4 text-center">
              <p>{t("noUpcomingEvents") || "No upcoming events found."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default page;
