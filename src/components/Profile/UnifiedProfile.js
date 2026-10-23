"use client";

import React, { useState, useEffect, useRef } from "react";
import authApi from "@/api/authApi";
import apiClient from "@/api/apiClient";
import toast from "react-hot-toast";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import OtpVerifyCard from "@/components/Otp/OtpVerifyCard";
import SingleDateCalendarPopover from "@/components/SingleDateCalendarPopover";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./profile-unified.css";

const GENDER_OPTIONS = [
  { key: "female", labelKey: "acFemale" },
  { key: "male", labelKey: "acMale" },
  { key: "none", labelKey: "acGenderNone" },
];

function isoToDisplay(iso) {
  if (!iso) return "";
  const [year, month, day] = String(iso).slice(0, 10).split("-");
  if (!year || !month || !day) return "";
  return `${day}.${month}.${year}`;
}

function displayToIso(text) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(text || "").trim());
  if (!match) return "";
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return "";
  }
  return `${year}-${month}-${day}`;
}

function ageFromIso(iso) {
  const dob = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const month = now.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

const phoneIdentity = ({ countryCode, contactNumber }) =>
  `${String(countryCode || "").trim()}|${String(contactNumber || "").trim()}`;

export default function UnifiedProfile({ forcedRole = null }) {
  const { t, language } = useLanguage();
  const isMn = language === "mn";
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [backupProfileData, setBackupProfileData] = useState(null);
  const [backupCategoryIds, setBackupCategoryIds] = useState([]);
  const [saveError, setSaveError] = useState("");
  const [otpTarget, setOtpTarget] = useState(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [isDobPickerOpen, setIsDobPickerOpen] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const [profileData, setProfileData] = useState({
    _id: "",
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    dob: "",
    contactNumber: "",
    countryCode: "+976",
    phoneVerified: false,
    emailVerified: false,
    profileImage: "",
    backgroundImage: "",
    gender: "",
    bio: "",
    role: "",
    roleId: 1,
    isVerified: false,
    organizerVerificationStatus: "",
    totalFollowers: 0,
    totalFollowing: 0,
    averageRating: 0,
    reviewCount: 0,
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [errors, setErrors] = useState({});

  const [preview, setPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const dobInputRef = useRef(null);

  // Fetch initial profile & categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);
        const [profileRes, catRes] = await Promise.allSettled([
          authApi.getSelfProfile(),
          authApi.getCategoryList(),
        ]);

        if (catRes.status === "fulfilled" && catRes.value?.status) {
          setCategories(catRes.value?.data?.categories || []);
        }

        if (profileRes.status === "fulfilled" && profileRes.value?.status) {
          const u = profileRes.value?.data?.user || {};
          const formattedData = {
            _id: u._id || "",
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            businessName: u.businessName || "",
            email: u.email || "",
            dob: isoToDisplay(u.dob),
            contactNumber: u.contactNumber || "",
            countryCode: u.countryCode || "+976",
            phoneVerified: Boolean(u.verifications?.phone?.isVerified),
            emailVerified: Boolean(u.verifications?.email?.isVerified),
            profileImage: u.profileImage || "",
            backgroundImage: u.backgroundImage || "",
            gender: u.gender || "",
            bio: u.bio || "",
            role: u.role || (u.roleId === 2 ? "ORGANIZER" : "CUSTOMER"),
            roleId: u.roleId || 1,
            isVerified: Boolean(u.isVerified || u.isAllVerified || u.organizerVerificationStatus === "approved"),
            organizerVerificationStatus: u.organizerVerificationStatus || "",
            totalFollowers: u.totalFollowers || 0,
            totalFollowing: u.totalFollowing || 0,
            averageRating: u.averageRating || 0,
            reviewCount: u.reviewCount || 0,
          };

          setProfileData(formattedData);
          setPreview(getFullImageUrl(u.profileImage));
          setBackgroundPreview(getFullImageUrl(u.backgroundImage));

          const catIds = (u.categories || []).map((c) => c._id || c);
          setSelectedCategoryIds(catIds);

          setBackupProfileData(formattedData);
          setBackupCategoryIds(catIds);
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, []);

  const isOrganizer =
    forcedRole === "ORGANIZER" ||
    profileData.role === "ORGANIZER" ||
    profileData.roleId === 2 ||
    Boolean(profileData.organizerVerificationStatus);

  const fullName =
    profileData.businessName && isOrganizer
      ? profileData.businessName
      : `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() ||
        (language === "en" ? "User" : "Хэрэглэгч");

  // Handle Cover Picker
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackgroundImageFile(file);
    setBackgroundPreview(URL.createObjectURL(file));
  };

  // Handle Avatar Picker
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Handle Discard
  const handleDiscard = () => {
    if (backupProfileData) {
      setProfileData({ ...backupProfileData });
      setSelectedCategoryIds(backupCategoryIds);
      setPreview(getFullImageUrl(backupProfileData.profileImage));
      setBackgroundPreview(getFullImageUrl(backupProfileData.backgroundImage));
    }
    setProfileImageFile(null);
    setBackgroundImageFile(null);
    setVerifiedPhone("");
    setVerifiedEmail("");
    setErrors({});
    setSaveError("");
  };

  const sameIds = (a, b) => a.length === b.length && a.every((id) => b.includes(id));

  const dirty = Boolean(
    backupProfileData &&
      (profileData.firstName !== backupProfileData.firstName ||
        profileData.lastName !== backupProfileData.lastName ||
        profileData.dob !== backupProfileData.dob ||
        profileData.gender !== backupProfileData.gender ||
        profileData.bio !== backupProfileData.bio ||
        profileData.email !== backupProfileData.email ||
        profileData.countryCode !== backupProfileData.countryCode ||
        profileData.contactNumber !== backupProfileData.contactNumber ||
        profileImageFile ||
        backgroundImageFile ||
        !sameIds(selectedCategoryIds, backupCategoryIds)),
  );

  const phoneChanged = Boolean(
    backupProfileData && phoneIdentity(profileData) !== phoneIdentity(backupProfileData),
  );
  const emailChanged = Boolean(
    backupProfileData &&
      profileData.email.trim() !== String(backupProfileData.email || "").trim(),
  );

  const validateForm = () => {
    const newErrors = {};
    if (!profileData.firstName?.trim()) newErrors.firstName = t("acFirstErr");
    if (!profileData.lastName?.trim()) newErrors.lastName = t("acLastErr");
    if (profileData.dob?.trim()) {
      const iso = displayToIso(profileData.dob);
      if (!iso) newErrors.dob = t("acDobErr");
      else if (ageFromIso(iso) < 13) newErrors.dob = t("acDobYoung");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Save
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    if (
      phoneChanged && phoneIdentity(profileData) !== verifiedPhone
    ) {
      setSaveError(t("otpNeedPhone"));
      return;
    }
    if (
      emailChanged && profileData.email.trim() !== verifiedEmail
    ) {
      setSaveError(t("otpNeedEmail"));
      return;
    }

    setLoading(true);
    setSaveError("");
    try {
      let uploadedProfileImage = profileData.profileImage;
      let uploadedBackgroundImage = profileData.backgroundImage;

      // 1. Upload profile image if updated
      if (profileImageFile) {
        const formData = new FormData();
        formData.append("files", profileImageFile);
        const res = await authApi.uploadFile(formData);
        if (res?.status && res.data?.files?.[0]) {
          uploadedProfileImage = res.data.files[0];
        }
      }

      // 2. Upload cover image if updated
      if (backgroundImageFile) {
        const formData = new FormData();
        formData.append("files", backgroundImageFile);
        const res = await authApi.uploadFile(formData);
        if (res?.status && res.data?.files?.[0]) {
          uploadedBackgroundImage = res.data.files[0];
        }
      }

      const updatePayload = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        dob: profileData.dob?.trim() ? displayToIso(profileData.dob) : null,
        profileImage: uploadedProfileImage,
        backgroundImage: uploadedBackgroundImage,
        categories: selectedCategoryIds,
        gender: profileData.gender || null,
        bio: profileData.bio || "",
      };

      if (backupProfileData && profileData.email !== backupProfileData.email) {
        updatePayload.email = profileData.email.trim();
      }
      if (backupProfileData && phoneIdentity(profileData) !== phoneIdentity(backupProfileData)) {
        updatePayload.countryCode = profileData.countryCode;
        updatePayload.contactNumber = profileData.contactNumber.trim();
      }

      const response = await authApi.updateProfile(updatePayload);
      if (response?.status) {
        toast.success(t("acProfileSaved"));

        const updatedUser = response.data?.user || {};
        const freshData = {
          ...profileData,
          firstName: updatedUser.firstName || profileData.firstName,
          lastName: updatedUser.lastName || profileData.lastName,
          email: updatedUser.email || profileData.email,
          countryCode: updatedUser.countryCode || profileData.countryCode,
          contactNumber: updatedUser.contactNumber || profileData.contactNumber,
          phoneVerified: updatedUser.verifications?.phone?.isVerified ?? profileData.phoneVerified,
          emailVerified: updatedUser.verifications?.email?.isVerified ?? profileData.emailVerified,
          dob: updatedUser.dob ? isoToDisplay(updatedUser.dob) : profileData.dob,
          profileImage: updatedUser.profileImage || uploadedProfileImage,
          backgroundImage: updatedUser.backgroundImage || uploadedBackgroundImage,
          gender: updatedUser.gender || profileData.gender,
          bio: updatedUser.bio ?? profileData.bio,
        };

        setProfileData(freshData);
        setPreview(getFullImageUrl(freshData.profileImage));
        setBackgroundPreview(getFullImageUrl(freshData.backgroundImage));
        setBackupProfileData(freshData);
        setBackupCategoryIds(selectedCategoryIds);
        setProfileImageFile(null);
        setBackgroundImageFile(null);
        setVerifiedPhone("");
        setVerifiedEmail("");
        setIsEditMode(false);
      } else {
        setSaveError(response?.message || t("acSave"));
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err?.response?.data?.message || err.message || t("acSave"));
    } finally {
      setLoading(false);
    }
  };

  const refreshContact = async () => {
    const res = await authApi.getSelfProfile();
    const user = res?.data?.user;
    if (!user) return;
    setProfileData((prev) => ({
      ...prev,
      email: user.email || prev.email,
      countryCode: user.countryCode || prev.countryCode,
      contactNumber: user.contactNumber || prev.contactNumber,
      phoneVerified: user.verifications?.phone?.isVerified ?? prev.phoneVerified,
      emailVerified: user.verifications?.email?.isVerified ?? prev.emailVerified,
    }));
  };

  const openContactOtp = async (kind) => {
    try {
      setOtpBusy(true);
      const res = kind === "phone"
        ? await apiClient.post("/verification/phone/send-otp", {
            countryCode: profileData.countryCode,
            contactNumber: profileData.contactNumber.trim(),
          })
        : await apiClient.post("/verification/email/send-otp", { email: profileData.email });
      if (res?.status) {
        setOtpTarget(kind);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t("otpSub"));
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyContactOtp = async (code) => {
    try {
      setOtpBusy(true);
      const path = otpTarget === "phone" ? "/verification/phone/verify-otp" : "/verification/email/verify-otp";
      const res = await apiClient.post(path, { otp: code });
      if (res?.status) {
        if (otpTarget === "phone") {
          setVerifiedPhone(phoneIdentity(profileData));
          setProfileData((current) => ({ ...current, phoneVerified: true }));
        }
        if (otpTarget === "email") {
          setVerifiedEmail(profileData.email.trim());
          setProfileData((current) => ({ ...current, emailVerified: true }));
        }
        await refreshContact();
        setOtpTarget(null);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setOtpBusy(false);
    }
  };

  const resendContactOtp = async () => {
    try {
      setOtpBusy(true);
      const res = otpTarget === "phone"
        ? await apiClient.post("/verification/phone/resend-otp", {
            countryCode: profileData.countryCode,
            contactNumber: profileData.contactNumber.trim(),
          })
        : await apiClient.post("/verification/email/resend-otp", { email: profileData.email });
      return Boolean(res?.status);
    } catch {
      return false;
    } finally {
      setOtpBusy(false);
    }
  };

  if (isFetching) {
    return (
      <div className="ac-unified-wrap">
        <div className="ac-banner-card" style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--acc)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  const toggleInterest = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const categoryName = (item) => {
    const name = language === "mn" ? item?.name_thi || item?.categoryName_mn || item?.name : item?.name;
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
  };

  return (
    <div className="ac-unified-wrap">
      {/* ════════════════════════════════════════════════════════════════
          1. COVER & AVATAR BANNER CARD (From Bondy Account.dc.html)
         ════════════════════════════════════════════════════════════════ */}
      <div className="ac-banner-card">
        {/* Cover Photo */}
        <div
          className="ac-cover-area"
          style={{
            backgroundImage: backgroundPreview
              ? `url("${backgroundPreview}")`
              : 'url("/img/default-cover.jpg")',
          }}
        >
          <div className="ac-cover-overlay" />

          {/* Change Cover Button (Visible in edit mode or clickable anytime) */}
          {isEditMode && (
          <label className="ac-cover-change-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{t("acChangeCover")}</span>
            <input
              type="file"
              accept="image/*"
              ref={coverInputRef}
              onChange={handleCoverChange}
              style={{ display: "none" }}
            />
          </label>
          )}
        </div>

        {/* Header Bar with Avatar & Meta */}
        <div className="ac-header-bar">
          <div className="ac-avatar-block">
            <span className="ac-avatar-ring">
              <img
                src={preview || "/img/default-user.png"}
                alt={fullName}
                className="ac-avatar-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/img/default-user.png";
                }}
              />
              {isEditMode && (
              <label
                className="ac-avatar-edit-badge"
                title={t("acChangePhoto")}
                aria-label={t("acChangePhoto")}
                onClick={() => avatarInputRef.current?.click()}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </label>
              )}
            </span>

            <div className="ac-info-meta">
              {isEditMode ? (
                <b className="ac-edit-title">{t("acEditTitle")}</b>
              ) : (
                <>
                  <b className="ac-display-name">{fullName}</b>
                  <button type="button" className="ac-stat-btn">
                    <span className="ac-stat-num">{profileData.totalFollowing || 0}</span>
                    <span className="ac-stat-lbl">{t("acFollowing")}</span>
                  </button>
                </>
              )}
            </div>
          </div>
          {!isEditMode && (
            <button type="button" className="ac-primary" onClick={() => setIsEditMode(true)}>
              {t("acEditTitle")}
            </button>
          )}
        </div>
      </div>

      {!isEditMode ? (
        <div className="ac-card">
          <h2 className="ac-card-title">{t("acPersonalHeading")}</h2>
          <div className="ac-ro-grid" style={{ marginTop: 18 }}>
            <div className="ac-ro">
              <span className="ac-rok">{t("acLastName")}</span>
              <span className="ac-rov">{profileData.lastName || "—"}</span>
            </div>
            <div className="ac-ro">
              <span className="ac-rok">{t("acFirstName")}</span>
              <span className="ac-rov">{profileData.firstName || "—"}</span>
            </div>
            <div className="ac-ro">
              <span className="ac-rok">{t("acPhoneLabel")}</span>
              <span className="ac-rov">
                {[profileData.countryCode, profileData.contactNumber].filter(Boolean).join(" ") || "—"}
              </span>
            </div>
            <div className="ac-ro">
              <span className="ac-rok">{t("acEmailLabel")}</span>
              <span className="ac-rov">{profileData.email || "—"}</span>
            </div>
            <div className="ac-ro">
              <span className="ac-rok">{t("acDobLabel")}</span>
              <span className="ac-rov">{profileData.dob || "—"}</span>
            </div>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSave} className="ac-card">
        <h2 className="ac-card-title">{t("acPersonalHeading")}</h2>

        <div className="ac-pair" style={{ marginTop: 18 }}>
          <label>
            <span className="ac-lbl">{t("acFirstName")} <span style={{ color: "#FF5A5A" }}>*</span></span>
            <input
              type="text"
              className="ac-in"
              value={profileData.firstName}
              onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              aria-invalid={!!errors.firstName}
              placeholder="Бат"
            />
            {errors.firstName && <span className="ac-err">{errors.firstName}</span>}
          </label>
          <label>
            <span className="ac-lbl">{t("acLastName")} <span style={{ color: "#FF5A5A" }}>*</span></span>
            <input
              type="text"
              className="ac-in"
              value={profileData.lastName}
              onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              aria-invalid={!!errors.lastName}
              placeholder="Болд"
            />
            {errors.lastName && <span className="ac-err">{errors.lastName}</span>}
          </label>
        </div>

        <div className="ac-pair" style={{ marginTop: 14 }}>
          <div>
            <span className="ac-lbl">{t("acPhoneLabel")} <span style={{ color: "#FF5A5A" }}>*</span></span>
            <div className="ac-field-row">
              <PhoneInput
                country="mn"
                value={`${profileData.countryCode || ""}${profileData.contactNumber || ""}`.replace(/\D/g, "")}
                onChange={(value, country) => {
                  const dialCode = String(country?.dialCode || "");
                  const countryCode = dialCode ? `+${dialCode}` : profileData.countryCode;
                  const contactNumber = dialCode && String(value).startsWith(dialCode)
                    ? String(value).slice(dialCode.length)
                    : String(value || "");
                  setProfileData((current) => ({ ...current, countryCode, contactNumber }));
                }}
                enableSearch
                searchPlaceholder={isMn ? "Улс хайх" : "Search country"}
                inputProps={{
                  name: "phone",
                  required: true,
                  "aria-label": t("acPhoneLabel"),
                }}
                containerClass="ac-phone-input"
                inputClass="ac-in"
                buttonClass="ac-phone-country"
                dropdownClass="ac-phone-dropdown"
              />
              {phoneChanged ? (
                <button type="button" className="ac-change-btn" onClick={() => openContactOtp("phone")} disabled={otpBusy}>
                  {t("otpVerify")}
                </button>
              ) : profileData.phoneVerified ? (
                <span className="ac-verified-status">✓ {isMn ? "Баталгаажсан" : "Verified"}</span>
              ) : null}
            </div>
            <span className="ac-hint">{t("acPhoneHint")}</span>
          </div>
          <div>
            <span className="ac-lbl">{t("acEmailLabel")} <span style={{ color: "#FF5A5A" }}>*</span></span>
            <div className="ac-field-row">
              <input
                type="email"
                className="ac-in"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="имэйл@bondy.mn"
              />
              {emailChanged ? (
                <button type="button" className="ac-change-btn" onClick={() => openContactOtp("email")} disabled={otpBusy}>
                  {t("otpVerify")}
                </button>
              ) : profileData.emailVerified ? (
                <span className="ac-verified-status">✓ {isMn ? "Баталгаажсан" : "Verified"}</span>
              ) : null}
            </div>
            <span className="ac-hint">{t("acEmailHint")}</span>
          </div>
        </div>

        <div className="ac-pair" style={{ marginTop: 14 }}>
          <label>
            <span className="ac-lbl">{t("acDobLabel")}</span>
            <div className="ac-date-picker">
              <input
                ref={dobInputRef}
                type="text"
                className="ac-in"
                value={profileData.dob}
                onClick={() => setIsDobPickerOpen(true)}
                onFocus={() => setIsDobPickerOpen(true)}
                aria-invalid={!!errors.dob}
                aria-haspopup="dialog"
                aria-expanded={isDobPickerOpen}
                readOnly
                placeholder="DD.MM.YYYY"
              />
              <button
                type="button"
                className="ac-date-picker-btn"
                aria-label={t("acDobLabel")}
                onClick={() => setIsDobPickerOpen(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 2v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8h2m4 0h2m-8 4h2m4 0h2" />
                </svg>
              </button>
            </div>
            {errors.dob && <span className="ac-err">{errors.dob}</span>}
            {isDobPickerOpen && (
              <SingleDateCalendarPopover
                anchorRef={dobInputRef}
                value={profileData.dob}
                language={language}
                t={t}
                title={t("acDobLabel")}
                minDate={new Date(1900, 0, 1)}
                maxDate={new Date()}
                onApply={(formatted) => {
                  setProfileData((current) => ({ ...current, dob: formatted }));
                  setErrors((current) => ({ ...current, dob: undefined }));
                  setIsDobPickerOpen(false);
                }}
                onCancel={() => setIsDobPickerOpen(false)}
              />
            )}
          </label>
          <div>
            <span className="ac-lbl">{t("acGender")}</span>
            <div className="ac-chips-wrap">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  className="ac-chip"
                  aria-selected={profileData.gender === g.key}
                  onClick={() => setProfileData({ ...profileData, gender: g.key })}
                >
                  {t(g.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label style={{ display: "block", marginTop: 14 }}>
          <span className="ac-lbl">{t("acAbout")}</span>
          <textarea
            className="ac-ta"
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            maxLength={240}
            placeholder={t("acAboutPh")}
          />
          <span className="ac-hint">{profileData.bio?.length || 0} / 240</span>
        </label>

        <div style={{ marginTop: 18 }}>
          <span className="ac-lbl">{t("acInterests")}</span>
          <div className="ac-chips-wrap">
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className="ac-chip"
                aria-selected={selectedCategoryIds.includes(cat._id)}
                onClick={() => toggleInterest(cat._id)}
              >
                {categoryName(cat)}
              </button>
            ))}
          </div>
          {selectedCategoryIds.length === 0 && <span className="ac-hint">{t("acInterestNote")}</span>}
        </div>

        {saveError && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 18, padding: "13px 15px", border: "1px solid rgba(255,90,90,.55)", borderRadius: 14, background: "rgba(255,90,90,.1)", fontSize: 13.5, lineHeight: 1.45, color: "#FFC9C9" }}>
            <span>{saveError}</span>
          </div>
        )}

        {dirty && !loading && (
          <span style={{ display: "block", marginTop: 18, fontSize: 12.5, color: "var(--bd-gray-600, #6b6b6b)" }}>{t("acUnsaved")}</span>
        )}

        <div className="ac-actions-row">
          <button type="button" className="ac-ghost" onClick={handleDiscard} disabled={loading}>
            {t("acCancel")}
          </button>
          <button type="submit" className="ac-primary ac-save" disabled={loading || !dirty}>
            {loading ? t("acSaving") : t("acSave")}
          </button>
        </div>
      </form>
      )}
      <OtpVerifyCard
        open={Boolean(otpTarget)}
        field={otpTarget === "email" ? "email" : "phone"}
        busy={otpBusy}
        onClose={() => setOtpTarget(null)}
        onVerify={verifyContactOtp}
        onResend={resendContactOtp}
      />
    </div>
  );
}
