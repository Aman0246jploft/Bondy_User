"use client";

import React, { useState, useEffect, useRef } from "react";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";
import InterestSelector from "@/components/InterestSelector";
import VerifyDropdwons from "@/components/VerifyDropdwons";
import FollowListModal from "@/components/Modal/FollowListModal";
import ReviewListModal from "@/components/Modal/ReviewListModal";
import "./profile-unified.css";

const GENDER_OPTIONS = [
  { key: "female", en: "Female", mn: "Эмэгтэй" },
  { key: "male", en: "Male", mn: "Эрэгтэй" },
  { key: "none", en: "Rather not say", mn: "Дурдахгүй" },
];

export default function UnifiedProfile({ forcedRole = null }) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [backupProfileData, setBackupProfileData] = useState(null);

  // Modals for Organizers
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState("followers");
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [profileData, setProfileData] = useState({
    _id: "",
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    dob: "",
    contactNumber: "",
    countryCode: "",
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
            dob: u.dob ? u.dob.split("T")[0] : "",
            contactNumber: u.contactNumber
              ? u.countryCode
                ? `${u.countryCode} ${u.contactNumber}`
                : u.contactNumber
              : "",
            countryCode: u.countryCode || "",
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

          setBackupProfileData({
            ...formattedData,
            selectedCategoryIds: catIds,
          });
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
      const { selectedCategoryIds: backupCatIds, ...rest } = backupProfileData;
      setProfileData({ ...rest });
      setSelectedCategoryIds(backupCatIds || []);
      setPreview(getFullImageUrl(backupProfileData.profileImage));
      setBackgroundPreview(getFullImageUrl(backupProfileData.backgroundImage));
    }
    setProfileImageFile(null);
    setBackgroundImageFile(null);
    setIsEditMode(false);
    setErrors({});
  };

  // Validate form before save
  const validateForm = () => {
    const newErrors = {};
    if (!profileData.firstName?.trim()) {
      newErrors.firstName = language === "en" ? "First name is required" : "Нэрээ бичнэ үү";
    }
    if (!profileData.lastName?.trim()) {
      newErrors.lastName = language === "en" ? "Last name is required" : "Овгоо бичнэ үү";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Save
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!validateForm()) {
      toast.error(language === "en" ? "Please fill required fields" : "Шаардлагатай талбаруудыг бөглөнө үү");
      return;
    }

    setLoading(true);
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
        dob: profileData.dob || null,
        profileImage: uploadedProfileImage,
        backgroundImage: uploadedBackgroundImage,
        categories: selectedCategoryIds,
        gender: profileData.gender || null,
        bio: profileData.bio || "",
      };

      if (isOrganizer && profileData.businessName) {
        updatePayload.businessName = profileData.businessName.trim();
      }

      const response = await authApi.updateProfile(updatePayload);
      if (response?.status) {
        toast.success(t("profileUpdatedSuccessfully") || "Profile updated successfully!");

        const updatedUser = response.data?.user || {};
        const freshData = {
          ...profileData,
          firstName: updatedUser.firstName || profileData.firstName,
          lastName: updatedUser.lastName || profileData.lastName,
          businessName: updatedUser.businessName || profileData.businessName,
          dob: updatedUser.dob ? updatedUser.dob.split("T")[0] : profileData.dob,
          profileImage: updatedUser.profileImage || uploadedProfileImage,
          backgroundImage: updatedUser.backgroundImage || uploadedBackgroundImage,
          gender: updatedUser.gender || profileData.gender,
          bio: updatedUser.bio || profileData.bio,
        };

        setProfileData(freshData);
        setPreview(getFullImageUrl(freshData.profileImage));
        setBackgroundPreview(getFullImageUrl(freshData.backgroundImage));
        setBackupProfileData({ ...freshData, selectedCategoryIds });
        setProfileImageFile(null);
        setBackgroundImageFile(null);
        setIsEditMode(false);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setLoading(false);
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
          <label className="ac-cover-change-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{language === "en" ? "Change cover" : "Ковер солих"}</span>
            <input
              type="file"
              accept="image/*"
              ref={coverInputRef}
              onChange={handleCoverChange}
              style={{ display: "none" }}
            />
          </label>
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
              <label
                className="ac-avatar-edit-badge"
                title={language === "en" ? "Change avatar" : "Зураг солих"}
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
            </span>

            <div className="ac-info-meta">
              <h1 className="ac-display-name">{fullName}</h1>

              <div className="ac-meta-badges">
                {/* Role badge */}
                <span className="ac-role-badge">
                  {isOrganizer ? (language === "en" ? "ORGANIZER" : "ЗОХИОН БАЙГУУЛАГЧ") : (language === "en" ? "CUSTOMER" : "ХЭРЭГЛЭГЧ")}
                </span>

                {/* Organizer Verification Dropdown / Badge */}
                {isOrganizer && (
                  <VerifyDropdwons verificationStatus={profileData.organizerVerificationStatus} />
                )}

                {/* Followers stat (Organizer) */}
                {isOrganizer && (
                  <button
                    type="button"
                    className="ac-stat-btn"
                    onClick={() => {
                      setFollowModalType("followers");
                      setShowFollowModal(true);
                    }}
                  >
                    <span className="ac-stat-num">{profileData.totalFollowers || 0}</span>
                    <span className="ac-stat-lbl">{language === "en" ? "followers" : "дагагч"}</span>
                  </button>
                )}

                {/* Following stat */}
                <button
                  type="button"
                  className="ac-stat-btn"
                  onClick={() => {
                    setFollowModalType("following");
                    setShowFollowModal(true);
                  }}
                >
                  <span className="ac-stat-num">{profileData.totalFollowing || 0}</span>
                  <span className="ac-stat-lbl">{language === "en" ? "following" : "дагаж байна"}</span>
                </button>

                {/* Reviews stat (Organizer) */}
                {isOrganizer && profileData.reviewCount > 0 && (
                  <button
                    type="button"
                    className="ac-stat-btn"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <span className="ac-stat-num">★ {profileData.averageRating?.toFixed(1) || "5.0"}</span>
                    <span className="ac-stat-lbl">({profileData.reviewCount} {language === "en" ? "reviews" : "үнэлгээ"})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Toggle Edit Button */}
          {!isEditMode ? (
            <button
              type="button"
              className="ac-primary"
              onClick={() => setIsEditMode(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>{language === "en" ? "Edit profile" : "Профайл засах"}</span>
            </button>
          ) : (
            <button
              type="button"
              className="ac-ghost"
              onClick={handleDiscard}
            >
              <span>{language === "en" ? "View profile" : "Харах горим"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          2. PROFILE CONTENT: READ-ONLY OVERVIEW OR EDIT FORM
         ════════════════════════════════════════════════════════════════ */}
      {!isEditMode ? (
        /* ── READ-ONLY SUMMARY PANEL (data-panel="profile") ── */
        <div className="ac-card">
          <div className="ac-card-head">
            <h2 className="ac-card-title">{t("personalInfo") || "Personal Information"}</h2>
            <button
              type="button"
              className="ac-ghost"
              style={{ height: 36, padding: "0 16px", fontSize: 13 }}
              onClick={() => setIsEditMode(true)}
            >
              {language === "en" ? "Edit" : "Засах"}
            </button>
          </div>

          <div className="ac-ro-grid">
            <div className="ac-ro">
              <span className="ac-rok">{language === "en" ? "Surname / Last Name" : "Овог"}</span>
              <span className="ac-rov">{profileData.lastName || "—"}</span>
            </div>

            <div className="ac-ro">
              <span className="ac-rok">{language === "en" ? "Given / First Name" : "Нэр"}</span>
              <span className="ac-rov">{profileData.firstName || "—"}</span>
            </div>

            {isOrganizer && profileData.businessName && (
              <div className="ac-ro">
                <span className="ac-rok">{language === "en" ? "Business / Brand Name" : "Байгууллагын нэр"}</span>
                <span className="ac-rov">{profileData.businessName}</span>
              </div>
            )}

            <div className="ac-ro">
              <span className="ac-rok">{t("phoneNumber") || "Phone Number"}</span>
              <span className="ac-rov">{profileData.contactNumber || "—"}</span>
            </div>

            <div className="ac-ro">
              <span className="ac-rok">{t("email") || "Email"}</span>
              <span className="ac-rov">{profileData.email || "—"}</span>
            </div>

            <div className="ac-ro">
              <span className="ac-rok">{t("dob") || "Date of Birth"}</span>
              <span className="ac-rov">{profileData.dob || "—"}</span>
            </div>

            <div className="ac-ro">
              <span className="ac-rok">{language === "en" ? "Gender" : "Хүйс"}</span>
              <span className="ac-rov">
                {GENDER_OPTIONS.find((g) => g.key === profileData.gender)?.[language === "en" ? "en" : "mn"] || "—"}
              </span>
            </div>
          </div>

          {/* Bio */}
          {profileData.bio && (
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--bd-border-soft, rgba(255,255,255,0.05))" }}>
              <span className="ac-rok">{language === "en" ? "About Me / Bio" : "Миний тухай"}</span>
              <p style={{ margin: "8px 0 0", color: "var(--bd-gray-300, #d4d4d4)", fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {profileData.bio}
              </p>
            </div>
          )}

          {/* Categories / Interests */}
          {selectedCategoryIds?.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--bd-border-soft, rgba(255,255,255,0.05))" }}>
              <span className="ac-rok">{language === "en" ? "Selected Interests" : "Сонирхол"}</span>
              <div className="ac-chips-wrap" style={{ marginTop: 10 }}>
                {categories
                  .filter((cat) => selectedCategoryIds.includes(cat._id))
                  .map((cat) => (
                    <span key={cat._id} className="ac-chip active" style={{ cursor: "default" }}>
                      {language === "mn" ? cat.name_thi || cat.categoryName_mn || cat.name : cat.name}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── EDIT FORM PANEL (data-panel="edit") ── */
        <form onSubmit={handleSave} className="ac-card">
          <div className="ac-card-head">
            <h2 className="ac-card-title">{language === "en" ? "Edit Profile Information" : "Хувийн мэдээлэл засах"}</h2>
            <button
              type="button"
              className="ac-ghost"
              style={{ height: 34, padding: "0 14px", fontSize: 12.5 }}
              onClick={handleDiscard}
            >
              {language === "en" ? "Cancel" : "Болих"}
            </button>
          </div>

          <div className="ac-form-grid">
            {/* First Name */}
            <div className="ac-form-group">
              <label className="ac-lbl">
                {language === "en" ? "First Name" : "Нэр"} <span style={{ color: "#ff5a5a" }}>*</span>
              </label>
              <input
                type="text"
                className="ac-in"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                aria-invalid={!!errors.firstName}
                placeholder={language === "en" ? "First name" : "Нэр"}
              />
              {errors.firstName && <span className="ac-err">{errors.firstName}</span>}
            </div>

            {/* Last Name */}
            <div className="ac-form-group">
              <label className="ac-lbl">
                {language === "en" ? "Last Name" : "Овог"} <span style={{ color: "#ff5a5a" }}>*</span>
              </label>
              <input
                type="text"
                className="ac-in"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                aria-invalid={!!errors.lastName}
                placeholder={language === "en" ? "Last name" : "Овог"}
              />
              {errors.lastName && <span className="ac-err">{errors.lastName}</span>}
            </div>

            {/* Business Name (Organizer only) */}
            {isOrganizer && (
              <div className="ac-form-group" style={{ gridColumn: "span 2" }}>
                <label className="ac-lbl">
                  {language === "en" ? "Business / Brand Name" : "Байгууллагын нэр"}
                </label>
                <input
                  type="text"
                  className="ac-in"
                  value={profileData.businessName}
                  onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                  placeholder={language === "en" ? "Company / Brand Name" : "Компани эсвэл брэндийн нэр"}
                />
              </div>
            )}

            {/* Phone */}
            <div className="ac-form-group">
              <label className="ac-lbl">
                {t("phoneNumber") || "Phone Number"}
              </label>
              <input
                type="tel"
                className="ac-in"
                value={profileData.contactNumber}
                readOnly
                placeholder="+976 9911 2233"
              />
              <span className="ac-hint">{language === "en" ? "Verified phone number" : "Баталгаажсан дугаар"}</span>
            </div>

            {/* Email */}
            <div className="ac-form-group">
              <label className="ac-lbl">
                {t("email") || "Email"}
              </label>
              <input
                type="email"
                className="ac-in"
                value={profileData.email}
                readOnly
                placeholder="email@bondy.mn"
              />
              <span className="ac-hint">{language === "en" ? "Registered account email" : "Бүртгэлтэй имэйл хаяг"}</span>
            </div>

            {/* Date of Birth */}
            <div className="ac-form-group">
              <label className="ac-lbl">{t("dob") || "Date of Birth"}</label>
              <input
                type="date"
                className="ac-in"
                value={profileData.dob}
                onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
              />
            </div>

            {/* Gender */}
            <div className="ac-form-group">
              <label className="ac-lbl">{language === "en" ? "Gender" : "Хүйс"}</label>
              <div className="ac-chips-wrap">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    className={`ac-chip ${profileData.gender === g.key ? "active" : ""}`}
                    aria-selected={profileData.gender === g.key}
                    onClick={() => setProfileData({ ...profileData, gender: g.key })}
                  >
                    {language === "en" ? g.en : g.mn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginTop: 20 }}>
            <label className="ac-lbl">{language === "en" ? "About Me / Bio" : "Миний тухай"}</label>
            <textarea
              className="ac-ta"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              maxLength={240}
              placeholder={language === "en" ? "Write a short bio about yourself..." : "Хэдэн үгээр өөрийгөө танилцуулна уу"}
            />
            <span className="ac-hint">{profileData.bio?.length || 0} / 240</span>
          </div>

          {/* Interest Selector */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--bd-border-soft, rgba(255,255,255,0.05))" }}>
            <label className="ac-lbl" style={{ marginBottom: 12 }}>
              {language === "en" ? "Interests & Categories" : "Сонирхол ба чиглэл"}
            </label>
            <InterestSelector
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              onChange={setSelectedCategoryIds}
            />
          </div>

          {/* Action Row */}
          <div className="ac-actions-row">
            <button
              type="button"
              className="ac-ghost"
              onClick={handleDiscard}
              disabled={loading}
            >
              {language === "en" ? "Discard" : "Цуцлах"}
            </button>
            <button
              type="submit"
              className="ac-primary"
              disabled={loading}
            >
              {loading ? (
                <span>{language === "en" ? "Saving..." : "Хадгалж байна..."}</span>
              ) : (
                <span>{language === "en" ? "Save changes" : "Хадгалах"}</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Organizer Follower/Following Modal */}
      {isOrganizer && showFollowModal && (
        <FollowListModal
          show={showFollowModal}
          onHide={() => setShowFollowModal(false)}
          userId={profileData._id}
          type={followModalType}
        />
      )}

      {/* Organizer Review Modal */}
      {isOrganizer && showReviewModal && (
        <ReviewListModal
          show={showReviewModal}
          onHide={() => setShowReviewModal(false)}
          userId={profileData._id}
        />
      )}
    </div>
  );
}
