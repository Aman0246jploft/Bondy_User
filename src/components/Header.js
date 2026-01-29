"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import Link from "next/link";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "@/utils/imageHelper";

export default function BondyHeader() {
  const [isAnimating, setIsAnimating] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => setShowContent(true), 800);
    }, 1500);

    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await authApi.getSelfProfile();
          if (response.status) {
            setUserProfile(response.data.profile);
          }
        } catch (error) {
          console.error("Header Profile Fetch Error:", error);
        }
      }
    };
    fetchUser();

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <nav className="bondy-nav">
        {/* LOGO INTRO ANIMATION */}
        <motion.div
          className="logo-box"
          initial={{ scale: 2.5, x: "45vw", y: "45vh" }}
          animate={!isAnimating ? { scale: 1, x: 0, y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.6, 0.01, -0.05, 0.9] }}>
          <div className="logo_box">
            <Link href="/">
              <img src="/img/logo.svg" alt="logo" />
            </Link>
          </div>
        </motion.div>

        {/* RIGHT CONTENT */}
        <AnimatePresence>
          {showContent && (
            <div
              className="nav-content-wrapper"
              style={{ display: "flex", flexGrow: 1, alignItems: "center" }}>
              {/* DESKTOP MENU (STATIC) */}
              <motion.div
                className="menu-links-container"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{
                  flexGrow: 1,
                  display: "flex",
                  justifyContent: "center",
                }}>
                <ul className="desktop-menu">
                  <li>
                    <Link href="/">Home</Link>
                  </li>
                  <li>
                    <Link href="/Explore">Explore</Link>
                  </li>
                  <li>
                    <Link href="/Programs-Listing">Programs</Link>
                  </li>
                  <li>
                    <Link href="/Organizers">Organizers</Link>
                  </li>
                  <li>
                    <Link href="/contact-us">Contact Us</Link>
                  </li>
                </ul>
              </motion.div>

              {/* RIGHT ACTIONS */}
              <motion.div
                className="nav-right-actions"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <LanguageSelector />
                {userProfile ? (
                  <Link
                    href={
                      userProfile.role === "ORGANISER" || userProfile.role === "ORGANIZER" ? "/OrganizerPersonalInfo" : userProfile.role === "CUSTOMER" ? "/Personalinfo" : "/completeprofile"
                    }
                    className="profile-img-btn"
                  >
                    <img
                      src={getFullImageUrl(userProfile.profileImage)}
                      alt="profile"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #fff",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                      }}
                    />
                  </Link>
                ) : (
                  <Link href="/login" className="signup-btn">
                    Sign Up
                  </Link>
                )}

                {/* MOBILE ICON */}
                <button
                  className="mobile-menu-icon"
                  onClick={() => setIsMenuOpen(true)}>
                  <Menu size={28} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </nav>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.div
              className="sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <div className="logo-box">
                  <img src="/img/logo.svg" alt="logo" />
                </div>

                <button
                  style={{ background: "none", border: "none", color: "white" }}
                  onClick={() => setIsMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              {/* MOBILE MENU (STATIC) */}
              <ul className="sidebar-links">
                <li>
                  <Link href="/" onClick={() => setIsMenuOpen(false)}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/Explore" onClick={() => setIsMenuOpen(false)}>
                    Explore
                  </Link>
                </li>
                <li>
                  <Link
                    href="/Programs-Listing"
                    onClick={() => setIsMenuOpen(false)}>
                    Programs
                  </Link>
                </li>
                <li>
                  <Link href="/Organizers" onClick={() => setIsMenuOpen(false)}>
                    Organizers
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us" onClick={() => setIsMenuOpen(false)}>
                    Contact Us
                  </Link>
                </li>
              </ul>

              <div style={{ marginTop: "auto" }}>
                {userProfile ? (
                  <Link
                    href={
                      userProfile.role === "ORGANISER" || userProfile.role === "ORGANIZER" ? "/OrganizerPersonalInfo" : userProfile.role === "CUSTOMER" ? "/Personalinfo" : "/completeprofile"
                    }
                    className="profile-img-btn"
                    onClick={() => setIsMenuOpen(false)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                      <img
                        src={getFullImageUrl(userProfile.profileImage)}
                        alt="profile"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #fff"
                        }}
                      />
                      <span>{userProfile.firstName || 'Profile'}</span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="signup-btn d-inline-block"
                    onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
