"use client";
import LanguageSelector from "@/components/LanguageSelector";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";

function OrganizerHeader() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getSelfProfile();
        if (response?.status) {
          setProfile(response?.data?.user);
        }
      } catch (error) {
        console.error("Failed to fetch profile in OrganizerHeader:", error);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div>
      <header className="topbar">
        {/* Search */}
        <div style={{ visibility: "hidden" }} className="topbar-search">
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
          {/* <Link href="" className="bell-btn">
            <img src="/img/bell-icon.svg" alt="Notifications" />
          </Link> */}

          <LanguageSelector />

          <div className="avatar">
            <Link href="/OrganizerPersonalInfo">
              {/* {console.log(
                "Rendering profile image with data:",
                profile?.profileImage,
              )} */}
              <img
                src={
                  profile?.profileImage
                    ? getFullImageUrl(profile.profileImage)
                    : "/img/default-user.png"
                }
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

export default OrganizerHeader;
