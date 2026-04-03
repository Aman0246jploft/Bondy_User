"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useEventContext } from "@/context/EventContext";
import { useLanguage } from "@/context/LanguageContext";

export default function OrganizerSidebar({ toggleSidebar }) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { clearEventData } = useEventContext();

  const isActive = (path) => {
    if (isDropdownOpen) return false;
    return pathname === path;
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <aside className="customer-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          {/* <Link href="/Dashboard"> */}
          <Link href="/">
            <img
              src="/img/sidebar-logo.svg"
              alt="Logo"
              className="logo-image"
            />
          </Link>
        </div>

        <button className="toggle-btn" onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Middle Section */}
      <nav className="sidebar-menu">
        <Link
          href="/OrganizerPersonalInfo"
          className={`menu-item ${isActive("/OrganizerPersonalInfo") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/user-icon.svg" alt="" />
          </span>
          <span className="text">{t("personalInfo")}</span>
        </Link>



        <Link
          href="/MyTicketsOrganiser"
          className={`menu-item ${isActive("/MyTicketsOrganiser") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/ticket-icon.svg" alt="" />
          </span>
          <span className="text">{t("tickets")}</span>
        </Link>




        <Link
          href="/Dashboard"
          className={`menu-item ${isActive("/Dashboard") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-01.svg" alt="" />
          </span>
          <span className="text">{t("dashboard")}</span>
        </Link>

        <Link
          href="/EventsManagement"
          className={`menu-item ${isActive("/EventsManagement") ? "active" : ""
            }`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-02.svg" alt="" />
          </span>
          <span className="text">{t("programManagement")}</span>
        </Link>

        <Link
          href="/CoursesManagement"
          className={`menu-item ${isActive("/CoursesManagement") ? "active" : ""
            }`}
        >
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-02.svg" alt="" />
          </span>
          <span className="text">{t("coursesManagement")}</span>
        </Link>

        <Link
          href="/Message"
          className={`menu-item ${isActive("/Message") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/message-icon.svg" alt="" />
          </span>
          <span className="text">{t("messages")}</span>
        </Link>

        <Link
          href="/Promotions"
          className={`menu-item ${isActive("/Promotions") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-04.svg" alt="" />
          </span>
          <span className="text">{t("promotions")}</span>
        </Link>
        <Link
          href="/Earnings"
          className={`menu-item ${isActive("/Earnings") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-05.svg" alt="" />
          </span>
          <span className="text">{t("earnings")}</span>
        </Link>
        <Link
          href="/Referral"
          className={`menu-item ${isActive("/Referral") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-07.svg" alt="" />
          </span>
          <span className="text">{t("referral")}</span>
        </Link>
        <Link
          href="/SupportTickets"
          className={`menu-item ${isActive("/SupportTickets") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-08.svg" alt="" />
          </span>
          <span className="text">{t("supportTickets")}</span>
        </Link>
        <div className="accordion-wrapper create_dropdwon">
          <div
            className={`menu-item ${isDropdownOpen ? "active" : ""}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle logic
            style={{ cursor: "pointer" }}>
            <span className="icon">
              <img src="/img/org-img/sidebar-icon-09.svg" alt="" />
            </span>
            {!collapsed && (
              <>
                <span className="text">{t("create")}</span>
              </>
            )}
          </div>

          <div className={`accordion-content ${isDropdownOpen ? "show" : ""}`}>
            <Link
              href="/BasicInfo"
              className="sub-item"
              onClick={() => {
                clearEventData();
              }}>
              {t("createEvent")}
            </Link>
            <Link href="/AddProgram" className="sub-item">
              {t("createProgram")}
            </Link>
          </div>
        </div>
        <Link
          href="/Verifiedprofile"
          className={`menu-item ${isActive("/Verifiedprofile") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/verifiedprofile.svg" alt="" />
          </span>
          <span className="text">{t("verifiedProfile")}</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/Settings" className={`menu-item ${isActive("/Settings") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/cogs-icon.svg" alt="" />
          </span>
          <span className="text">{t("settings")}</span>
        </Link>
        <Link href="#" className="menu-item" onClick={handleLogout}>
          <span className="icon">
            <img src="/img/logout-icon.svg" alt="" />
          </span>
          <span className="text">{t("logout")}</span>
        </Link>
      </div>
    </aside>
  );
}
