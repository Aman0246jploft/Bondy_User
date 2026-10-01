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

  // Fetch self profile if token exists
  useEffect(() => {
    const fetchUser = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        try {
          const response = await authApi.getSelfProfile();
          if (response?.status) {
            const profile = response?.data?.user;
            const isApproved = profile?.hasBeenApproved === true || profile?.isVerified === true;
            const isOrganizer = profile?.roleId === 2 || profile?.organizerVerificationStatus;
            const hasBusinessDetails = !!(
              profile?.businessName ||
              profile?.businessCategory ||
              profile?.shortDesc ||
              profile?.socialMediaLink
            );

            if (isOrganizer && !isApproved) {
              if (hasBusinessDetails) {
                if (pathname !== "/completeprofile") {
                  localStorage.removeItem("token");
                  localStorage.removeItem("userProfile");
                  setUserProfile(null);
                  return;
                }
              } else {
                if (pathname !== "/completeprofile") {
                  setUserProfile(null);
                  return;
                }
              }
            }
            setUserProfile(profile);
          }
        } catch (error) {
          console.error("Header Profile Fetch Error:", error);
        }
      } else {
        setUserProfile(null);
      }
    };

    fetchUser();
  }, [pathname]);

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
          {/* BECOME AN ORGANIZER / PORTAL */}
          {isOrganizer ? (
            <Link href="/Dashboard" className="bd-desk bd-become-organizer">
              {t("organizerSection") || "Organizer Portal"}
            </Link>
          ) : (
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
                <div className="bd-profile-dropdown">
                  <div className="bd-profile-dropdown-header">
                    <div className="bd-profile-dropdown-name">
                      {userProfile.businessName ||
                        userProfile.fullname ||
                        userProfile.firstName ||
                        "User"}
                    </div>
                    <div className="bd-profile-dropdown-role">
                      {userProfile.role || (isOrganizer ? "ORGANIZER" : "CUSTOMER")}
                    </div>
                  </div>

                  <Link
                    href={
                      isOrganizer
                        ? "/OrganizerPersonalInfo"
                        : userProfile.role === "CUSTOMER"
                        ? "/Personalinfo"
                        : "/completeprofile"
                    }
                    onClick={() => setIsProfileOpen(false)}
                  >
                    {t("profile") || "Profile"}
                  </Link>

                  {isOrganizer && (
                    <Link href="/Dashboard" onClick={() => setIsProfileOpen(false)}>
                      {t("organizerSection") || "Dashboard"}
                    </Link>
                  )}

                  <button type="button" className="logout-btn" onClick={handleLogout}>
                    {t("logout") || "Log out"}
                  </button>
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

          {isOrganizer ? (
            <Link
              href="/Dashboard"
              className="bd-mob-link highlight"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("organizerSection") || "Organizer Portal"}
            </Link>
          ) : (
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
              <Link
                href={
                  isOrganizer
                    ? "/OrganizerPersonalInfo"
                    : userProfile.role === "CUSTOMER"
                    ? "/Personalinfo"
                    : "/completeprofile"
                }
                className="bd-mob-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("profile") || "Profile"}
              </Link>
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
