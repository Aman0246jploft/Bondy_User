import LanguageSelector from "@/components/LanguageSelector";
import Link from "next/link";
import React from "react";

function CustomerHeader() {
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
            <Link href="/profile">
              <img src="/img/avtar.png" alt="User" />
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}

export default CustomerHeader;
