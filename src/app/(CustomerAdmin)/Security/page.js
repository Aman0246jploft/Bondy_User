"use client";

import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumber } from "react-phone-number-input";
import apiClient from "../../../api/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

function SecurityPageContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Active checklist item dropdown
  const [activeTab, setActiveTab] = useState(null); // 'phone', 'email'

  // Verification states
  const [phoneVal, setPhoneVal] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  const [emailVal, setEmailVal] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();
    document.title = (t("security") || "Security") + " - Bondy";
  }, []);

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
        setIsEditingPhone(!u.verifications?.phone?.isVerified);
        setIsEditingEmail(!u.verifications?.email?.isVerified);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error(t("failedToLoadProfile") || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // Toggle active accordion tab
  const toggleTab = (tab) => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
    }
  };

  // 1. Phone Verification Handlers
  const handleSendPhoneOtp = async () => {
    if (!phoneVal) {
      toast.error(t("enterPhoneNumber") || "Please enter a valid phone number");
      return;
    }
    let finalCountryCode = "+91";
    let finalContactNumber = phoneVal;
    try {
      const parsed = parsePhoneNumber(phoneVal.startsWith("+") ? phoneVal : `+${phoneVal}`);
      if (parsed) {
        finalCountryCode = `+${parsed.countryCallingCode}`;
        finalContactNumber = parsed.nationalNumber;
      }
    } catch (phoneErr) {
      console.warn("Phone parsing failed", phoneErr);
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post("/verification/phone/send-otp", {
        countryCode: finalCountryCode,
        contactNumber: finalContactNumber
      });
      if (res?.status) {
        toast.success(t("phoneOtpSent") || res.message || "OTP sent successfully to your phone number!");
        setPhoneOtpSent(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("failedToSendPhoneOtp") || "Failed to send phone OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) {
      toast.error(t("enterReceivedOtp") || "Please enter the OTP received");
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiClient.post("/verification/phone/verify-otp", {
        otp: phoneOtp
      });
      if (res?.status) {
        toast.success(t("phoneNumberVerified") || "Phone number verified successfully!");
        setPhoneOtpSent(false);
        setPhoneOtp("");
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("invalidOtp") || "Invalid OTP");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Email Verification Handlers
  const handleSendEmailOtp = async () => {
    if (!emailVal) {
      toast.error(t("enterValidEmail") || "Please enter a valid email address");
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiClient.post("/verification/email/send-otp", {
        email: emailVal
      });
      if (res?.status) {
        toast.success(t("emailOtpSent") || res.message || "OTP sent successfully to your email!");
        setEmailOtpSent(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("failedToSendEmailOtp") || "Failed to send email OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp) {
      toast.error(t("enterReceivedOtp") || "Please enter the OTP received");
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiClient.post("/verification/email/verify-otp", {
        otp: emailOtp
      });
      if (res?.status) {
        toast.success(t("emailVerified") || "Email verified successfully!");
        setEmailOtpSent(false);
        setEmailOtp("");
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("invalidOtp") || "Invalid OTP");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-teal" role="status" style={{ color: "#23ada4" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const isPhoneVerified = profile?.verifications?.phone?.isVerified || false;
  const isEmailVerified = profile?.verifications?.email?.isVerified || false;
  const allVerified = isPhoneVerified && isEmailVerified;

  return (
    <div className="cards verification-container">
      {/* Back to Profile */}
      <Link href="/Personalinfo" className="back-btn mb-4">
        <ArrowLeft size={18} className="me-2" />
        <span>{t("backToProfile") || "Back to Profile"}</span>
      </Link>

      {/* Main Status Header */}
      {allVerified ? (
        <div className="status-banner-card verified">
          <div className="status-card-left">
            <CheckCircle size={32} className="text-teal" />
            <div className="status-text-details">
              <h4>{t("verified") || "Verified"}</h4>
              <p>{t("profileFullyVerified") || "Your profile security details are verified."}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="status-banner-card unverified">
          <div className="status-card-left">
            <AlertCircle size={32} className="text-warning" />
            <div className="status-text-details">
              <h4>{t("notVerified") || "Not Verified"}</h4>
              <p>{t("completeChecksRemaining") || "Complete the remaining verification checks below to secure your account."}</p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Checklist */}
      <div className="verification-checklist-sec mt-4">
        <h5 className="section-subtitle">{t("verificationChecklist") || "Verification Checklist"}</h5>
        <p className="section-helper-text">{t("tapEachToComplete") || "Tap each item to view details and complete."}</p>

        <div className="checklist-items-stack">
          {/* 1. Phone Number */}
          <div className="checklist-wrapper-card">
            <div className="checklist-header" onClick={() => toggleTab("phone")}>
              <div className="checklist-header-left">
                <div className="icon-wrapper">
                  <Phone size={20} className="text-teal" />
                </div>
                <div className="checklist-header-title">
                  <h6>{t("phoneNumber") || "Phone Number"}</h6>
                  <p>{t("verifiedDuringRegistration") || "Verified during registration"}</p>
                </div>
              </div>
              <div className="checklist-header-right">
                {isPhoneVerified ? (
                  <span className="badge-status verified">{t("verified") || "Verified"}</span>
                ) : (
                  <span className="badge-status required">{t("required") || "Required"}</span>
                )}
                {activeTab === "phone" ? <ChevronUp size={20} className="ms-3 text-muted" /> : <ChevronDown size={20} className="ms-3 text-muted" />}
              </div>
            </div>

            {activeTab === "phone" && (
              <div className="checklist-content-body">
                {isPhoneVerified && !isEditingPhone ? (
                  <div className="d-flex align-items-center justify-content-between py-2">
                    <div className="d-flex align-items-center text-teal gap-2">
                      <CheckCircle size={18} />
                      <span>{t("phoneSuccessfullyVerified", { number: phoneVal })}</span>
                    </div>
                    <button className="custom-btn" onClick={() => setIsEditingPhone(true)}>
                      {t("change") || "Change"}
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light">{t("phoneNumber") || "Phone Number"}</Form.Label>
                      <div className="d-flex gap-2 align-items-center">
                        <div className="phone_input_wrapper flex-grow-1">
                          <PhoneInput
                            country={"us"}
                            value={phoneVal}
                            onChange={(phone) => setPhoneVal("+" + phone)}
                            inputClass="form-control"
                            containerClass="security-phone-input react-tel-input"
                            dropdownClass="security-phone-dropdown"
                            buttonClass="security-phone-button"
                          />
                        </div>
                        <button className="custom-btn" onClick={handleSendPhoneOtp} disabled={submitting}>
                          {phoneOtpSent ? (t("resendOtp") || "Resend OTP") : (t("saveSendOtp") || "Save & Send OTP")}
                        </button>
                        {isPhoneVerified && (
                          <button
                            className="custom-btn btn-secondary"
                            style={{ backgroundColor: "#374151", borderColor: "#374151" }}
                            onClick={() => {
                              setIsEditingPhone(false);
                              setPhoneOtpSent(false);
                              if (profile) {
                                const combined = profile.contactNumber
                                  ? profile.countryCode
                                    ? `${profile.countryCode}${profile.contactNumber}`
                                    : profile.contactNumber
                                  : "";
                                setPhoneVal(combined.startsWith("+") ? combined : `+${combined}`);
                              }
                            }}
                          >
                            {t("cancel") || "Cancel"}
                          </button>
                        )}
                      </div>
                    </Form.Group>

                    {phoneOtpSent && (
                      <Form.Group className="mb-3">
                        <Form.Label className="text-light">{t("enter5DigitOtp") || "Enter 5-Digit OTP"}</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="text"
                            className="custom-input-dark"
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value)}
                            placeholder={t("enterOtpPlaceholder") || "Enter OTP (e.g. 12345)"}
                          />
                          <button className="custom-btn" onClick={handleVerifyPhoneOtp} disabled={submitting}>
                            {t("verify") || "Verify"}
                          </button>
                        </div>
                      </Form.Group>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Email Address */}
          <div className="checklist-wrapper-card">
            <div className="checklist-header" onClick={() => toggleTab("email")}>
              <div className="checklist-header-left">
                <div className="icon-wrapper">
                  <Mail size={20} className="text-teal" />
                </div>
                <div className="checklist-header-title">
                  <h6>{t("email") || "Email"}</h6>
                  <p>{t("verifyYourEmail") || "Verify your email address"}</p>
                </div>
              </div>
              <div className="checklist-header-right">
                {isEmailVerified ? (
                  <span className="badge-status verified">{t("verified") || "Verified"}</span>
                ) : (
                  <span className="badge-status required">{t("required") || "Required"}</span>
                )}
                {activeTab === "email" ? <ChevronUp size={20} className="ms-3 text-muted" /> : <ChevronDown size={20} className="ms-3 text-muted" />}
              </div>
            </div>

            {activeTab === "email" && (
              <div className="checklist-content-body">
                {isEmailVerified && !isEditingEmail ? (
                  <div className="d-flex align-items-center justify-content-between py-2">
                    <div className="d-flex align-items-center text-teal gap-2">
                      <CheckCircle size={18} />
                      <span>{t("emailSuccessfullyVerified", { email: emailVal })}</span>
                    </div>
                    <button className="custom-btn" onClick={() => setIsEditingEmail(true)}>
                      {t("change") || "Change"}
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light">{t("emailAddress") || "Email Address"}</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control
                          type="email"
                          className="custom-input-dark"
                          value={emailVal}
                          onChange={(e) => setEmailVal(e.target.value)}
                          placeholder="name@example.com"
                        />
                        <button className="custom-btn" onClick={handleSendEmailOtp} disabled={submitting}>
                          {emailOtpSent ? (t("resendOtp") || "Resend OTP") : (t("saveSendOtp") || "Save & Send OTP")}
                        </button>
                        {isEmailVerified && (
                          <button
                            className="custom-btn btn-secondary"
                            style={{ backgroundColor: "#374151", borderColor: "#374151" }}
                            onClick={() => {
                              setIsEditingEmail(false);
                              setEmailOtpSent(false);
                              if (profile) {
                                setEmailVal(profile.email || "");
                              }
                            }}
                          >
                            {t("cancel") || "Cancel"}
                          </button>
                        )}
                      </div>
                    </Form.Group>

                    {emailOtpSent && (
                      <Form.Group className="mb-3">
                        <Form.Label className="text-light">{t("enter5DigitOtp") || "Enter 5-Digit OTP"}</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="text"
                            className="custom-input-dark"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value)}
                            placeholder={t("enterOtpPlaceholder") || "Enter OTP (e.g. 12345)"}
                          />
                          <button className="custom-btn" onClick={handleVerifyEmailOtp} disabled={submitting}>
                            {t("verify") || "Verify"}
                          </button>
                        </div>
                      </Form.Group>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="verification-secure-footer mt-4">
        <span>{t("infoSecureFooter") || "Your information is secure. Used only for verification and account safety."}</span>
      </div>

      <style jsx>{`
        .verification-container {
          background-color: #161616;
          border-radius: 20px;
          padding: 25px;
          color: #fff;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          color: #9ca3af;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .back-btn:hover {
          color: #23ada4;
        }

        .status-banner-card {
          border-radius: 16px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .status-banner-card.verified {
          background-color: rgba(35, 173, 164, 0.08);
          border: 1px solid rgba(35, 173, 164, 0.3);
        }

        .status-banner-card.unverified {
          background-color: rgba(255, 190, 93, 0.06);
          border: 1px solid rgba(255, 190, 93, 0.2);
        }

        .status-card-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .status-text-details h4 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .status-text-details p {
          font-size: 14px;
          color: #9ca3af;
          margin: 0;
        }

        .section-subtitle {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .section-helper-text {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .checklist-items-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checklist-wrapper-card {
          background-color: #202020;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .checklist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-radius: 14px;
        }

        .checklist-header:hover {
          background-color: #252525;
        }

        .checklist-header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background-color: rgba(35, 173, 164, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checklist-header-title h6 {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 2px 0;
          color: #fff;
        }

        .checklist-header-title p {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        .checklist-header-right {
          display: flex;
          align-items: center;
        }

        .badge-status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 30px;
        }

        .badge-status.verified {
          background-color: rgba(35, 173, 164, 0.15);
          color: #23ada4;
          border: 1px solid rgba(35, 173, 164, 0.3);
        }

        .badge-status.required {
          background-color: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .checklist-content-body {
          padding: 20px;
          background-color: #1a1a1a;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
        }

        .custom-input-dark {
          background-color: #262626 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
          border-radius: 8px !important;
          height: 46px !important;
        }

        .custom-input-dark:focus {
          border-color: #23ada4 !important;
          box-shadow: none !important;
        }

        .custom-btn {
          border: 1px solid var(--primary-teal);
          background-color: var(--primary-teal);
          color: #fff;
          font-weight: 500;
          font-size: 14px;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 46px;
        }

        .custom-btn:hover {
          background-color: #1a9c94;
          border-color: #1a9c94;
        }

        .custom-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .custom-btn.btn-secondary {
          background-color: #374151;
          border-color: #374151;
        }

        .custom-btn.btn-secondary:hover {
          background-color: #4b5563;
          border-color: #4b5563;
        }

        .verification-secure-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #6b7280;
        }

        /* Phone Input Overrides for Security Page */
        :global(.security-phone-input) {
          width: 100%;
          position: relative !important;
        }
        :global(.security-phone-input .form-control) {
          background-color: #262626 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
          border-radius: 8px !important;
          height: 46px !important;
          width: 100% !important;
          padding-left: 48px !important;
        }
        :global(.security-phone-input .form-control:focus) {
          border-color: #23ada4 !important;
          box-shadow: none !important;
        }
        :global(.security-phone-input .flag-dropdown) {
          background-color: transparent !important;
          border: none !important;
          border-radius: 8px 0 0 8px !important;
        }
        :global(.security-phone-input .selected-flag) {
          background-color: transparent !important;
          padding: 0 0 0 12px !important;
          border-radius: 8px 0 0 8px !important;
          width: 44px !important;
        }
        :global(.security-phone-input .selected-flag:hover),
        :global(.security-phone-input .selected-flag:focus) {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        :global(.security-phone-input .country-list) {
          position: absolute !important;
          z-index: 1050 !important;
          list-style: none !important;
          padding: 0 !important;
          margin: 4px 0 0 0 !important;
          background-color: #262626 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
          border-radius: 8px !important;
          max-height: 220px !important;
          overflow-y: auto !important;
          width: 320px !important;
          max-width: 90vw !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          top: 100% !important;
          left: 0 !important;
          text-align: left !important;
        }
        :global(.security-phone-input .country-list .country:hover) {
          background-color: rgba(35, 173, 164, 0.1) !important;
        }
        :global(.security-phone-input .country-list .country.highlight) {
          background-color: rgba(35, 173, 164, 0.2) !important;
        }
        :global(.security-phone-input .country-list .search-box) {
          background-color: #1a1a1a !important;
          color: #fff !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <SecurityPageContent />
    </ProtectedRoute>
  );
}
