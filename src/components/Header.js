"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "./LanguageSelector";

export default function BondyHeader() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  // Load user profile from localStorage immediately and sync with backend
  useEffect(() => {
    const syncProfileFromStorage = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setUserProfile(null);
        return;
      }
      const cached = localStorage.getItem("userProfile");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed) setUserProfile(parsed);
        } catch (e) {
          // ignore
        }
      }
    };

    // 1. Immediately read cache on mount
    syncProfileFromStorage();

    // 2. Fetch fresh profile in background if token exists
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      authApi
        .getSelfProfile()
        .then((response) => {
          if (response?.status && response?.data?.user) {
            const profile = response.data.user;
            // Store only essential fields to avoid localStorage QuotaExceededError
            const slim = {
              _id: profile._id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              profileImage: profile.profileImage,
              isOrganizer: profile.isOrganizer,
              isVerified: profile.isVerified,
              organizerName: profile.organizerName,
              organizerLogo: profile.organizerLogo,
            };
            try {
              localStorage.setItem("userProfile", JSON.stringify(slim));
            } catch (e) {
              // Quota exceeded – clear stale data and retry once
              try {
                localStorage.removeItem("userProfile");
                localStorage.setItem("userProfile", JSON.stringify(slim));
              } catch (_) {
                // ignore if still fails
              }
            }
            setUserProfile(profile);
          }
        })
        .catch((error) => {
          console.error("Header Profile Sync Error:", error);
        });
    }

    // 3. Listen for cross-tab or auth events
    const handleAuthChange = () => syncProfileFromStorage();
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  // On pathname change, ensure userProfile matches localStorage without resetting
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUserProfile(null);
    } else if (!userProfile) {
      const cached = localStorage.getItem("userProfile");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed) setUserProfile(parsed);
        } catch (e) {}
      }
    }
  }, [pathname, userProfile]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/Explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    setUserProfile(null);
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-change"));
    }
    router.push("/login");
  };

  const isOrganizer =
    userProfile?.role === "ORGANIZER" ||
    userProfile?.roleId === 2 ||
    userProfile?.organizerVerificationStatus;

  const isEventsActive = pathname === "/Explore" || pathname === "/Listing";
  const isCoursesActive = pathname === "/Programs-Listing" || pathname === "/programDetails";
  const isOrganizersActive = pathname === "/Organizers";

  return (
    <header className="bd-header" data-screen-label="Header">
      <div className="bd-header-inner">
        {/* LOGO */}
        <Link href="/" className="bd-logo" aria-label="Bondy">
          <img src="/img/bondy-logo.svg" alt="Bondy" />
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="bd-desk bd-nav-links">
          <Link
            href="/Explore"
            className={`bd-nav-link ${isEventsActive ? "active" : ""}`}
            data-en="Events"
          >
            {t("events") || "Events"}
          </Link>
          <Link
            href="/Programs-Listing"
            className={`bd-nav-link ${isCoursesActive ? "active" : ""}`}
            data-en="Courses"
          >
            {t("courses") || "Courses"}
          </Link>
          <Link
            href="/Organizers"
            className={`bd-nav-link ${isOrganizersActive ? "active" : ""}`}
            data-en="Organizers"
          >
            {t("organizers") || "Organizers"}
          </Link>
        </nav>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearchSubmit} className="bd-search-label" role="search">
          <svg
            className="bd-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder") || t("search") || "Search"}
            className="bd-search-input"
          />
        </form>

        {/* RIGHT SECTION */}
        <div className="bd-header-right">
          {/* BECOME AN ORGANIZER (hidden when logged in as organizer) */}
          {!isOrganizer && (
            <Link href="/register?role=organizer" className="bd-desk bd-become-organizer">
              {t("becomeAnOrganizer") || "Become an organizer"}
            </Link>
          )}

          {/* LANGUAGE SWITCHER PILL */}
          <span className="bd-desk bd-lang-wrap" style={{ display: "inline-flex" }}>
            <LanguageSelector />
          </span>

          {/* AUTH ACTIONS */}
          {userProfile ? (
            <div className="bd-profile-trigger-wrap" ref={profileRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="bd-profile-trigger"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="User Profile"
              >
                <img
                  src={getFullImageUrl(userProfile.profileImage) || "/img/default-user.png"}
                  alt="profile"
                  onError={(e) => {
                    e.target.src = "/img/default-user.png";
                  }}
                  className="bd-avatar-img"
                />
              </button>

              {isProfileOpen && (
                <div className={`bd-profile-dropdown${isOrganizer ? " is-org" : " is-user"}`}>
                  {isOrganizer ? (
                    <>
                      <Link href="/Dashboard" className="bd-menu-org" onClick={() => setIsProfileOpen(false)}>
                        {t("organizerSection")}
                      </Link>
                      <Link href="/Settings" onClick={() => setIsProfileOpen(false)}>
                        {t("settings")}
                      </Link>
                      <span className="bd-menu-rule" />
                      <button type="button" className="logout-btn" onClick={handleLogout}>
                        {t("logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/Personalinfo" onClick={() => setIsProfileOpen(false)}>
                        {t("profile")}
                      </Link>
                      <Link href="/MyTickets" onClick={() => setIsProfileOpen(false)}>
                        {t("bcOrders")}
                      </Link>
                      <Link href="/Setting" onClick={() => setIsProfileOpen(false)}>
                        {t("settings")}
                      </Link>
                      <span className="bd-menu-rule" />
                      <button type="button" className="logout-btn" onClick={handleLogout}>
                        {t("logout")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="bd-desk bd-login-link">
                {t("logIn") || "Log in"}
              </Link>
              <Link href="/register" className="bd-m-hide bd-signup-btn">
                {t("signUp") || "Sign up"}
              </Link>
            </>
          )}

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            type="button"
            className="bd-mob-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={t("menu") || "Menu"}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: "4px", pointerEvents: "none" }}>
              <span style={{ width: "16px", height: "2px", borderRadius: "2px", background: "currentColor" }}></span>
              <span style={{ width: "16px", height: "2px", borderRadius: "2px", background: "currentColor" }}></span>
              <span style={{ width: "16px", height: "2px", borderRadius: "2px", background: "currentColor" }}></span>
            </span>
          </button>
        </div>

        {/* MOBILE SLIDE-DOWN PANEL */}
        <div className={`bd-mob-panel ${isMenuOpen ? "open" : ""}`} data-mob-panel>
          <Link
            href="/Explore"
            className={`bd-mob-link ${isEventsActive ? "active highlight" : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            {t("events") || "Events"}
          </Link>
          <Link
            href="/Programs-Listing"
            className={`bd-mob-link ${isCoursesActive ? "active highlight" : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            {t("courses") || "Courses"}
          </Link>
          <Link
            href="/Organizers"
            className={`bd-mob-link ${isOrganizersActive ? "active highlight" : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            {t("organizers") || "Organizers"}
          </Link>

          {!isOrganizer && (
            <Link
              href="/register?role=organizer"
              className="bd-mob-link highlight"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("becomeAnOrganizer") || "Become an organizer"}
            </Link>
          )}

          {userProfile ? (
            <>
              {isOrganizer ? (
                <>
                  <Link href="/Dashboard" className="bd-mob-link" onClick={() => setIsMenuOpen(false)}>
                    {t("organizerSection")}
                  </Link>
                  <Link href="/Settings" className="bd-mob-link" onClick={() => setIsMenuOpen(false)}>
                    {t("settings")}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/Personalinfo" className="bd-mob-link" onClick={() => setIsMenuOpen(false)}>
                    {t("profile")}
                  </Link>
                  <Link href="/MyTickets" className="bd-mob-link" onClick={() => setIsMenuOpen(false)}>
                    {t("bcOrders")}
                  </Link>
                  <Link href="/Setting" className="bd-mob-link" onClick={() => setIsMenuOpen(false)}>
                    {t("settings")}
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="bd-mob-link"
                style={{
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  padding: 0,
                  color: "#ff6b6b",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                {t("logout") || "Log out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bd-mob-link highlight"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("logIn") || "Log in"}
              </Link>
              <Link
                href="/register"
                className="bd-mob-link accent"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("signUp") || "Sign up"}
              </Link>
            </>
          )}

          <div style={{ marginTop: "6px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
