"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

// Clean design system glyphs matching Bondy prototype
function NavIcon({ glyph, size = 22 }) {
  switch (glyph) {
    case "dash":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "ticket":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5V7a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 7v2.5a2.5 2.5 0 0 0 0 5V17a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17v-2.5a2.5 2.5 0 0 0 0-5Z" />
        </svg>
      );
    case "book":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 7.5v12" />
          <path d="M12 7.5C10.5 6 8.7 5.2 4.8 5 4.3 5 4 5.4 4 5.9v10.4c0 .5.3.8.8.9 3.9.2 5.7 1 7.2 2.4 1.5-1.4 3.3-2.2 7.2-2.4.5 0 .8-.4.8-.9V5.9c0-.5-.3-.9-.8-.9-3.9.2-5.7 1-7.2 2.5Z" />
        </svg>
      );
    case "users":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15.5 20v-1.5a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20" />
          <circle cx="9.5" cy="8" r="3.5" />
          <path d="M21 20v-1.5a4 4 0 0 0-3-3.87" />
          <path d="M15.5 4.63a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "mail":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
          <path d="m3.5 7 7.3 5.2a2 2 0 0 0 2.4 0L20.5 7" />
        </svg>
      );
    case "wallet":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 8.5V7A2 2 0 0 0 18.5 5H5A2.5 2.5 0 0 0 2.5 7.5v9A2.5 2.5 0 0 0 5 19h13.5a2 2 0 0 0 2-2v-1.5" />
          <path d="M22 9.5h-5a2.5 2.5 0 0 0 0 5h5Z" />
        </svg>
      );
    case "analytics":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20V13" />
          <path d="M9 20V6" />
          <path d="M14 20v-9" />
          <path d="M19 20V9" />
        </svg>
      );
    case "verify":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.2 4.5 6v6c0 4.4 3.1 7.6 7.5 8.8 4.4-1.2 7.5-4.4 7.5-8.8V6Z" />
          <path d="m9.3 12.2 1.9 1.9 3.6-3.7" />
        </svg>
      );
    case "orders":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4.5H7.5A1.5 1.5 0 0 0 6 6v13a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V6a1.5 1.5 0 0 0-1.5-1.5H15" />
          <rect x="9" y="2.8" width="6" height="3.4" rx="1.2" />
          <path d="M9.6 11h4.8" />
          <path d="M9.6 15h4.8" />
        </svg>
      );
    case "profile":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="10" r="2.8" />
          <path d="M6.5 18.6a6 6 0 0 1 11 0" />
        </svg>
      );
    case "bell":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 16V11a6 6 0 0 0-12 0v5l-1.5 2.2h15Z" />
          <path d="M10 19.5a2.2 2.2 0 0 0 4 0" />
        </svg>
      );
    case "help":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.6 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.7v.3" />
          <path d="M12 17.1h.01" />
        </svg>
      );
    case "settings":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a1.7 1.7 0 1 1-3.4 0V20a1.6 1.6 0 0 0-1.1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3.4a1.7 1.7 0 1 1 0-3.4h.2a1.6 1.6 0 0 0 1.5-1.1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3.4a1.7 1.7 0 1 1 3.4 0v.2a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a1.7 1.7 0 1 1 0 3.4H20a1.6 1.6 0 0 0-1.5 1Z" />
        </svg>
      );
    case "globe":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.2 9.8h17.6" />
          <path d="M3.2 14.2h17.6" />
          <path d="M12 3.1c2.2 2.4 3.4 5.5 3.4 8.9s-1.2 6.5-3.4 8.9C9.8 18.5 8.6 15.4 8.6 12S9.8 5.5 12 3.1Z" />
        </svg>
      );
    case "external":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 4.5h5.5V10" />
          <path d="m19 5-7.5 7.5" />
          <path d="M18 14.2V18a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 18V8.8A1.8 1.8 0 0 1 6.8 7h3.8" />
        </svg>
      );
    default:
      return null;
  }
}

export default function OrganizerSidebar({ mobileOpen = false, onCloseMobile }) {
  const pathname = usePathname();
  const { t, language } = useLanguage();
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
      active: pathname.startsWith("/EventsManagement") || pathname.startsWith("/EventDetailOrganiser") || pathname.startsWith("/BasicInfo"),
    },
    {
      id: "learning",
      label: isMn ? "Сургалт" : "Course",
      glyph: "book",
      href: "/CoursesManagement",
      active: pathname.startsWith("/CoursesManagement") || pathname.startsWith("/CourseDetailOrganiser"),
    },
    {
      id: "bookings",
      label: t("obNav"),
      glyph: "orders",
      href: "/OrganizerCustomerBookings",
      active: pathname.startsWith("/OrganizerCustomerBookings") || pathname.startsWith("/OrganizerBookingDetail"),
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
