"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Sidebar({ toggleSidebar }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

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
          <span className="text">Personal info</span>
        </Link>

        <Link
          href="/MyTickets"
          className={`menu-item ${isActive("/MyTickets") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/ticket-icon.svg" alt="" />
          </span>
          <span className="text">Tickets</span>
        </Link>

        <Link
          href="/Payment"
          className={`menu-item ${isActive("/Payment") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/wallet-icon.svg" alt="" />
          </span>
          <span className="text">Payment</span>
        </Link>

        <Link
          href="/Message"
          className={`menu-item ${isActive("/Message") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/message-icon.svg" alt="" />
          </span>
          <span className="text">Messages</span>
        </Link>

        <Link
          href="/Notification"
          className={`menu-item ${isActive("/Notification") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/bell-icon.svg" alt="" />
          </span>
          <span className="text">Notification</span>
        </Link>

        <Link
          href="/MyFavorite"
          className={`menu-item ${isActive("/MyFavorite") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/favorite-icon.svg" alt="" />
          </span>
          <span className="text">My Favorites</span>
        </Link>
        <Link
          href="/SupportTickets"
          className={`menu-item ${isActive("/SupportTickets") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/favorite-icon.svg" alt="" />
          </span>
          <span className="text">Support Tickets</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/Setting" className="menu-item">
          <span className="icon">
            <img src="/img/cogs-icon.svg" alt="" />
          </span>
          <span className="text">Settings</span>
        </Link>
        <Link href="/" className="menu-item">
          <span className="icon">
            <img src="/img/logout-icon.svg" alt="" />
          </span>
          <span className="text">Logout</span>
        </Link>
      </div>
    </aside>
  );
}
