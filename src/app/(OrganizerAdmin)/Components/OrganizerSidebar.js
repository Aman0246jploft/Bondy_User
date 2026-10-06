"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

// Clean design system glyphs matching Bondy prototype
function NavIcon({ glyph }) {
  switch (glyph) {
    case "dash":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "ticket":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3 3 3 0 0 0 0 6 3 3 0 0 1-3 3H5a3 3 0 0 1-3-3 3 3 0 0 0 0-6Z" />
          <path d="M13 6v2" />
          <path d="M13 11v2" />
          <path d="M13 16v2" />
        </svg>
      );
    case "book":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      );
    case "users":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "mail":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "wallet":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
      );
    case "analytics":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      );
    case "verify":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "orders":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "profile":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
      );
    case "bell":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case "help":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "settings":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
    case "globe":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "external":
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    default:
      return null;
  }
}

export default function OrganizerSidebar({ mobileOpen = false, onCloseMobile }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const isMn = language === "mn";

  const navItems = [
    {
      id: "dash",
      label: isMn ? "Хянах самбар" : "Dashboard",
      glyph: "dash",
      href: "/Dashboard",
      active: pathname === "/Dashboard",
    },
    {
      id: "events",
      label: isMn ? "Эвент" : "Event",
      glyph: "ticket",
      href: "/EventsManagement",
      active: pathname.startsWith("/EventsManagement") || pathname.startsWith("/EventDetailOrganiser"),
    },
    {
      id: "learning",
      label: isMn ? "Сургалт" : "Course",
      glyph: "book",
      href: "/CoursesManagement",
      active: pathname.startsWith("/CoursesManagement") || pathname.startsWith("/CourseDetailOrganiser"),
    },
    {
      id: "staff",
      label: isMn ? "Ажилтнууд" : "Staff",
      glyph: "users",
      href: "/Staff",
      active: pathname === "/Staff",
    },
    {
      id: "messages",
      label: isMn ? "Зурвас" : "Messages",
      glyph: "mail",
      href: "/Message",
      active: pathname === "/Message",
    },
    {
      id: "payouts",
      label: isMn ? "Орлого ба татан авалт" : "Earnings & payouts",
      glyph: "wallet",
      href: "/Earnings",
      active: pathname === "/Earnings",
    },
    {
      id: "analytics",
      label: isMn ? "Аналитик" : "Analytics",
      glyph: "analytics",
      href: "/Analytics",
      active: pathname === "/Analytics" || pathname === "/Analytic",
    },
    {
      id: "verify",
      label: isMn ? "Баталгаажуулалт" : "Verification",
      glyph: "verify",
      href: "/Verifiedprofile",
      active: pathname === "/Verifiedprofile",
    },
    {
      id: "myorders",
      label: isMn ? "Миний захиалга" : "My bookings",
      glyph: "orders",
      href: "/MyTicketsOrganiser",
      active: pathname === "/MyTicketsOrganiser" || pathname === "/TicketDetailsOrganiser",
    },
    {
      id: "profile",
      label: isMn ? "Профайл" : "Profile",
      glyph: "profile",
      href: "/OrganizerProfile",
      active: pathname === "/OrganizerProfile" || pathname === "/OrganizerPersonalInfo",
    },
    {
      id: "notifications",
      label: isMn ? "Мэдэгдэл" : "Notifications",
      glyph: "bell",
      href: "/Notifications",
      active: pathname === "/Notifications",
    },
  ];

  const bottomItems = [
    {
      id: "help",
      label: isMn ? "Тусламж" : "Help",
      glyph: "help",
      href: "/SupportTickets",
      active: pathname === "/SupportTickets",
    },
    {
      id: "settings",
      label: isMn ? "Тохиргоо" : "Settings",
      glyph: "settings",
      href: "/Settings",
      active: pathname === "/Settings" || pathname === "/OrganizerChangePassword",
    },
    {
      id: "public",
      label: isMn ? "Нийтийн сайт руу" : "View public site",
      glyph: "globe",
      external: true,
      href: "/",
      active: false,
    },
  ];

  const renderAsideContent = () => (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, paddingLeft: 4 }}>
        <Link href="/OrganizerProfile" onClick={onCloseMobile} style={{ display: "inline-flex", alignItems: "center" }}>
          <img
            src="/assets/logo/bondy-logo.svg"
            alt="Bondy"
            style={{ height: "28px", width: "auto", display: "block" }}
            onError={(e) => {
              // Fallback to white text logo if SVG fails
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/img/logo.svg";
            }}
          />
        </Link>
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <nav className="bd-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={onCloseMobile}
            className={`og-nav-item ${item.active ? "active" : ""}`}
            title={item.label}
          >
            <span className="og-nav-icon">
              <NavIcon glyph={item.glyph} />
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={onCloseMobile}
            className={`og-nav-item ${item.active ? "active" : ""}`}
            title={item.label}
            style={item.external ? { justifyContent: "space-between" } : undefined}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <span className="og-nav-icon">
                <NavIcon glyph={item.glyph} />
              </span>
              <span>{item.label}</span>
            </div>
            {item.external && (
              <span style={{ color: "var(--bd-gray-500)", display: "inline-flex" }}>
                <NavIcon glyph="external" />
              </span>
            )}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Rail */}
      <div className="og-rail">
        <div className="og-rail-inner">
          <aside className="og-sidebar-aside" data-rail>
            {renderAsideContent()}
          </aside>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="og-drawer-scrim" onClick={onCloseMobile}>
          <div className="og-drawer-pane" onClick={(e) => e.stopPropagation()}>
            {renderAsideContent()}
          </div>
        </div>
      )}
    </>
  );
}
