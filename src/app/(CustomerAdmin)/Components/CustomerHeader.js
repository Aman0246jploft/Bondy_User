"use client";
import LanguageSelector from "@/components/LanguageSelector";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "@/utils/imageHelper";

import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/context/SocketContext";

function CustomerHeader() {
  const { t } = useLanguage();
  const { unreadNotificationCount } = useSocket();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getSelfProfile();
        if (response.status) {
          setProfile(response.data.user);
        }
      } catch (error) {
        console.error("Failed to fetch profile in CustomerHeader:", error);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div>
      <header className="topbar">
        {/* Search */}
        <div className="topbar-search" style={{ visibility: "hidden" }}>
          <input
            type="text"
            className="form-control"
            placeholder={t("searchPlaceholder") || "Search..."}
          />
          <span className="search-icon">
            <img src="/img/search.svg" alt="Search" />
          </span>
        </div>

        {/* Right Actions */}
        <div className="topbar-actions">
          {/* <Link href="/Notification" className="bell-btn" style={{ position: "relative" }}>
            <img src="/img/bell-icon.svg" alt="Notifications" />
            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-6px",
                  background: "#e74c3c",
                  color: "#fff",
                  borderRadius: "50%",
                  fontSize: "10px",
                  fontWeight: 700,
                  minWidth: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  padding: "0 3px",
                }}
              >
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </Link> */}

          <LanguageSelector />

          <div className="avatar">
            <Link href="/Personalinfo">
              <img 
                src={profile?.profileImage ? getFullImageUrl(profile.profileImage) : "/img/default-user.png"} 
                alt="User" 
                onError={(e) => { e.target.src = "/img/default-user.png"; }}
              />
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}

export default CustomerHeader;
