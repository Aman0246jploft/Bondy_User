import LanguageSelector from "@/components/LanguageSelector";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "@/utils/imageHelper";

function CustomerHeader() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getSelfProfile();
        if (response.status) {
          setProfile(response.data.profile);
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
        <div className="topbar-search">
          <input
            type="text"
            className="form-control"
            placeholder="Placeholder "
          />
          <span className="search-icon">
            <img src="/img/search.svg" alt="Search" />
          </span>
        </div>

        {/* Right Actions */}
        <div className="topbar-actions">
          <Link href="/Notification" className="bell-btn">
            <img src="/img/bell-icon.svg" alt="Notifications" />
          </Link>

          <LanguageSelector />

          <div className="avatar">
            <Link href="/Personalinfo">
              <img src={profile?.profileImage ? getFullImageUrl(profile.profileImage) : "/img/avtar.png"} alt="User" />
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}

export default CustomerHeader;
