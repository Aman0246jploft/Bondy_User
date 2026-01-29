"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function OrganizerSidebar({ toggleSidebar }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => {
    if (isDropdownOpen) return false;
    return pathname === path;
  };

  return (
    <aside className="customer-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          <Link href="/(CustomerAdmin)/Personalinfo">
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
          href="/Dashboard"
          className={`menu-item ${isActive("/Dashboard") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-01.svg" alt="" />
          </span>
          <span className="text">Dashboard</span>
        </Link>

        <Link
          href="/EventsManagement"
          className={`menu-item ${
            isActive("/EventsManagement") ? "active" : ""
          }`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-02.svg" alt="" />
          </span>
          <span className="text">Event Management</span>
        </Link>
        <Link
          href="/Analytics"
          className={`menu-item ${isActive("/Analytics") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-03.svg" alt="" />
          </span>
          <span className="text">Analytics</span>
        </Link>

        <Link
          href="/Promotions"
          className={`menu-item ${isActive("/Promotions") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-04.svg" alt="" />
          </span>
          <span className="text">Promotions</span>
        </Link>
        <Link
          href="/Earnings"
          className={`menu-item ${isActive("/Earnings") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-05.svg" alt="" />
          </span>
          <span className="text">Earnings</span>
        </Link>
        <Link
          href="/SubscriptionBilling"
          className={`menu-item ${
            isActive("/SubscriptionBilling") ? "active" : ""
          }`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-06.svg" alt="" />
          </span>
          <span className="text">Subscription & Billing</span>
        </Link>
        <Link
          href="/Referral"
          className={`menu-item ${isActive("/Referral") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-07.svg" alt="" />
          </span>
          <span className="text">Referral</span>
        </Link>
        <Link
          href="/SupportTickets"
          className={`menu-item ${isActive("/SupportTickets") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-08.svg" alt="" />
          </span>
          <span className="text">Support Tickets</span>
        </Link>
        {/* <Link href="" className="menu-item">
          <span className="icon">
            <img src="/img/org-img/sidebar-icon-09.svg" alt="" />
          </span>
          <span className="text">Create New</span>
        </Link> */}
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
                <span className="text">Create</span>
                {/* Optional Arrow for better UX */}
              </>
            )}
          </div>

          <div className={`accordion-content ${isDropdownOpen ? "show" : ""}`}>
            <Link href="" className="sub-item" onClick={() => {}}>
              Create Event
            </Link>
            <Link href="/AddProgram" className="sub-item">
              Create Program
            </Link>
          </div>
        </div>
        <Link
          href="/Verifiedprofile"
          className={`menu-item ${isActive("/Verifiedprofile") ? "active" : ""}`}>
          <span className="icon">
            <img src="/img/org-img/verifiedprofile.svg" alt="" />
          </span>
          <span className="text">Verified Profile</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="" className="menu-item">
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
