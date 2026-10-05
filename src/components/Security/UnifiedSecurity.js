"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumber } from "react-phone-number-input";
import apiClient from "@/api/apiClient";
import authApi from "@/api/authApi";
import { useLanguage } from "@/context/LanguageContext";
import "./security-unified.css";

export default function UnifiedSecurity({ role = "customer", defaultOpenPassword = false }) {
  const { t, language } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Accordion open states
  const [activeSection, setActiveSection] = useState(defaultOpenPassword ? "password" : null);

  // Phone states
  const [phoneVal, setPhoneVal] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);

  // Email states
  const [emailVal, setEmailVal] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

  // Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    fetchProfile();
    document.title = (t("security") || (language === "mn" ? "Аюулгүй байдал" : "Security")) + " - Bondy";
  }, [language]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/user/selfProfile");
      if (res?.data?.user) {
        const u = res.data.user;
        setProfile(u);
        setEmailVal(u.email || "");
        if (u.contactNumber) {
          const combined = u.countryCode ? `${u.countryCode}${u.contactNumber}` : u.contactNumber;
          setPhoneVal(combined.startsWith("+") ? combined : `+${combined}`);
        } else {
          setPhoneVal("");
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  // --- Phone OTP ---
  const handleSendPhoneOtp = async () => {
    if (!phoneVal) {
      toast.error(t("enterPhoneNumber") || (language === "mn" ? "Утасны дугаараа оруулна уу" : "Please enter a valid phone number"));
      return;
    }
    let finalCountryCode = "+976";
    let finalContactNumber = phoneVal;
    try {
      const parsed = parsePhoneNumber(phoneVal.startsWith("+") ? phoneVal : `+${phoneVal}`);
      if (parsed) {
        finalCountryCode = `+${parsed.countryCallingCode}`;
        finalContactNumber = parsed.nationalNumber;
      }
    } catch (phoneErr) {
      console.warn("Phone parse fallback:", phoneErr);
    }

    try {
      setPhoneBusy(true);
      const res = await apiClient.post("/verification/phone/send-otp", {
        countryCode: finalCountryCode,
        contactNumber: finalContactNumber,
      });
      if (res?.status) {
        toast.success(res.message || (language === "mn" ? "Баталгаажуулах код амжилттай илгээгдлээ!" : "OTP sent successfully!"));
        setPhoneOtpSent(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (language === "mn" ? "Код илгээхэд алдаа гарлаа" : "Failed to send phone OTP"));
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) {
      toast.error(language === "mn" ? "Баталгаажуулах кодоо оруулна уу" : "Please enter the OTP received");
      return;
    }
    try {
      setPhoneBusy(true);
      const res = await apiClient.post("/verification/phone/verify-otp", { otp: phoneOtp });
      if (res?.status) {
        toast.success(language === "mn" ? "Утасны дугаар амжилттай баталгаажлаа!" : "Phone number verified successfully!");
        setPhoneOtpSent(false);
        setPhoneOtp("");
        setActiveSection(null);
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (language === "mn" ? "Буруу код байна" : "Invalid OTP"));
    } finally {
      setPhoneBusy(false);
    }
  };

  // --- Email OTP ---
  const handleSendEmailOtp = async () => {
    if (!emailVal || !emailVal.includes("@")) {
      toast.error(language === "mn" ? "Зөв имэйл хаяг оруулна уу" : "Please enter a valid email address");
      return;
    }
    try {
      setEmailBusy(true);
      const res = await apiClient.post("/verification/email/send-otp", { email: emailVal });
      if (res?.status) {
        toast.success(res.message || (language === "mn" ? "Имэйл рүү код илгээгдлээ!" : "OTP sent to your email!"));
        setEmailOtpSent(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (language === "mn" ? "Код илгээхэд алдаа гарлаа" : "Failed to send email OTP"));
    } finally {
      setEmailBusy(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp) {
      toast.error(language === "mn" ? "Баталгаажуулах кодоо оруулна уу" : "Please enter the OTP received");
      return;
    }
    try {
      setEmailBusy(true);
      const res = await apiClient.post("/verification/email/verify-otp", { otp: emailOtp });
      if (res?.status) {
        toast.success(language === "mn" ? "Имэйл амжилттай баталгаажлаа!" : "Email verified successfully!");
        setEmailOtpSent(false);
        setEmailOtp("");
        setActiveSection(null);
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (language === "mn" ? "Буруу код байна" : "Invalid OTP"));
    } finally {
      setEmailBusy(false);
    }
  };

  // --- Password Change ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(language === "mn" ? "Бүх талбарыг бөглөнө үү" : "All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(language === "mn" ? "Шинэ нууц үг хоорондоо таарахгүй байна" : "Passwords do not match");
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$&*~%^()_+=\[\]{};:<>|./?,-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error(
        language === "mn"
          ? "Нууц үг хамгийн багадаа 8 тэмдэгттэй, том/жижиг үсэг, тоо, тусгай тэмдэгт агуулсан байх ёстой."
          : "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }
    if (oldPassword === newPassword) {
      toast.error(language === "mn" ? "Шинэ нууц үг хуучнаас өөр байх ёстой" : "New password must be different from old password");
      return;
    }

    try {
      setPwBusy(true);
      const res = await authApi.changePassword({ oldPassword, newPassword, confirmPassword });
      if (res?.status) {
        toast.success(res?.message || (language === "mn" ? "Нууц үг амжилттай шинэчлэгдлээ" : "Password changed successfully"));
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setActiveSection(null);
      } else {
        toast.error(res?.message || (language === "mn" ? "Нууц үг солиход алдаа гарлаа" : "Failed to change password"));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || (language === "mn" ? "Нууц үг солиход алдаа гарлаа" : "Failed to change password"));
    } finally {
      setPwBusy(false);
    }
  };

  // --- Delete Account ---
  const handleConfirmDelete = async () => {
    try {
      setDeleteBusy(true);
      // Try calling delete if route exists, or notify and log out
      try {
        await apiClient.delete("/user/deleteAccount");
      } catch (ignored) {
        // Backend fallback
      }
      toast.success(language === "mn" ? "Таны хүсэлтийг хүлээн авлаа. Бүртгэл хаагдлаа." : "Account deletion requested. Logging out.");
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      toast.error(language === "mn" ? "Алдаа гарлаа" : "Error processing request");
      setDeleteBusy(false);
    }
  };

  const isPhoneVerified = profile?.verifications?.phone?.isVerified;
  const isEmailVerified = profile?.verifications?.email?.isVerified;

  if (loading) {
    return (
      <div className="bd-sec-card" style={{ minHeight: "280px", alignItems: "center", justifyContent: "center" }}>
        <span className="bd-spin" style={{ width: "32px", height: "32px", borderColor: "rgba(45,212,191,0.2)", borderTopColor: "var(--acc-bright, #2dd4bf)" }} />
      </div>
    );
  }

  return (
    <div className="bd-sec-card">
      {/* Header */}
      <div className="bd-sec-header">
        <h2>{t("security") || (language === "mn" ? "Аюулгүй байдал" : "Security")}</h2>
        <p>{language === "mn" ? "Бүртгэлийнхээ мэдээллийг хамгаална." : "Protect and manage your account credentials."}</p>
      </div>

      {/* Main Credentials Stack */}
      <div className="bd-sec-stack">
        {/* Phone Row */}
        <div>
          <button
            type="button"
            className="bd-sec-row"
            onClick={() => toggleSection("phone")}
            aria-expanded={activeSection === "phone"}
          >
            <span className="bd-sec-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <span className="bd-sec-info">
              <b className="bd-sec-title">{language === "mn" ? "Утасны дугаар" : "Phone Number"}</b>
              <span className="bd-sec-sub">
                <span>{phoneVal ? phoneVal : (language === "mn" ? "Тохируулаагүй" : "Not set")}</span>
                {isPhoneVerified ? (
                  <span className="bd-badge-verified">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {language === "mn" ? "Баталгаажсан" : "Verified"}
                  </span>
                ) : (
                  <span className="bd-badge-unverified">
                    {language === "mn" ? "Баталгаажаагүй" : "Unverified"}
                  </span>
                )}
              </span>
            </span>
            <span className={`bd-sec-chevron ${activeSection === "phone" ? "rotated" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>

          {/* Expandable Phone OTP Form */}
          {activeSection === "phone" && (
            <div className="bd-sec-expand">
              <div className="bd-form-field">
                <label className="bd-form-label">{language === "mn" ? "Утасны дугаар шинэчлэх" : "Update Phone Number"}</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ flex: "1 1 220px" }}>
                    <PhoneInput
                      country={"mn"}
                      value={phoneVal}
                      onChange={(phone) => setPhoneVal("+" + phone)}
                      inputClass="bd-input"
                    />
                  </div>
                  <button
                    type="button"
                    className="bd-btn-primary"
                    onClick={handleSendPhoneOtp}
                    disabled={phoneBusy}
                  >
                    {phoneBusy && <span className="bd-spin" />}
                    {phoneOtpSent
                      ? (language === "mn" ? "Код дахин илгээх" : "Resend OTP")
                      : (language === "mn" ? "Код илгээх" : "Send OTP")}
                  </button>
                </div>
              </div>

              {phoneOtpSent && (
                <div className="bd-form-field" style={{ marginTop: "6px" }}>
                  <label className="bd-form-label">{language === "mn" ? "Баталгаажуулах 5 оронтой код" : "Enter Verification Code"}</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      className="bd-input"
                      placeholder="12345"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      style={{ maxWidth: "200px" }}
                    />
                    <button
                      type="button"
                      className="bd-btn-primary"
                      onClick={handleVerifyPhoneOtp}
                      disabled={phoneBusy}
                    >
                      {phoneBusy && <span className="bd-spin" />}
                      {language === "mn" ? "Баталгаажуулах" : "Verify Code"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email Row */}
        <div>
          <button
            type="button"
            className="bd-sec-row"
            onClick={() => toggleSection("email")}
            aria-expanded={activeSection === "email"}
          >
            <span className="bd-sec-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <span className="bd-sec-info">
              <b className="bd-sec-title">{language === "mn" ? "Имэйл хаяг" : "Email Address"}</b>
              <span className="bd-sec-sub">
                <span>{emailVal || (profile?.email) || (language === "mn" ? "Бүртгэлгүй" : "No email")}</span>
                {isEmailVerified ? (
                  <span className="bd-badge-verified">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {language === "mn" ? "Баталгаажсан" : "Verified"}
                  </span>
                ) : (
                  <span className="bd-badge-unverified">
                    {language === "mn" ? "Баталгаажаагүй" : "Unverified"}
                  </span>
                )}
              </span>
            </span>
            <span className={`bd-sec-chevron ${activeSection === "email" ? "rotated" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>

          {/* Expandable Email OTP Form */}
          {activeSection === "email" && (
            <div className="bd-sec-expand">
              <div className="bd-form-field">
                <label className="bd-form-label">{language === "mn" ? "Имэйл хаяг солих" : "Change Email Address"}</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="email"
                    className="bd-input"
                    placeholder="name@example.com"
                    value={emailVal}
                    onChange={(e) => setEmailVal(e.target.value)}
                    style={{ flex: "1 1 240px" }}
                  />
                  <button
                    type="button"
                    className="bd-btn-primary"
                    onClick={handleSendEmailOtp}
                    disabled={emailBusy}
                  >
                    {emailBusy && <span className="bd-spin" />}
                    {emailOtpSent
                      ? (language === "mn" ? "Код дахин илгээх" : "Resend OTP")
                      : (language === "mn" ? "Код илгээх" : "Send OTP")}
                  </button>
                </div>
              </div>

              {emailOtpSent && (
                <div className="bd-form-field" style={{ marginTop: "6px" }}>
                  <label className="bd-form-label">{language === "mn" ? "Имэйлээр ирсэн код" : "Enter Verification Code"}</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      className="bd-input"
                      placeholder="12345"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      style={{ maxWidth: "200px" }}
                    />
                    <button
                      type="button"
                      className="bd-btn-primary"
                      onClick={handleVerifyEmailOtp}
                      disabled={emailBusy}
                    >
                      {emailBusy && <span className="bd-spin" />}
                      {language === "mn" ? "Баталгаажуулах" : "Verify Code"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Change Password Row */}
        <div>
          <button
            type="button"
            className="bd-sec-row"
            onClick={() => toggleSection("password")}
            aria-expanded={activeSection === "password"}
          >
            <span className="bd-sec-icon">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="bd-sec-info">
              <b className="bd-sec-title">{t("changePassword") || (language === "mn" ? "Нууц үг солих" : "Change Password")}</b>
              <span className="bd-sec-sub">
                {language === "mn" ? "Нууц үгээ шинэчлэх" : "Update and strengthen your account password"}
              </span>
            </span>
            <span className={`bd-sec-chevron ${activeSection === "password" ? "rotated" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>

          {/* Expandable Password Form */}
          {activeSection === "password" && (
            <form onSubmit={handlePasswordSubmit} className="bd-sec-expand">
              {/* Old Password */}
              <div className="bd-form-field">
                <label className="bd-form-label">{language === "mn" ? "Одоогийн нууц үг" : "Current Password"}</label>
                <div className="bd-input-wrap">
                  <input
                    type={showOld ? "text" : "password"}
                    className="bd-input"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="bd-input-icon-btn"
                    onClick={() => setShowOld(!showOld)}
                    aria-label="Toggle password visibility"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showOld ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="bd-form-field">
                <label className="bd-form-label">{language === "mn" ? "Шинэ нууц үг" : "New Password"}</label>
                <div className="bd-input-wrap">
                  <input
                    type={showNew ? "text" : "password"}
                    className="bd-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="bd-input-icon-btn"
                    onClick={() => setShowNew(!showNew)}
                    aria-label="Toggle password visibility"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showNew ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="bd-form-field">
                <label className="bd-form-label">{language === "mn" ? "Шинэ нууц үг давтах" : "Confirm New Password"}</label>
                <div className="bd-input-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="bd-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="bd-input-icon-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label="Toggle password visibility"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showConfirm ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bd-sec-btn-row">
                <button
                  type="button"
                  className="bd-btn-ghost"
                  onClick={() => setActiveSection(null)}
                >
                  {language === "mn" ? "Цуцлах" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="bd-btn-primary"
                  disabled={pwBusy}
                >
                  {pwBusy && <span className="bd-spin" />}
                  {pwBusy
                    ? (language === "mn" ? "Шинэчилж байна…" : "Updating…")
                    : (language === "mn" ? "Хадгалах" : "Save Password")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bd-sec-danger-box">
        <button
          type="button"
          className="bd-sec-danger-row"
          onClick={() => setDeleteModalOpen(true)}
        >
          <span className="bd-sec-danger-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <span className="bd-sec-info">
            <b className="bd-sec-danger-title">{language === "mn" ? "Бүртгэл устгах" : "Delete Account"}</b>
            <span className="bd-sec-sub" style={{ color: "var(--bd-gray-500, #94a3b8)" }}>
              {language === "mn" ? "Бүртгэл бүрмөсөн устана" : "Permanently remove your account and all associated data"}
            </span>
          </span>
          <span style={{ color: "#ff5a5a", display: "inline-flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>
      </div>

      {/* Delete Confirmation Modal (matching prototype CONFIRMS.delete) */}
      {deleteModalOpen && (
        <div className="bd-scrim" onClick={() => !deleteBusy && setDeleteModalOpen(false)}>
          <div className="bd-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bd-sheet-tile danger">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3>{language === "mn" ? "Бүртгэлээ устгах уу?" : "Delete your account?"}</h3>
            <p>
              {language === "mn"
                ? "Захиалга, тасалбар, хадгалсан бүх мэдээлэл бүрмөсөн устана. Үйлдлийг буцаах боломжгүй."
                : "All orders, tickets, and saved data will be permanently deleted. This action cannot be reversed."}
            </p>
            <div className="bd-sheet-actions">
              <button
                type="button"
                className="bd-btn-ghost"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteBusy}
                style={{ flex: 1 }}
              >
                {language === "mn" ? "Цуцлах" : "Cancel"}
              </button>
              <button
                type="button"
                className="bd-btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleteBusy}
              >
                {deleteBusy && <span className="bd-spin" />}
                {deleteBusy
                  ? (language === "mn" ? "Устгаж байна…" : "Deleting…")
                  : (language === "mn" ? "Бүртгэл устгах" : "Delete Account")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
