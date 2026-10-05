"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/context/SocketContext";

function CustomerHeader() {
  const { t, language } = useLanguage();
  const { unreadNotificationCount } = useSocket();
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getSelfProfile();
        if (response?.status && response?.data?.user) {
          setProfile(response.data.user);
        }
      } catch (error) {
        console.error("Failed to fetch profile in CustomerHeader:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/Explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="topbar">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="topbar-search">
        <span className="search-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input
          type="text"
          className="form-control"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchPlaceholder") || (language === "en" ? "Search events, courses..." : "Эвент, сургалт хайх...")}
        />
      </form>

      {/* Right Actions */}
      <div className="topbar-actions">
        {/* Notifications Icon Button */}
        <Link href="/Notification" className="bell-btn" title={t("notification") || "Notifications"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {unreadNotificationCount > 0 && (
            <span className="bd-badge-count">
              {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
            </span>
          )}
        </Link>

        {/* Language Switcher Pill */}
        <div className="topbar-lang-wrap">
          <LanguageSelector />
        </div>

        {/* User Avatar */}
        <div className="avatar">
          <Link href="/Personalinfo" title={t("personalInfo") || "Personal Info"}>
            <img 
              src={profile?.profileImage ? getFullImageUrl(profile.profileImage) : "/img/default-user.png"} 
              alt="User" 
              onError={(e) => { e.currentTarget.src = "/img/default-user.png"; }}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default CustomerHeader;
