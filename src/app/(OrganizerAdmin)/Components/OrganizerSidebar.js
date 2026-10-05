"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/context/SocketContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import authApi from "@/api/authApi";

export default function OrganizerSidebar({ toggleSidebar }) {
  const { t } = useLanguage();
  const { unreadNotificationCount } = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("userProfile");
        if (u) return JSON.parse(u);
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authApi.getSelfProfile();
        if (res?.status && res?.data?.user) {
          setProfile(res.data.user);
          localStorage.setItem("userProfile", JSON.stringify(res.data.user));
        }
      } catch (err) {}
    };
    fetchUser();
  }, [pathname]);

  const isActive = (path) => pathname === path;

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    toast.success(t("loggedOutSuccessfully") || "Logged out successfully");
    router.push("/login");
  };

  const displayName = profile
    ? profile.businessName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.email || "Organizer"
    : "Organizer";

  return (
    <aside className="customer-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="logo">
          <Link href="/">
            <img
              src="/img/bondy-logo.svg"
              alt="Bondy"
              className="logo-image"
              style={{ height: 26, width: "auto" }}
            />
          </Link>
        </div>

        <button className="toggle-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* User Mini Profile Card */}
      <div className="bd-side-user-card">
        <img
          src={profile?.profileImage ? getFullImageUrl(profile.profileImage) : "/img/default-user.png"}
          alt={displayName}
          className="bd-side-avatar"
          onError={(e) => { e.currentTarget.src = "/img/default-user.png"; }}
        />
        <div className="bd-side-user-meta">
          <span className="bd-side-user-name" title={displayName}>
            {displayName}
          </span>
          <span className="bd-side-user-role" style={{ color: "var(--acc-bright, #2dd4bf)" }}>
            ORGANIZER
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-menu">
        <Link
          href="/OrganizerPersonalInfo"
          className={`menu-item ${isActive("/OrganizerPersonalInfo") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
          <span className="text">{t("personalInfo") || "Organizer Profile"}</span>
        </Link>

        <Link
          href="/Dashboard"
          className={`menu-item ${isActive("/Dashboard") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
          </span>
          <span className="text">{t("dashboard") || "Dashboard"}</span>
        </Link>

        <Link
          href="/EventsManagement"
          className={`menu-item ${isActive("/EventsManagement") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
          <span className="text">{t("eventsManagement") || "Events"}</span>
        </Link>

        <Link
          href="/CoursesManagement"
          className={`menu-item ${isActive("/CoursesManagement") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </span>
          <span className="text">{t("coursesManagement") || "Courses"}</span>
        </Link>

        <Link
          href="/Analytics"
          className={`menu-item ${isActive("/Analytics") || isActive("/Analytic") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </span>
          <span className="text">{t("analytics") || "Analytics"}</span>
        </Link>

        <Link
          href="/Earnings"
          className={`menu-item ${isActive("/Earnings") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </span>
          <span className="text">{t("earnings") || "Earnings & Payout"}</span>
        </Link>

        <Link
          href="/MyTicketsOrganiser"
          className={`menu-item ${isActive("/MyTicketsOrganiser") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path>
              <path d="M13 5v2"></path>
              <path d="M13 17v2"></path>
            </svg>
          </span>
          <span className="text">{t("tickets") || "Ticket Sales"}</span>
        </Link>

        <Link
          href="/Promotions"
          className={`menu-item ${isActive("/Promotions") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </span>
          <span className="text">{t("promotions") || "Promotions"}</span>
        </Link>

        <Link
          href="/Staff"
          className={`menu-item ${isActive("/Staff") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </span>
          <span className="text">{t("staff") || "Team Staff"}</span>
        </Link>

        <Link
          href="/SubscriptionBilling"
          className={`menu-item ${isActive("/SubscriptionBilling") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          </span>
          <span className="text">{t("subscription") || "Billing & Plan"}</span>
        </Link>

        <Link
          href="/SupportTickets"
          className={`menu-item ${isActive("/SupportTickets") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </span>
          <span className="text">{t("supportTickets") || "Help & Support"}</span>
        </Link>

        {/* Divider rule */}
        <div className="bd-side-divider" />

        <Link
          href="/Notifications"
          className={`menu-item ${isActive("/Notifications") ? "active" : ""}`}
        >
          <span className="icon" style={{ position: "relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadNotificationCount > 0 && (
              <span className="bd-badge-count">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </span>
          <span className="text">{t("notification") || "Notifications"}</span>
        </Link>
      </nav>

      {/* Footer Items */}
      <div className="sidebar-footer">
        <Link href="/Settings" className={`menu-item ${isActive("/Settings") ? "active" : ""}`}>
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </span>
          <span className="text">{t("settings") || "Settings"}</span>
        </Link>

        <Link
          href="/OrganizerChangePassword"
          className={`menu-item ${isActive("/OrganizerChangePassword") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </span>
          <span className="text">{t("changePassword") || "Password"}</span>
        </Link>

        <button type="button" className="menu-item bd-logout-btn" onClick={handleLogout}>
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span className="text">{t("logout") || "Log out"}</span>
        </button>
      </div>
    </aside>
  );
}
