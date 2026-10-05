"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "./Components/Sidebar";
import authApi from "@/api/authApi";
import { useLanguage } from "@/context/LanguageContext";
import "./customer-admin.css";

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const response = await authApi.getSelfProfile();
        if (response?.status) {
          if (response.data.user.role !== "CUSTOMER") {
            router.push("/");
          } else {
            setAuthorized(true);
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    document.title = "Bondy - Account";
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname.includes("/Personalinfo")) return t("personalInfo") || "Personal Information";
    if (pathname.includes("/MyTickets")) return t("tickets") || "My Tickets";
    if (pathname.includes("/Messagee")) return t("messages") || "Messages";
    if (pathname.includes("/MyFavorite")) return t("myFavorite") || "Saved & Favorites";
    if (pathname.includes("/CustomerReferral")) return t("referral") || "Referrals & Invites";
    if (pathname.includes("/SupportTicketsC")) return t("supportTickets") || "Support & Help";
    if (pathname.includes("/Notification")) return t("notification") || "Notifications";
    if (pathname.includes("/Security")) return t("security") || "Security";
    if (pathname.includes("/Setting")) return t("settings") || "Settings";
    if (pathname.includes("/ChangePassword")) return t("changePassword") || "Change Password";
    if (pathname.includes("/TicketDetails")) return t("ticketDetails") || "Ticket Details";
    return t("account") || "Account";
  };

  if (!authorized) return null;

  return (
    <div className="bd-account-shell">
      {/* Website Consumer Header */}
      <Header />

      {/* Main Centered Account Body */}
      <main id="top" className="bd-acct-container" data-screen-label="Account">
        {/* Breadcrumbs */}
        <nav className="bd-crumb" aria-label="Breadcrumb">
          <Link href="/" className="bd-crumb-link">
            {t("home") || "Home"}
          </Link>
          <span className="bd-crumb-sep">/</span>
          <span className="bd-crumb-current">{getPageTitle()}</span>
        </nav>

        {/* Mobile Accordion Menu Trigger */}
        <button
          type="button"
          className="bd-acct-trig"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
        >
          <span className="bd-acct-trig-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </span>
          <span className="bd-acct-trig-text">{getPageTitle()}</span>
          <span className={`bd-acct-trig-arrow ${mobileMenuOpen ? "open" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {/* 2-Column Account Grid */}
        <div className="bd-acct">
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
          <div className="bd-acct-content">
            {children}
          </div>
        </div>
      </main>

      {/* Website Consumer Footer */}
      <Footer />
    </div>
  );
}
