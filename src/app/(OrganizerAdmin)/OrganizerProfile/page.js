"use client";

import React, { useState, useEffect } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  User,
  Calendar,
  Edit3,
  Ticket,
  BookOpen,
  Bookmark,
  Settings,
  ChevronRight,
  CreditCard,
  Globe,
  Bell,
  CheckCircle,
  Shield,
  HelpCircle,
  AlertTriangle,
  FileText,
  LogOut
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "../../../utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function OrganizerProfileContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
    document.title = "Organizer Profile - Bondy";
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/user/selfProfile");
      if (res?.data?.status && res?.data?.data?.user) {
        setProfile(res.data.data.user);
      } else if (res?.data?.user) {
        setProfile(res.data.user);
      }
    } catch (error) {
      console.error("Error fetching selfProfile:", error);
      toast.error(t("failedToLoadProfile") || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    toast.success(t("loggedOutSuccessfully") || "Logged out successfully");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-teal" role="status" style={{ color: "#23ada4" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="cards text-center py-5">
        <h4 className="text-white mb-3">{t("noProfileData") || "No profile data found"}</h4>
        <button className="custom-btn" onClick={fetchProfile}>
          {t("retry") || "Retry"}
        </button>
      </div>
    );
  }

  // Format date to "Organizer since Month Year"
  const getJoinedDate = (dateString) => {
    if (!dateString) return "Jan 2025";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return "Jan 2025";
    }
  };

  const isVerified = profile.isVerified || profile.isAllVerified;

  return (
    <div className="cards profile-dashboard-container">
      {/* Header Profile Section */}
      <div className="profile-header-card mb-4">
        <div className="profile-header-main">
          <div className="profile-avatar-container">
            <img
              src={getFullImageUrl(profile.profileImage) || "/img/default-user.png"}
              alt="Avatar"
              className="profile-avatar-img"
              onError={(e) => { e.target.src = "/img/default-user.png"; }}
            />
            {isVerified && (
              <span className="verified-badge-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#23ada4" />
                </svg>
              </span>
            )}
          </div>
          <div className="profile-info-details">
            <div className="profile-name-row">
              <h3>{`${profile.firstName || ""} ${profile.lastName || ""}`}</h3>
              {isVerified && <span className="badge bg-teal-soft ms-2">{t("verifiedOrganizer") || "Verified Organizer"}</span>}
            </div>
            <p className="joined-date-text">
              <Calendar size={15} className="me-2 text-teal" />
              {t("organizerSince") || "Organizer since"} {getJoinedDate(profile.createdAt)}
            </p>
          </div>
        </div>

        <Link href="/OrganizerPersonalInfo" className="edit-profile-action-btn">
          <Edit3 size={15} className="me-2" />
          <span>{t("editProfile") || "Edit Profile"}</span>
        </Link>
      </div>

      {/* Quick Actions Grid */}
      {/* <div className="quick-actions-grid mb-4">
        <Row className="g-3">
          <Col xs={6} md={3}>
            <Link href="/EventsManagement" className="quick-action-card">
              <div className="quick-card-icon-box">
                <Ticket size={22} className="text-teal" />
              </div>
              <span>{t("events") || "Events"}</span>
            </Link>
          </Col>
          <Col xs={6} md={3}>
            <Link href="/CoursesManagement" className="quick-action-card">
              <div className="quick-card-icon-box">
                <BookOpen size={22} className="text-teal" />
              </div>
              <span>{t("course") || "Course"}</span>
            </Link>
          </Col>
          <Col xs={6} md={3}>
            <Link href="/EventsManagement" className="quick-action-card">
              <div className="quick-card-icon-box">
                <Bookmark size={22} className="text-teal" />
              </div>
              <span>{t("saved") || "Saved"}</span>
            </Link>
          </Col>
          <Col xs={6} md={3}>
            <Link href="/Settings" className="quick-action-card">
              <div className="quick-card-icon-box">
                <Settings size={22} className="text-teal" />
              </div>
              <span>{t("settings") || "Settings"}</span>
            </Link>
          </Col>
        </Row>
      </div> */}

      {/* Account Section */}
      <div className="profile-menu-section mb-4">
        <h5 className="section-title">{t("account") || "Account"}</h5>
        <div className="profile-menu-list">
          <Link href="/MyTicketsOrganiser" className="profile-menu-item">
            <div className="menu-item-left">
              <Ticket size={18} className="menu-icon" />
              <span>{t("myBookings") || "My Bookings"}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </Link>

          <Link href="/Earnings" className="profile-menu-item">
            <div className="menu-item-left">
              <CreditCard size={18} className="menu-icon" />
              <span>{t("payments") || "Payments"}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </Link>

          {/* <div className="profile-menu-item no-link">
            <div className="menu-item-left">
              <Globe size={18} className="menu-icon" />
              <span>{t("language") || "Language"}</span>
            </div>
            <div className="menu-item-right">
              <span className="me-2 text-muted-custom">English</span>
              <ChevronRight size={18} className="menu-arrow" />
            </div>
          </div> */}

          {/* <Link href="/Notifications" className="profile-menu-item">
            <div className="menu-item-left">
              <Bell size={18} className="menu-icon" />
              <span>{t("notifications") || "Notifications"}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </Link> */}

          <Link href="/Verifiedprofile" className="profile-menu-item">
            <div className="menu-item-left">
              <CheckCircle size={18} className="menu-icon" />
              <span>{t("organizerVerification") || "Organizer Verification"}</span>
            </div>
            <div className="menu-item-right">
              <span className={`badge-custom me-2 ${profile.organizerVerificationStatus === 'approved'
                ? 'bg-success-soft'
                : profile.organizerVerificationStatus === 'pending'
                  ? 'bg-warning-soft'
                  : profile.organizerVerificationStatus === 'rejected'
                    ? 'bg-danger-soft'
                    : 'bg-secondary-soft'
                }`}>
                {profile.organizerVerificationStatus || "unverified"}
              </span>
              <ChevronRight size={18} className="menu-arrow" />
            </div>
          </Link>

          {/* <Link href="/Settings" className="profile-menu-item">
            <div className="menu-item-left">
              <Shield size={18} className="menu-icon" />
              <span>{t("security") || "Security"}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </Link> */}
        </div>
      </div>

      {/* Support Section
      <div className="profile-menu-section mb-4">
        <h5 className="section-title">{t("support") || "Support"}</h5>
        <div className="profile-menu-list">
          <Link href="/SupportTickets" className="profile-menu-item">
            <div className="menu-item-left">
              <HelpCircle size={18} className="menu-icon" />
              <span>{t("helpCenter") || "Help center"}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </Link>

          <Link href="/SupportTickets" className="profile-menu-item">
            <div className="menu-item-left">
              <AlertTriangle size={18} className="menu-icon" />
              <span>{t("reportProblem") || "Report a problem"}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </Link>
        </div>
      </div> */}

      {/* Legal Section */}
      <div className="profile-menu-section mb-4">
        <h5 className="section-title">{t("legal") || "Legal"}</h5>
        <div className="profile-menu-list">
          <Link href="/SupportTickets" className="profile-menu-item">
            <div className="menu-item-left">
              <FileText size={18} className="menu-icon" />
              <span>{t("terms") || "Terms"}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </Link>

          <Link href="/SupportTickets" className="profile-menu-item">
            <div className="menu-item-left">
              <FileText size={18} className="menu-icon" />
              <span>{t("privacyPolicy") || "Privacy policy"}</span>
            </div>
            <ChevronRight size={18} className="menu-arrow" />
          </Link>
        </div>
      </div>

      {/* Log out Action */}
      <div className="text-center mt-5">
        <button className="logout-action-btn" onClick={handleLogout}>
          <LogOut size={18} className="me-2" />
          <span>{t("logout") || "Log out"}</span>
        </button>
      </div>

      {/* Premium styles matching global dashboard styling */}
      <style jsx>{`
        .profile-dashboard-container {
          color: #fff;
        }

        .profile-header-card {
          background-color: #262626;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .profile-header-main {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .profile-avatar-container {
          position: relative;
          width: 84px;
          height: 84px;
        }

        .profile-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #23ada4;
          box-shadow: 0 4px 12px rgba(35, 173, 164, 0.25);
        }

        .verified-badge-icon {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background-color: #1a1a1a;
          border-radius: 50%;
          padding: 3px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-info-details h3 {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          color: #fff;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
        }

        .bg-teal-soft {
          background-color: rgba(35, 173, 164, 0.12);
          color: #23ada4;
          font-size: 11px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 30px;
          border: 1px solid rgba(35, 173, 164, 0.25);
          display: inline-flex;
          align-items: center;
        }

        .joined-date-text {
          font-size: 13.5px;
          color: #9ca3af;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .edit-profile-action-btn {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--primary-teal);
          background: linear-gradient(160deg, #23ada4 -2.4%, #23ada4 112.98%);
          color: var(--white);
          padding: 10px 20px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .edit-profile-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(35, 173, 164, 0.4);
          color: var(--white);
        }

        .quick-actions-grid {
          margin-top: 15px;
        }

        .quick-action-card {
          background-color: #262626;
          border-radius: 16px;
          padding: 18px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-decoration: none;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.3s ease;
        }

        .quick-action-card:hover {
          background-color: #2b2b2b;
          transform: translateY(-4px);
          border-color: rgba(35, 173, 164, 0.4);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
        }

        .quick-card-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(35, 173, 164, 0.08);
          border: 1px solid rgba(35, 173, 164, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .quick-action-card:hover .quick-card-icon-box {
          background-color: rgba(35, 173, 164, 0.16);
          transform: scale(1.05);
        }

        .quick-action-card span {
          font-size: 13.5px;
          font-weight: 600;
        }

        .profile-menu-section {
          margin-top: 25px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
          padding-left: 4px;
        }

        .profile-menu-list {
          background-color: #262626;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .profile-menu-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          color: #fff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: background-color 0.2s ease, padding-left 0.2s ease;
          cursor: pointer;
        }

        .profile-menu-item:last-child {
          border-bottom: none;
        }

        .profile-menu-item:hover {
          background-color: #2d2d2d;
          color: #fff;
          padding-left: 28px;
        }

        .profile-menu-item.no-link {
          cursor: default;
        }

        .profile-menu-item.no-link:hover {
          background-color: transparent;
          padding-left: 24px;
        }

        .menu-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .menu-icon {
          color: #23ada4;
        }

        .menu-arrow {
          color: #6b7280;
        }

        .text-muted-custom {
          color: #6b7280;
          font-size: 14px;
        }

        .badge-custom {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 30px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .bg-success-soft {
          background-color: rgba(46, 204, 113, 0.12);
          color: #2ecc71;
          border: 1px solid rgba(46, 204, 113, 0.2);
        }

        .bg-warning-soft {
          background-color: rgba(241, 196, 15, 0.12);
          color: #f1c40f;
          border: 1px solid rgba(241, 196, 15, 0.2);
        }

        .bg-danger-soft {
          background-color: rgba(231, 76, 60, 0.12);
          color: #e74c3c;
          border: 1px solid rgba(231, 76, 60, 0.2);
        }

        .bg-secondary-soft {
          background-color: rgba(156, 163, 175, 0.12);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.2);
        }

        .logout-action-btn {
          display: inline-flex;
          align-items: center;
          color: #ef4444;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.2s ease;
          border: none;
          background: transparent;
        }

        .logout-action-btn:hover {
          color: #f87171;
          transform: translateY(-1px);
        }

        .text-teal {
          color: #23ada4 !important;
        }
      `}</style>
    </div>
  );
}

export default function OrganizerProfilePage() {
  return (
    <ProtectedRoute>
      <OrganizerProfileContent />
    </ProtectedRoute>
  );
}
