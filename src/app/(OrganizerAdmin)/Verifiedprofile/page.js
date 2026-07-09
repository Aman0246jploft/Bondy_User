"use client";

import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Phone,
  Mail,
  FileText,
  Landmark,
  UserCheck,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  ArrowLeft,
  Upload,
  RefreshCw
} from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumber } from "react-phone-number-input";
import apiClient from "../../../api/apiClient";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "../../../utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

function VerificationPageContent() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "/img/sidebar-logo.svg";
  };

  // Active checklist item dropdown
  const [activeTab, setActiveTab] = useState(null); // 'phone', 'email', 'identity', 'bank', 'profile'

  // Verification states
  const [phoneVal, setPhoneVal] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  const [emailVal, setEmailVal] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [idType, setIdType] = useState("nationalId"); // "nationalId" or "drivingLicence"

  // Business verification states
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [socialMediaLink, setSocialMediaLink] = useState("");
  const [isEditingProfileFields, setIsEditingProfileFields] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);

  // Docs uploads
  const [nationalIdFront, setNationalIdFront] = useState(null);
  const [nationalIdBack, setNationalIdBack] = useState(null);
  const fileRefFront = useRef(null);
  const fileRefBack = useRef(null);

  // Bank Account states
  const [banksList, setBanksList] = useState([]);
  const [bankAccount, setBankAccount] = useState({
    bankName: "",
    bankHolderName: "",
    accountNumber: "",
    otherDetails: ""
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchBanks();
    fetchCategories();
    document.title = t("organizerVerificationTitle") || "Organizer Verification - Bondy";
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
        setIsEditingBank(!u.verifications?.bankVerification?.isVerified);

        const natStatus = u.verifications?.idVerification?.nationalId?.status || "unverified";
        const licStatus = u.verifications?.idVerification?.drivingLicence?.status || "unverified";
        const verifiedId = natStatus === "approved" || licStatus === "approved";
        const pendingId = natStatus === "pending" || licStatus === "pending";
        setIsEditingIdentity(!verifiedId && !pendingId);

        if (u.verifications?.idVerification?.nationalId) {
          setNationalIdFront(u.verifications.idVerification.nationalId.frontImage || null);
          setNationalIdBack(u.verifications.idVerification.nationalId.backImage || null);
        } else if (u.verifications?.idVerification?.drivingLicence) {
          setNationalIdFront(u.verifications.idVerification.drivingLicence.frontImage || null);
          setNationalIdBack(u.verifications.idVerification.drivingLicence.backImage || null);
        }

        setBusinessName(u.businessName || "");
        setBusinessCategory(u.businessCategory || "");
        setShortDesc(u.shortDesc || "");
        setSocialMediaLink(u.socialMediaLink || "");
        setIsEditingProfileFields(u.organizerVerificationStatus !== "approved" && u.organizerVerificationStatus !== "pending");

        // Prefill existing bank verification details if any
        if (u.verifications?.bankVerification) {
          setBankAccount({
            bankName: u.verifications.bankVerification.bankName || "",
            bankHolderName: u.verifications.bankVerification.bankHolderName || "",
            accountNumber: u.verifications.bankVerification.accountNumber || "",
            otherDetails: u.verifications.bankVerification.otherDetails || ""
          });
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error(t("failedToLoadProfile") || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await apiClient.get("/verification/banks");
      if (res?.status && Array.isArray(res.data?.banks)) {
        setBanksList(res.data.banks);
      } else {
        // Fallback standard banks if list empty
        setBanksList([
          { _id: "1", bankName: "State Bank of India" },
          { _id: "2", bankName: "HDFC Bank" },
          { _id: "3", bankName: "ICICI Bank" },
          { _id: "4", bankName: "Bank of Mongolia" }
        ]);
      }
    } catch (err) {
      console.warn("Could not fetch banks list, using fallback:", err);
      setBanksList([
        { _id: "1", bankName: "State Bank of India" },
        { _id: "2", bankName: "HDFC Bank" },
        { _id: "3", bankName: "ICICI Bank" },
        { _id: "4", bankName: "Bank of Mongolia" }
      ]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/category/list", { params: { limit: 100 } });
      if (res?.status && Array.isArray(res.data?.categories)) {
        setCategoriesList(res.data.categories);
      }
    } catch (err) {
      console.warn("Could not fetch categories", err);
    }
  };

  const handleSubmitProfileFields = async () => {
    if (!businessName || !businessCategory) {
      toast.error(t("businessNameCategoryRequired") || "Business Name and Category are required");
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiClient.post("/user/organizer/info", {
        businessName,
        category: businessCategory,
        shortDesc,
        socialMediaLink
      });
      if (res?.status) {
        toast.success(t("organizerProfileSubmitted") || "Organizer profile submitted successfully!");
        setIsEditingProfileFields(false);
        fetchProfile();
      }
    } catch (err) {
      toast.error(t("failedToSubmitProfile") || "Failed to submit organizer profile details");
    } finally {
      setSubmitting(false);
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
        toast.success(res.message || t("phoneOtpSent") || "OTP sent successfully to your phone number!");
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
        toast.success(res.message || t("emailOtpSent") || "OTP sent successfully to your email!");
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

  // 3. Document upload handlers
  const handleDocUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);

    try {
      setSubmitting(true);
      const res = await authApi.uploadFile(formData);
      if (res.status && res.data?.files?.length > 0) {
        const fileUrl = res.data.files[0];
        if (type === "front") {
          setNationalIdFront(fileUrl);
        } else {
          setNationalIdBack(fileUrl);
        }
        toast.success(t("documentUploaded") || "Document uploaded successfully!");
      }
    } catch (err) {
      toast.error(t("failedToUploadDocument") || "Failed to upload document file");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitIdentity = async () => {
    if (!nationalIdFront || !nationalIdBack) {
      toast.error(t("uploadBothIdImages") || "Please upload both front and back images of your ID");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {};
      if (idType === "nationalId") {
        payload.nationalId = {
          frontImage: nationalIdFront,
          backImage: nationalIdBack
        };
      } else {
        payload.drivingLicence = {
          frontImage: nationalIdFront,
          backImage: nationalIdBack
        };
      }

      const res = await apiClient.post("/verification/submit", payload);
      if (res?.status) {
        toast.success(t("identitySubmitted") || "Identity documents submitted successfully!");
        setIsEditingIdentity(false);
        fetchProfile();
      }
    } catch (err) {
      toast.error(t("failedToSubmitId") || "Failed to submit ID verification");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Bank account handler
  const handleSubmitBank = async () => {
    if (!bankAccount.bankName || !bankAccount.bankHolderName || !bankAccount.accountNumber) {
      toast.error(t("fillRequiredBankDetails") || "Please fill in all required bank details");
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiClient.post("/verification/submit", {
        bankVerification: bankAccount
      });
      if (res?.status) {
        toast.success(t("bankSubmitted") || "Bank details submitted successfully!");
        setIsEditingBank(false);
        fetchProfile();
      }
    } catch (err) {
      toast.error(t("failedToSubmitBank") || "Failed to submit bank details");
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

  // Verification Mappings
  const isPhoneVerified = profile?.verifications?.phone?.isVerified || false;
  const isEmailVerified = profile?.verifications?.email?.isVerified || false;

  const nationalIdStatus = profile?.verifications?.idVerification?.nationalId?.status || "unverified";
  const drivingLicenceStatus = profile?.verifications?.idVerification?.drivingLicence?.status || "unverified";
  const isIdVerified = nationalIdStatus === "approved" || drivingLicenceStatus === "approved";
  const isIdPending = nationalIdStatus === "pending" || drivingLicenceStatus === "pending";

  const bankStatus = profile?.verifications?.bankVerification?.status || "unverified";
  const isBankVerified = bankStatus === "approved";
  const isBankPending = bankStatus === "pending";

  const isProfileReviewed = profile.businessVerificationStatus === "approved";
  const isProfilePending = profile.businessVerificationStatus === "pending";

  const allVerified = profile?.isAllVerified;

  return (
    <div className="cards verification-container">
      {/* Back to Profile */}
      <Link href="/OrganizerProfile" className="back-btn mb-4">
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
              <p>{t("profileFullyVerified") || "Your organizer profile is fully verified."}</p>
            </div>
          </div>
          {profile?.verifications?.allVerifiedAt && (
            <span className="status-date-tag">
              {t("verifiedOn") || "Verified on"} {new Date(profile?.verifications.allVerifiedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      ) : (
        <div className="status-banner-card unverified">
          <div className="status-card-left">
            <AlertCircle size={32} className="text-warning" />
            <div className="status-text-details">
              <h4>{t("notVerified") || "Not Verified"}</h4>
              <p>{t("completeChecksRemaining") || "Complete the remaining checks below to get the verified organizer badge."}</p>
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
                            containerClass="security-phone-input"
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

          {/* 3. Identity Document */}
          <div className="checklist-wrapper-card">
            <div className="checklist-header" onClick={() => toggleTab("identity")}>
              <div className="checklist-header-left">
                <div className="icon-wrapper">
                  <FileText size={20} className="text-teal" />
                </div>
                <div className="checklist-header-title">
                  <h6>{t("identityDocument") || "Identity Document"}</h6>
                  <p>{t("uploadAGovernmentId") || "Upload a government ID (National ID / License)"}</p>
                </div>
              </div>
              <div className="checklist-header-right">
                {isIdVerified ? (
                  <span className="badge-status verified">{t("verified") || "Verified"}</span>
                ) : isIdPending ? (
                  <span className="badge-status pending">{t("underReview") || "Under review"}</span>
                ) : (
                  <span className="badge-status required">{t("required") || "Required"}</span>
                )}
                {activeTab === "identity" ? <ChevronUp size={20} className="ms-3 text-muted" /> : <ChevronDown size={20} className="ms-3 text-muted" />}
              </div>
            </div>

            {activeTab === "identity" && (
              <div className="checklist-content-body">
                {!isEditingIdentity ? (
                  <div className="py-2">
                    {isIdVerified ? (
                      <div className="d-flex align-items-center text-teal gap-2 mb-3">
                        <CheckCircle size={18} />
                        <span>{t("idApprovedDesc") || "Your government ID has been reviewed and approved by administrators."}</span>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center text-warning gap-2 mb-3">
                        <RefreshCw size={18} className="spinner-icon" />
                        <span>{t("idPendingDesc") || "Your ID document submission is under review by our team. We'll update you shortly."}</span>
                      </div>
                    )}

                    {/* Render National ID details if they exist */}
                    {profile?.verifications?.idVerification?.nationalId?.frontImage && (
                      <div className="mb-4">
                        <span className="text-teal d-block mb-3 small fw-bold">{t("nationalIdCard") || "National ID Card"}</span>
                        <Row>
                          <Col md={6} className="mb-3">
                            <label className="text-muted mb-2 d-block small">{t("idCardFrontImage") || "ID Card Front Image"}</label>
                            <div className="uploader-box cursor-default" style={{ borderStyle: "solid" }}>
                              <img src={getFullImageUrl(profile.verifications.idVerification.nationalId.frontImage)} alt="Front Preview" className="preview-image" onError={handleImageError} />
                            </div>
                          </Col>
                          <Col md={6} className="mb-3">
                            <label className="text-muted mb-2 d-block small">{t("idCardBackImage") || "ID Card Back Image"}</label>
                            <div className="uploader-box cursor-default" style={{ borderStyle: "solid" }}>
                              <img src={getFullImageUrl(profile.verifications.idVerification.nationalId.backImage)} alt="Back Preview" className="preview-image" onError={handleImageError} />
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {/* Render Driving Licence details if they exist */}
                    {profile?.verifications?.idVerification?.drivingLicence?.frontImage && (
                      <div className="mb-4">
                        <span className="text-teal d-block mb-3 small fw-bold">{t("drivingLicence") || "Driving Licence"}</span>
                        <Row>
                          <Col md={6} className="mb-3">
                            <label className="text-muted mb-2 d-block small">{t("licenceFrontImage") || "Licence Front Image"}</label>
                            <div className="uploader-box cursor-default" style={{ borderStyle: "solid" }}>
                              <img src={getFullImageUrl(profile.verifications.idVerification.drivingLicence.frontImage)} alt="Front Preview" className="preview-image" onError={handleImageError} />
                            </div>
                          </Col>
                          <Col md={6} className="mb-3">
                            <label className="text-muted mb-2 d-block small">{t("licenceBackImage") || "Licence Back Image"}</label>
                            <div className="uploader-box cursor-default" style={{ borderStyle: "solid" }}>
                              <img src={getFullImageUrl(profile.verifications.idVerification.drivingLicence.backImage)} alt="Back Preview" className="preview-image" onError={handleImageError} />
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}

                    <div className="text-center">
                      <button className="custom-btn w-100 py-2 d-flex align-items-center justify-content-center gap-2" onClick={() => setIsEditingIdentity(true)}>
                        {t("updateIdDocument") || "Update ID Document"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    {isIdPending && (
                      <div className="alert alert-warning mb-3 py-2">
                        {t("resubmitIdWarning") || "Your submitted documents are currently under review. Resubmitting will start a new review process."}
                      </div>
                    )}
                    <div className="mb-3 col-lg-4">
                      <Form.Label className="text-light text-start d-block">{t("selectIdDocumentType") || "Select ID Document Type"}</Form.Label>
                      <Form.Select
                        className="custom-input-dark form-control"
                        value={idType}
                        onChange={(e) => {
                          setIdType(e.target.value);
                          setNationalIdFront(null);
                          setNationalIdBack(null);
                        }}
                      >
                        <option value="nationalId">{t("nationalIdCard") || "National ID Card"}</option>
                        <option value="drivingLicence">{t("drivingLicence") || "Driving Licence"}</option>
                      </Form.Select>
                    </div>

                    <Row>
                      <Col md={6} className="mb-3">
                        <label className="text-white mb-2">{idType === "nationalId" ? (t("idCardFrontImage") || "ID Card Front Image") : (t("licenceFrontImage") || "Licence Front Image")}</label>
                        <div
                          className="uploader-box"
                          onClick={() => fileRefFront.current.click()}
                        >
                          {nationalIdFront ? (
                            <img src={getFullImageUrl(nationalIdFront)} alt="Front Preview" className="preview-image" onError={handleImageError} />
                          ) : (
                            <div className="uploader-placeholder">
                              <Upload size={24} className="mb-2 text-teal" />
                              <span>{t("uploadFrontImage") || "Upload Front Image"}</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileRefFront}
                            style={{ display: "none" }}
                            onChange={(e) => handleDocUpload(e, "front")}
                          />
                        </div>
                      </Col>

                      <Col md={6} className="mb-3">
                        <label className="text-white mb-2">{idType === "nationalId" ? (t("idCardBackImage") || "ID Card Back Image") : (t("licenceBackImage") || "Licence Back Image")}</label>
                        <div
                          className="uploader-box"
                          onClick={() => fileRefBack.current.click()}
                        >
                          {nationalIdBack ? (
                            <img src={getFullImageUrl(nationalIdBack)} alt="Back Preview" className="preview-image" onError={handleImageError} />
                          ) : (
                            <div className="uploader-placeholder">
                              <Upload size={24} className="mb-2 text-teal" />
                              <span>{t("uploadBackImage") || "Upload Back Image"}</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileRefBack}
                            style={{ display: "none" }}
                            onChange={(e) => handleDocUpload(e, "back")}
                          />
                        </div>
                      </Col>
                    </Row>

                    <div className="text-end mt-3">
                      {(isIdVerified || isIdPending) && (
                        <button
                          className="custom-btn btn-secondary me-2"
                          style={{ backgroundColor: "#374151", borderColor: "#374151" }}
                          onClick={() => {
                            setIsEditingIdentity(false);
                            // Restore from profile
                            const nat = profile?.verifications?.idVerification?.nationalId;
                            const lic = profile?.verifications?.idVerification?.drivingLicence;
                            if (nat) {
                              setNationalIdFront(nat.frontImage || null);
                              setNationalIdBack(nat.backImage || null);
                            } else if (lic) {
                              setNationalIdFront(lic.frontImage || null);
                              setNationalIdBack(lic.backImage || null);
                            }
                          }}
                        >
                          {t("cancel") || "Cancel"}
                        </button>
                      )}
                      <button
                        className="custom-btn"
                        onClick={handleSubmitIdentity}
                        disabled={submitting || !nationalIdFront || !nationalIdBack}
                      >
                        {t("submitIdForReview") || "Submit ID for Review"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Bank Account */}
          <div className="checklist-wrapper-card">
            <div className="checklist-header" onClick={() => toggleTab("bank")}>
              <div className="checklist-header-left">
                <div className="icon-wrapper">
                  <Landmark size={20} className="text-teal" />
                </div>
                <div className="checklist-header-title">
                  <h6>{t("bankAccount") || "Bank Account"}</h6>
                  <p>{t("addBankAccountForPayouts") || "Add bank account for payouts"}</p>
                </div>
              </div>
              <div className="checklist-header-right">
                {isBankVerified ? (
                  <span className="badge-status verified">{t("verified") || "Verified"}</span>
                ) : isBankPending ? (
                  <span className="badge-status pending">{t("underReview") || "Under Review"}</span>
                ) : (
                  <span className="badge-status required">{t("required") || "Required"}</span>
                )}
                {activeTab === "bank" ? <ChevronUp size={20} className="ms-3 text-muted" /> : <ChevronDown size={20} className="ms-3 text-muted" />}
              </div>
            </div>

            {activeTab === "bank" && (
              <div className="checklist-content-body">
                {isBankVerified && !isEditingBank ? (
                  <div className="py-3">
                    {/* Verified Status Banner */}
                    <div className="d-flex flex-column align-items-center mb-4 text-center">
                      <div className="icon-wrapper mb-2" style={{ width: "60px", height: "60px", backgroundColor: "rgba(35, 173, 164, 0.1)" }}>
                        <Landmark size={32} className="text-teal" />
                      </div>
                      <h5 className="text-white mb-1" style={{ fontWeight: "600" }}>{t("verified") || "Verified"}</h5>
                      <p className="text-muted small">{t("bankAccountVerifiedDesc") || "Your bank account is verified."}</p>
                    </div>

                    {/* Bank Info Rows */}
                    <div className="p-3 mb-4" style={{ backgroundColor: "#262626", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                      <div className="d-flex justify-content-between py-2 border-bottom border-secondary" style={{ borderColor: "rgba(255,255,255,0.05) !important" }}>
                        <span className="text-muted small">{t("bankNameTitle") || "Bank Name"}</span>
                        <span className="text-white fw-bold small">{bankAccount.bankName}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-secondary" style={{ borderColor: "rgba(255,255,255,0.05) !important" }}>
                        <span className="text-muted small">{t("accountHolderNameLabel") || "Account Holder Name"}</span>
                        <span className="text-white fw-bold small">{bankAccount.bankHolderName}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-secondary" style={{ borderColor: "rgba(255,255,255,0.05) !important" }}>
                        <span className="text-muted small">{t("accountNumberLabel") || "Account Number"}</span>
                        <span className="text-white fw-bold small">
                          {bankAccount.accountNumber ? `**** **** **** ${bankAccount.accountNumber.slice(-4)}` : "N/A"}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-2">
                        <span className="text-muted small">{t("verifiedOn") || "Verified on"}</span>
                        <span className="text-white fw-bold small">
                          {profile?.verifications?.bankVerification?.verifiedAt
                            ? new Date(profile.verifications.bankVerification.verifiedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                            : new Date().toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <button className="custom-btn w-100 py-2 d-flex align-items-center justify-content-center gap-2" onClick={() => setIsEditingBank(true)}>
                        {t("updateBankAccount") || "Update Bank Account"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    {isBankPending && (
                      <div className="alert alert-warning mb-3 py-2">
                        {t("resubmitBankWarning") || "Bank details have been submitted and are currently pending verification. Updating below will submit a new request."}
                      </div>
                    )}
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-light">{t("bankNameTitle") || "Bank Name"}</Form.Label>
                          <Form.Select
                            className="custom-input-dark form-control"
                            value={bankAccount.bankName}
                            onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                          >
                            <option value="">{t("selectBank") || "Select Bank"}</option>
                            {banksList.map((b) => (
                              <option key={b._id} value={b.bankName}>
                                {b.bankName}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-light">{t("accountHolderNameLabel") || "Account Holder Name"}</Form.Label>
                          <Form.Control
                            type="text"
                            className="custom-input-dark"
                            value={bankAccount.bankHolderName}
                            onChange={(e) => setBankAccount({ ...bankAccount, bankHolderName: e.target.value })}
                            placeholder={t("accountHolderNameLabel") || "Account Holder Name"}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-light">{t("accountNumberLabel") || "Account Number"}</Form.Label>
                          <Form.Control
                            type="text"
                            className="custom-input-dark"
                            value={bankAccount.accountNumber}
                            onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                            placeholder={t("accountNumberLabel") || "Account Number"}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-end mt-4">
                      {isBankVerified && (
                        <button
                          className="custom-btn btn-secondary me-2"
                          style={{ backgroundColor: "#374151", borderColor: "#374151" }}
                          onClick={() => {
                            setIsEditingBank(false);
                            if (profile?.verifications?.bankVerification) {
                              setBankAccount({
                                bankName: profile.verifications.bankVerification.bankName || "",
                                bankHolderName: profile.verifications.bankVerification.bankHolderName || "",
                                accountNumber: profile.verifications.bankVerification.accountNumber || "",
                                otherDetails: profile.verifications.bankVerification.otherDetails || ""
                              });
                            }
                          }}
                        >
                          {t("cancel") || "Cancel"}
                        </button>
                      )}
                      <button
                        className="custom-btn"
                        onClick={handleSubmitBank}
                        disabled={submitting || !bankAccount.bankName || !bankAccount.bankHolderName || !bankAccount.accountNumber}
                      >
                        {t("submitBankDetails") || "Submit Bank Details"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Organizer Profile */}
          <div className="checklist-wrapper-card">
            <div className="checklist-header" onClick={() => toggleTab("profile")}>
              <div className="checklist-header-left">
                <div className="icon-wrapper">
                  <UserCheck size={20} className="text-teal" />
                </div>
                <div className="checklist-header-title">
                  <h6>{t("organizerProfile") || "Organizer Profile"}</h6>
                  <p>{t("weReviewPublicProfile") || "We'll review your public organizer profile details"}</p>
                </div>
              </div>
              <div className="checklist-header-right">
                {isProfileReviewed ? (
                  <span className="badge-status verified">{t("reviewed") || "Reviewed"}</span>
                ) : isProfilePending ? (
                  <span className="badge-status pending">{t("underReview") || "Under review"}</span>
                ) : (
                  <span className="badge-status required">{t("required") || "Required"}</span>
                )}
                {activeTab === "profile" ? <ChevronUp size={20} className="ms-3 text-muted" /> : <ChevronDown size={20} className="ms-3 text-muted" />}
              </div>
            </div>

            {activeTab === "profile" && (
              <div className="checklist-content-body">
                {!isEditingProfileFields ? (
                  <div className="py-3">
                    {/* Status Banner */}
                    <div className="d-flex flex-column align-items-center mb-4 text-center">
                      <div className="icon-wrapper mb-2" style={{ width: "60px", height: "60px", backgroundColor: "rgba(35, 173, 164, 0.1)" }}>
                        <UserCheck size={32} className="text-teal" />
                      </div>
                      <h5 className="text-white mb-1" style={{ fontWeight: "600" }}>{t("organizerProfileDetails") || "Organizer Profile Details"}</h5>
                      <p className="text-muted small">{t("statusLabel") || "Status:"} <strong className="text-white">{profile.organizerVerificationStatus ? (t(profile.organizerVerificationStatus.toLowerCase()) || profile.organizerVerificationStatus) : (t("unverified") || "unverified")}</strong></p>
                    </div>

                    {/* Business Details Info Rows */}
                    <div className="p-3 mb-4" style={{ backgroundColor: "#262626", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                      <div className="d-flex justify-content-between py-2 border-bottom border-secondary" style={{ borderColor: "rgba(255,255,255,0.05) !important" }}>
                        <span className="text-muted small">{t("businessNameLabel") || "Business Name"}</span>
                        <span className="text-white fw-bold small">{businessName || (t("notSet") || "Not Set")}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-secondary" style={{ borderColor: "rgba(255,255,255,0.05) !important" }}>
                        <span className="text-muted small">{t("businessCategory") || "Business Category"}</span>
                        <span className="text-white fw-bold small">
                          {(() => {
                            const cat = categoriesList.find(c => c._id === businessCategory);
                            if (cat) {
                              return language === "mn" ? (cat.name_thi || cat.name) : cat.name;
                            }
                            return businessCategory || (t("notSet") || "Not Set");
                          })()}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom border-secondary" style={{ borderColor: "rgba(255,255,255,0.05) !important" }}>
                        <span className="text-muted small">{t("shortDescription") || "Short Description"}</span>
                        <span className="text-white fw-bold small text-end" style={{ maxWidth: "250px" }}>{shortDesc || (t("notSet") || "Not Set")}</span>
                      </div>
                      <div className="d-flex justify-content-between py-2">
                        <span className="text-muted small">{t("socialMediaLinkLabel") || "Social Media Link"}</span>
                        <span className="text-white fw-bold small text-end text-truncate" style={{ maxWidth: "250px" }}>
                          {socialMediaLink ? (
                            <a href={socialMediaLink.startsWith("http") ? socialMediaLink : `https://${socialMediaLink}`} target="_blank" rel="noopener noreferrer" className="text-teal">
                              {socialMediaLink}
                            </a>
                          ) : (t("notSet") || "Not Set")}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <button className="custom-btn w-100 py-2 d-flex align-items-center justify-content-center gap-2" onClick={() => setIsEditingProfileFields(true)}>
                        {t("updateProfileDetails") || "Update Profile Details"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-light">{t("businessNameLabel") || "Business Name"}</Form.Label>
                          <Form.Control
                            type="text"
                            className="custom-input-dark"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder={t("businessNameLabel") || "Business Name"}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="text-light">{t("businessCategory") || "Business Category"}</Form.Label>
                          <Form.Select
                            className="custom-input-dark form-control"
                            value={businessCategory}
                            onChange={(e) => setBusinessCategory(e.target.value)}
                          >
                            <option value="">{t("selectCategory") || "Select Category"}</option>
                            {categoriesList.map((c) => (
                              <option key={c._id} value={c._id}>
                                {language === "mn" ? (c.name_thi || c.name) : c.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="text-light">{t("shortDescription") || "Short Description"}</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            className="custom-input-dark"
                            style={{ height: "auto" }}
                            value={shortDesc}
                            onChange={(e) => setShortDesc(e.target.value)}
                            placeholder={t("briefBusinessDescPlaceholder") || "Brief description about your business..."}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="text-light">{t("socialMediaLinkLabel") || "Social Media Link"}</Form.Label>
                          <Form.Control
                            type="text"
                            className="custom-input-dark"
                            value={socialMediaLink}
                            onChange={(e) => setSocialMediaLink(e.target.value)}
                            placeholder={t("socialMediaPlaceholder") || "e.g. instagram.com/mybusiness"}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-end mt-4">
                      <button
                        className="custom-btn btn-secondary me-2"
                        style={{ backgroundColor: "#374151", borderColor: "#374151" }}
                        onClick={() => {
                          setIsEditingProfileFields(false);
                          if (profile) {
                            setBusinessName(profile.businessName || "");
                            setBusinessCategory(profile.businessCategory || "");
                            setShortDesc(profile.shortDesc || "");
                            setSocialMediaLink(profile.socialMediaLink || "");
                          }
                        }}
                      >
                        {t("cancel") || "Cancel"}
                      </button>
                      <button
                        className="custom-btn"
                        onClick={handleSubmitProfileFields}
                        disabled={submitting || !businessName || !businessCategory}
                      >
                        {t("submitProfileDetails") || "Submit Profile Details"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Safety / Security Footer */}
      <div className="verification-secure-footer mt-5">
        <Lock size={16} className="text-teal me-2" />
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

        .status-date-tag {
          background-color: rgba(35, 173, 164, 0.15);
          color: #23ada4;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 30px;
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
          overflow: hidden;
        }

        .checklist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          transition: background-color 0.2s ease;
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

        .badge-status.pending {
          background-color: rgba(255, 190, 93, 0.12);
          color: #ffbe5d;
          border: 1px solid rgba(255, 190, 93, 0.2);
        }

        .checklist-content-body {
          padding: 20px;
          background-color: #1a1a1a;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
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

        .custom_select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e") !important;
        }

        .uploader-box {
          background-color: #262626;
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .uploader-box:hover {
          border-color: #23ada4;
        }

        .uploader-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #9ca3af;
          font-size: 13px;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .verification-secure-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #6b7280;
        }

        .spinner-icon {
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Phone Input Overrides for Security Page */
        :global(.security-phone-input) {
          width: 100%;
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
          background-color: #262626 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
          border-radius: 8px !important;
          margin-top: 4px;
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

export default function VerificationPage() {
  return (
    <ProtectedRoute>
      <VerificationPageContent />
    </ProtectedRoute>
  );
}
