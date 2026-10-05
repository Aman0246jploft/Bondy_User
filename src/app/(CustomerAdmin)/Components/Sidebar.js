"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/context/SocketContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import authApi from "@/api/authApi";

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
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
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.email || "Customer"
    : "Customer";

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`bd-side bd-scroll ${mobileOpen ? "open" : ""}`} aria-label="Account Navigation">
      {/* Profile Mini Header */}
      <div className="bd-side-head">
        <img
          src={profile?.profileImage ? getFullImageUrl(profile.profileImage) : "/img/default-user.png"}
          alt={displayName}
          className="bd-side-avatar"
          onError={(e) => {
            e.currentTarget.src = "/img/default-user.png";
          }}
        />
        <div className="bd-side-head-meta">
          <b className="bd-side-name" title={displayName}>
            {displayName}
          </b>
          <span className="bd-side-role-badge">CUSTOMER</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="bd-side-nav">
        <Link
          href="/Personalinfo"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/Personalinfo") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span>{t("personalInfo") || "Personal Info"}</span>
        </Link>

        <Link
          href="/MyTickets"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/MyTickets") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
          </span>
          <span>{t("tickets") || "My Tickets"}</span>
        </Link>

        <Link
          href="/Messagee"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/Messagee") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span>{t("messages") || "Messages"}</span>
        </Link>

        <Link
          href="/MyFavorite"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/MyFavorite") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
          <span>{t("myFavorite") || "Saved & Favorites"}</span>
        </Link>

        <span className="bd-side-rule" />

        <Link
          href="/Security"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/Security") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <span>{t("security") || "Security"}</span>
        </Link>

        <Link
          href="/Setting"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/Setting") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span>{t("settings") || "Settings"}</span>
        </Link>

        <Link
          href="/Notification"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/Notification") ? "active" : ""}`}
        >
          <span className="icon" style={{ position: "relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span>{t("notification") || "Notifications"}</span>
          {unreadNotificationCount > 0 && (
            <span className="bd-badge-count">
              {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
            </span>
          )}
        </Link>

        <Link
          href="/CustomerReferral"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/CustomerReferral") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </span>
          <span>{t("referral") || "Referrals & Invites"}</span>
        </Link>

        <Link
          href="/SupportTicketsC"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/SupportTicketsC") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <span>{t("supportTickets") || "Support & Help"}</span>
        </Link>

        <Link
          href="/ChangePassword"
          onClick={handleLinkClick}
          className={`bd-side-link ${isActive("/ChangePassword") ? "active" : ""}`}
        >
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <span>{t("changePassword") || "Password"}</span>
        </Link>

        <button type="button" className="bd-side-link bd-side-logout" onClick={handleLogout}>
          <span className="icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span>{t("logout") || "Log out"}</span>
        </button>
      </nav>
    </aside>
  );
}
