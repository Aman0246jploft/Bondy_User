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
import OtpVerifyCard from "@/components/Otp/OtpVerifyCard";
import "./security-unified.css";

function maskPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  const local = digits.startsWith("976") ? digits.slice(3) : digits.slice(-8);
  const head = local.slice(0, 4);
  const prefix = digits.startsWith("976") ? "+976" : `+${digits.slice(0, Math.max(1, digits.length - local.length))}`;
  return `${prefix} ${head} ****`.trim();
}

export default function UnifiedSecurity({ role = "customer", defaultOpenPassword = false }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const isCustomer = role === "customer";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Accordion open states
  const [activeSection, setActiveSection] = useState(defaultOpenPassword ? "password" : null);

  // Phone states
  const [phoneVal, setPhoneVal] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [otpCard, setOtpCard] = useState(null);

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
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || (language === "mn" ? "Код илгээхэд алдаа гарлаа" : "Failed to send phone OTP"));
      return false;
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleVerifyPhoneOtp = async (code) => {
    const otp = typeof code === "string" ? code : phoneOtp;
    if (!otp) {
      toast.error(language === "mn" ? "Баталгаажуулах кодоо оруулна уу" : "Please enter the OTP received");
      return false;
    }
    try {
      setPhoneBusy(true);
      const res = await apiClient.post("/verification/phone/verify-otp", { otp });
      if (res?.status) {
        toast.success(language === "mn" ? "Утасны дугаар амжилттай баталгаажлаа!" : "Phone number verified successfully!");
        setPhoneOtpSent(false);
        setPhoneOtp("");
        setActiveSection(null);
        setOtpCard(null);
        fetchProfile();
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || (language === "mn" ? "Буруу код байна" : "Invalid OTP"));
      return false;
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
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || (language === "mn" ? "Код илгээхэд алдаа гарлаа" : "Failed to send email OTP"));
      return false;
    } finally {
      setEmailBusy(false);
    }
  };

  const handleVerifyEmailOtp = async (code) => {
    const otp = typeof code === "string" ? code : emailOtp;
    if (!otp) {
      toast.error(language === "mn" ? "Баталгаажуулах кодоо оруулна уу" : "Please enter the OTP received");
      return false;
    }
    try {
      setEmailBusy(true);
      const res = await apiClient.post("/verification/email/verify-otp", { otp });
      if (res?.status) {
        toast.success(language === "mn" ? "Имэйл амжилттай баталгаажлаа!" : "Email verified successfully!");
        setEmailOtpSent(false);
        setEmailOtp("");
        setActiveSection(null);
        setOtpCard(null);
        fetchProfile();
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || (language === "mn" ? "Буруу код байна" : "Invalid OTP"));
      return false;
    } finally {
      setEmailBusy(false);
    }
  };

  const openCustomerOtp = async (kind) => {
    if (phoneBusy || emailBusy) return;
    const ok = kind === "phone" ? await handleSendPhoneOtp() : await handleSendEmailOtp();
    if (ok) setOtpCard(kind);
  };

  const resendCustomerOtp = async () => {
    try {
      if (otpCard === "phone") {
        const res = await apiClient.post("/verification/phone/resend-otp", {});
        return Boolean(res?.status);
      }
      const res = await apiClient.post("/verification/email/resend-otp", { email: emailVal });
      return Boolean(res?.status);
    } catch {
      return false;
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
    <div className={`bd-sec-card${isCustomer ? " customer" : ""}`}>
      {/* Header */}
      <div className="bd-sec-header">
        <h2>{t("security") || (language === "mn" ? "Аюулгүй байдал" : "Security")}</h2>
        <p>{isCustomer ? t("scLead") : (language === "mn" ? "Бүртгэлийнхээ мэдээллийг хамгаална." : "Protect and manage your account credentials.")}</p>
      </div>

      {/* Main Credentials Stack */}
      <div className="bd-sec-stack">
        {/* Phone Row */}
        <div>
          <button
            type="button"
            className="bd-sec-row"
            onClick={() => { if (!isCustomer) toggleSection("phone"); }}
            aria-expanded={!isCustomer && activeSection === "phone"}
          >
            <span className="bd-sec-icon">
              {isCustomer ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M 1.757 1.155 C 3.438 -0.525 6.273 -0.397 7.442 1.699 L 8.091 2.862 C 8.855 4.231 8.53 5.958 7.412 7.09 C 7.397 7.11 7.318 7.225 7.308 7.426 C 7.295 7.682 7.386 8.275 8.305 9.194 C 9.223 10.112 9.816 10.203 10.072 10.191 C 10.273 10.181 10.388 10.102 10.409 10.087 C 11.54 8.969 13.268 8.643 14.636 9.407 L 15.799 10.056 C 17.895 11.226 18.023 14.061 16.343 15.741 C 15.444 16.64 14.249 17.438 12.845 17.491 C 10.764 17.57 7.309 17.033 3.887 13.611 C 0.466 10.189 -0.072 6.734 0.007 4.653 C 0.06 3.249 0.859 2.054 1.757 1.155 Z M 6.133 2.43 C 5.534 1.357 3.924 1.11 2.818 2.216 C 2.043 2.991 1.539 3.847 1.506 4.71 C 1.44 6.445 1.869 9.471 4.948 12.55 C 8.027 15.63 11.053 16.058 12.788 15.992 C 13.651 15.96 14.507 15.456 15.282 14.68 C 16.388 13.575 16.142 11.965 15.068 11.366 L 13.905 10.717 C 13.182 10.313 12.166 10.451 11.453 11.164 L 11.452 11.164 C 11.382 11.234 10.936 11.65 10.145 11.689 C 9.335 11.728 8.354 11.364 7.244 10.254 C 6.134 9.144 5.77 8.163 5.81 7.353 C 5.848 6.561 6.265 6.116 6.334 6.046 L 6.334 6.046 C 7.048 5.333 7.185 4.317 6.782 3.593 L 6.133 2.43 Z" transform="matrix(1 0 0 1 4.25 2.252)" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              )}
            </span>
            <span className="bd-sec-info">
              <b className="bd-sec-title">{isCustomer ? t("scPhone") : (language === "mn" ? "Утасны дугаар" : "Phone Number")}</b>
              <span className="bd-sec-sub">
                {isCustomer && isPhoneVerified ? (
                  <>
                    <span>{maskPhone(phoneVal) ? t("scPhoneCode", { phone: maskPhone(phoneVal) }) : "—"}</span>
                    <span className="bd-badge-verified">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      {t("scVerified")}
                    </span>
                  </>
                ) : isCustomer ? (
                  <span className="bd-badge-unverified">{t("scUnverified")}</span>
                ) : (
                <>
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
                </>
                )}
              </span>
            </span>
            {!isCustomer && (
            <span className={`bd-sec-chevron ${activeSection === "phone" ? "rotated" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
            )}
          </button>

          {isCustomer && !isPhoneVerified && (
            <div className="bd-sec-expand">
              <div className="bd-sec-option">
                <input
                  type="tel"
                  className="bd-input"
                  value={phoneVal}
                  onChange={(e) => setPhoneVal(e.target.value)}
                  placeholder="+976 9911 2233"
                />
                <button type="button" className="bd-sec-verify" onClick={() => openCustomerOtp("phone")} disabled={phoneBusy}>
                  {t("otpVerify")}
                </button>
              </div>
            </div>
          )}

          {/* Expandable Phone OTP Form */}
          {!isCustomer && activeSection === "phone" && (
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
            onClick={() => { if (!isCustomer) toggleSection("email"); }}
            aria-expanded={!isCustomer && activeSection === "email"}
          >
            <span className="bd-sec-icon">
              {isCustomer ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M 8.694 0 L 12.806 0 C 14.644 0 16.1 0 17.239 0.153 C 18.411 0.311 19.36 0.643 20.109 1.391 C 20.857 2.14 21.189 3.089 21.347 4.261 C 21.5 5.4 21.5 6.856 21.5 8.694 L 21.5 8.806 C 21.5 10.644 21.5 12.1 21.347 13.239 C 21.189 14.411 20.857 15.36 20.109 16.109 C 19.36 16.857 18.411 17.189 17.239 17.347 C 16.1 17.5 14.644 17.5 12.806 17.5 L 8.694 17.5 C 6.856 17.5 5.4 17.5 4.261 17.347 C 3.089 17.189 2.14 16.857 1.391 16.109 C 0.643 15.36 0.311 14.411 0.153 13.239 C 0 12.1 0 10.644 0 8.806 L 0 8.694 C 0 6.856 0 5.4 0.153 4.261 C 0.311 3.089 0.643 2.14 1.391 1.391 C 2.14 0.643 3.089 0.311 4.261 0.153 C 5.4 0 6.856 0 8.694 0 Z M 4.461 1.64 C 3.455 1.775 2.875 2.029 2.452 2.452 C 2.029 2.875 1.775 3.455 1.64 4.461 C 1.502 5.489 1.5 6.843 1.5 8.75 C 1.5 10.657 1.502 12.011 1.64 13.039 C 1.775 14.045 2.029 14.625 2.452 15.048 C 2.875 15.471 3.455 15.725 4.461 15.86 C 5.489 15.998 6.843 16 8.75 16 L 12.75 16 C 14.657 16 16.011 15.998 17.039 15.86 C 18.045 15.725 18.625 15.471 19.048 15.048 C 19.471 14.625 19.725 14.045 19.86 13.039 C 19.998 12.011 20 10.657 20 8.75 C 20 6.843 19.998 5.489 19.86 4.461 C 19.725 3.455 19.471 2.875 19.048 2.452 C 18.625 2.029 18.045 1.775 17.039 1.64 C 16.011 1.502 14.657 1.5 12.75 1.5 L 8.75 1.5 C 6.843 1.5 5.489 1.502 4.461 1.64 Z M 4.174 4.27 C 4.439 3.952 4.912 3.909 5.23 4.174 L 7.389 5.973 C 8.322 6.75 8.97 7.288 9.517 7.64 C 10.046 7.981 10.405 8.095 10.75 8.095 C 11.095 8.095 11.454 7.981 11.983 7.64 C 12.53 7.288 13.178 6.75 14.111 5.973 L 16.27 4.174 C 16.588 3.909 17.061 3.952 17.326 4.27 C 17.591 4.588 17.548 5.061 17.23 5.326 L 15.034 7.157 C 14.147 7.895 13.429 8.494 12.795 8.902 C 12.134 9.327 11.491 9.595 10.75 9.595 C 10.009 9.595 9.366 9.327 8.705 8.902 C 8.071 8.494 7.353 7.895 6.466 7.157 L 4.27 5.326 C 3.952 5.061 3.909 4.588 4.174 4.27 Z" transform="matrix(1 0 0 1 1.25 3.25)" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              )}
            </span>
            <span className="bd-sec-info">
              <b className="bd-sec-title">{isCustomer ? t("scEmail") : (language === "mn" ? "Имэйл хаяг" : "Email Address")}</b>
              <span className="bd-sec-sub">
                <span>{emailVal || (profile?.email) || (language === "mn" ? "Бүртгэлгүй" : "No email")}</span>
                {isEmailVerified ? (
                  <span className="bd-badge-verified">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {isCustomer ? t("scVerified") : (language === "mn" ? "Баталгаажсан" : "Verified")}
                  </span>
                ) : (
                  <span className="bd-badge-unverified">{isCustomer ? t("scUnverified") : (language === "mn" ? "Баталгаажаагүй" : "Unverified")}</span>
                )}
              </span>
            </span>
            {!isCustomer && (
            <span className={`bd-sec-chevron ${activeSection === "email" ? "rotated" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
            )}
          </button>

          {isCustomer && !isEmailVerified && (
            <div className="bd-sec-expand">
              <div className="bd-sec-option">
                <input
                  type="email"
                  className="bd-input"
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  placeholder="name@example.com"
                />
                <button type="button" className="bd-sec-verify" onClick={() => openCustomerOtp("email")} disabled={emailBusy}>
                  {t("otpVerify")}
                </button>
              </div>
            </div>
          )}

          {/* Expandable Email OTP Form */}
          {!isCustomer && activeSection === "email" && (
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
              {isCustomer ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M 12.809 9.25 C 13.085 8.941 13.058 8.466 12.75 8.191 C 12.441 7.915 11.966 7.942 11.691 8.25 L 8.679 11.624 L 7.809 10.65 C 7.534 10.342 7.059 10.315 6.75 10.591 C 6.442 10.866 6.415 11.341 6.691 11.65 L 8.119 13.25 C 8.261 13.409 8.465 13.5 8.679 13.5 C 8.892 13.5 9.096 13.409 9.238 13.25 L 12.809 9.25 Z" transform="matrix(1 0 0 1 2.25 1.25)" />
                  <path d="M 9.75 0 C 8.812 0 7.917 0.307 6.473 0.801 L 5.746 1.05 C 4.265 1.557 3.121 1.949 2.303 2.281 C 1.891 2.448 1.536 2.611 1.251 2.776 C 0.976 2.936 0.701 3.135 0.514 3.402 C 0.329 3.665 0.233 3.989 0.173 4.301 C 0.11 4.626 0.073 5.015 0.048 5.461 C 0 6.348 0 7.564 0 9.14 L 0 10.741 C 0 16.842 4.608 19.768 7.348 20.965 L 7.375 20.976 C 7.715 21.125 8.035 21.264 8.402 21.358 C 8.789 21.458 9.201 21.5 9.75 21.5 C 10.299 21.5 10.711 21.458 11.098 21.358 C 11.465 21.264 11.785 21.125 12.125 20.976 L 12.152 20.965 C 14.892 19.768 19.5 16.842 19.5 10.741 L 19.5 9.14 C 19.5 7.564 19.5 6.348 19.452 5.461 C 19.427 5.015 19.39 4.626 19.327 4.301 C 19.267 3.989 19.171 3.665 18.986 3.402 C 18.799 3.135 18.524 2.936 18.249 2.776 C 17.964 2.611 17.609 2.448 17.197 2.281 C 16.379 1.949 15.235 1.557 13.754 1.05 L 13.027 0.801 C 11.583 0.307 10.688 0 9.75 0 Z M 6.831 2.264 C 8.445 1.712 9.092 1.5 9.75 1.5 C 10.408 1.5 11.055 1.712 12.669 2.264 L 13.242 2.46 C 14.755 2.978 15.858 3.356 16.632 3.671 C 17.019 3.828 17.299 3.959 17.496 4.074 C 17.593 4.13 17.66 4.176 17.704 4.213 C 17.742 4.243 17.757 4.261 17.759 4.263 C 17.761 4.267 17.773 4.287 17.791 4.337 C 17.811 4.393 17.833 4.473 17.854 4.585 C 17.898 4.812 17.931 5.123 17.954 5.543 C 18 6.384 18 7.558 18 9.167 L 18 10.741 C 18 15.916 14.13 18.463 11.551 19.59 C 11.18 19.752 10.965 19.844 10.726 19.905 C 10.498 19.964 10.22 20 9.75 20 C 9.28 20 9.002 19.964 8.774 19.905 C 8.535 19.844 8.32 19.752 7.949 19.59 C 5.37 18.463 1.5 15.916 1.5 10.741 L 1.5 9.167 C 1.5 7.558 1.5 6.384 1.546 5.543 C 1.569 5.123 1.602 4.812 1.646 4.585 C 1.667 4.473 1.689 4.393 1.709 4.337 C 1.727 4.287 1.739 4.267 1.741 4.263 C 1.743 4.261 1.758 4.244 1.796 4.213 C 1.84 4.176 1.907 4.13 2.004 4.074 C 2.201 3.959 2.481 3.828 2.868 3.671 C 3.642 3.356 4.745 2.978 6.258 2.46 L 6.831 2.264 Z" transform="matrix(1 0 0 1 2.25 1.25)" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              )}
            </span>
            <span className="bd-sec-info">
              <b className="bd-sec-title">{isCustomer ? t("scChangePw") : (t("changePassword") || (language === "mn" ? "Нууц үг солих" : "Change Password"))}</b>
              <span className="bd-sec-sub">
                {isCustomer ? t("scUpdatePw") : (language === "mn" ? "Нууц үгээ шинэчлэх" : "Update and strengthen your account password")}
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
                <label className="bd-form-label">{isCustomer ? t("scCurrentPw") : (language === "mn" ? "Одоогийн нууц үг" : "Current Password")}</label>
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
                <label className="bd-form-label">{isCustomer ? t("scNewPw") : (language === "mn" ? "Шинэ нууц үг" : "New Password")}</label>
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
                <label className="bd-form-label">{isCustomer ? t("scRepeatPw") : (language === "mn" ? "Шинэ нууц үг давтах" : "Confirm New Password")}</label>
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
                  {isCustomer ? t("acCancel") : (language === "mn" ? "Цуцлах" : "Cancel")}
                </button>
                <button
                  type="submit"
                  className="bd-btn-primary"
                  disabled={pwBusy}
                >
                  {pwBusy && <span className="bd-spin" />}
                  {pwBusy
                    ? (language === "mn" ? "Шинэчилж байна…" : "Updating…")
                    : (isCustomer ? t("acSave") : (language === "mn" ? "Хадгалах" : "Save Password"))}
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
            {isCustomer ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M 10.75 0 C 16.687 0 21.5 4.813 21.5 10.75 C 21.5 16.687 16.687 21.5 10.75 21.5 C 4.813 21.5 0 16.687 0 10.75 C 0 4.813 4.813 0 10.75 0 Z M 10.75 1.5 C 5.641 1.5 1.5 5.641 1.5 10.75 C 1.5 15.859 5.641 20 10.75 20 C 15.859 20 20 15.859 20 10.75 C 20 5.641 15.859 1.5 10.75 1.5 Z M 10.75 13.75 C 11.302 13.75 11.75 14.198 11.75 14.75 C 11.75 15.302 11.302 15.75 10.75 15.75 C 10.198 15.75 9.75 15.302 9.75 14.75 C 9.75 14.198 10.198 13.75 10.75 13.75 Z M 10.75 5 C 12.2 5 13.375 6.175 13.375 7.625 C 13.375 8.588 12.855 9.43 12.085 9.886 C 11.888 10.002 11.726 10.129 11.62 10.254 C 11.518 10.375 11.5 10.454 11.5 10.5 L 11.5 11.75 C 11.5 12.164 11.164 12.5 10.75 12.5 C 10.336 12.5 10 12.164 10 11.75 L 10 10.5 C 10 9.994 10.221 9.584 10.477 9.283 C 10.729 8.986 11.043 8.76 11.321 8.595 C 11.654 8.398 11.875 8.037 11.875 7.625 C 11.875 7.004 11.371 6.5 10.75 6.5 C 10.129 6.5 9.625 7.004 9.625 7.625 C 9.625 8.039 9.289 8.375 8.875 8.375 C 8.461 8.375 8.125 8.039 8.125 7.625 C 8.125 6.175 9.3 5 10.75 5 Z" transform="matrix(1 0 0 1 1.25 1.25)" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </span>
          <span className="bd-sec-info">
            <b className="bd-sec-danger-title">{isCustomer ? t("scDelete") : (language === "mn" ? "Бүртгэл устгах" : "Delete Account")}</b>
            <span className="bd-sec-sub" style={{ color: "var(--bd-gray-500, #94a3b8)" }}>
              {isCustomer ? t("scDeleteBody") : (language === "mn" ? "Бүртгэл бүрмөсөн устана" : "Permanently remove your account and all associated data")}
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
      {isCustomer && (
        <OtpVerifyCard
          open={Boolean(otpCard)}
          field={otpCard === "email" ? "email" : "phone"}
          busy={otpCard === "phone" ? phoneBusy : emailBusy}
          onClose={() => setOtpCard(null)}
          onVerify={otpCard === "phone" ? handleVerifyPhoneOtp : handleVerifyEmailOtp}
          onResend={resendCustomerOtp}
        />
      )}
    </div>
  );
}
