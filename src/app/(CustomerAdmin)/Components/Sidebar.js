"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/context/SocketContext";

export default function Sidebar({ toggleSidebar }) {
  const { t } = useLanguage();
  const { unreadNotificationCount } = useSocket();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();


  const isActive = (path) => pathname === path;

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    toast.success(t("loggedOutSuccessfully"));
    router.push("/login");
  };

  return (
    <aside className="customer-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
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
          href="/Personalinfo"
          className={`menu-item ${isActive("/Personalinfo") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/user-icon.svg" alt="" />
          </span>
          <span className="text">{t("personalInfo")}</span>
        </Link>

         <Link
          href="/Notification"
          className={`menu-item ${isActive("/Notification") ? "active" : ""}`}>
          <span className="icon" style={{ position: "relative" }}>
            <img src="/img/bell-icon.svg" alt="" />
            {unreadNotificationCount > 0 && (
              <span style={{
                position: "absolute", top: "-6px", right: "-6px",
                background: "#e74c3c", color: "#fff", borderRadius: "50%",
                fontSize: "10px", fontWeight: 700, minWidth: "16px", height: "16px",
                display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1, padding: "0 3px"
              }}>
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </span>
          <span className="text">{t("notification")}</span>
        </Link>

        <Link
          href="/MyTickets"
          className={`menu-item ${isActive("/MyTickets") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/ticket-icon.svg" alt="" />
          </span>
          <span className="text">{t("tickets")}</span>
        </Link>

        <Link
          href="/Payment"
          className={`menu-item ${isActive("/Payment") ? "active" : ""}`}
          onClick={(e) => e.preventDefault()}
          aria-disabled="true"
          tabIndex={-1}
          style={{ pointerEvents: "none", opacity: 0.6, cursor: "not-allowed" }}>
          <span className="icon">
            <img src="/img/wallet-icon.svg" alt="" />
          </span>
          <span className="text">{t("payment")}</span>
        </Link>

        <Link
          href="/Messagee"
          className={`menu-item ${isActive("/Messagee") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/message-icon.svg" alt="" />
          </span>
          <span className="text">{t("messages")}</span>
        </Link>

       

        <Link
          href="/MyFavorite"
          className={`menu-item ${isActive("/MyFavorite") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/favorite-icon.svg" alt="" />
          </span>
          <span className="text">{t("myFavorite")}</span>
        </Link>
        <Link
          href="/SupportTicketsC"
          className={`menu-item ${isActive("/SupportTicketsC") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/favorite-icon.svg" alt="" />
          </span>
          <span className="text">{t("supportTickets")}</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/Setting" className="menu-item">
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
