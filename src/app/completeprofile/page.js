"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import {
  Upload,
  Camera,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import GlobalLoader from "@/components/GlobalLoader";
import { getFullImageUrl } from "@/utils/imageHelper";

export default function CompleteProfile() {
  return (
    <ProtectedRoute>
      <CompleteProfileContent />
    </ProtectedRoute>
  );
}

function CompleteProfileContent() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isMn = language === "mn";

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [categories, setCategories] = useState([]);

  // Organizer multi-step state: 'orgabout' | 'orgprofile' | 'review' | 'approved' | 'rejected'
  const [orgStep, setOrgStep] = useState("orgabout");
  const [rejectionReason, setRejectionReason] = useState("");
  const [errors, setErrors] = useState({});

  // Organizer Form State
  const [organizerData, setOrganizerData] = useState({
    businessName: "",
    businessCategory: "",
    shortDesc: "",
    socialMediaLink: "",
    city: "",
    website: "",
    businessRegisterNumber: "",
  });

  // Customer Profile State
  const [customerData, setCustomerData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    bio: "",
    profileImage: "",
    backgroundImage: "",
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    document.title = isMn ? "Профайлаа дүүргэх - Bondy" : "Complete your profile - Bondy";

    const fetchInitialData = async () => {
      try {
        const catRes = await authApi.getCategoryList();
        if (catRes?.status) {
          setCategories(catRes?.data?.categories || []);
        }

        const response = await authApi.getSelfProfile();
        if (response?.status) {
          const profile = response?.data?.user;
          const regType = typeof window !== "undefined" ? localStorage.getItem("registerType") : null;
          const isOrg = profile?.roleId === 2 || profile?.organizerVerificationStatus || regType === "ORGANIZER";

          if (isOrg) {
            setIsOrganizer(true);
            const isApproved =
              profile?.hasBeenApproved === true ||
              profile?.isVerified === true ||
              profile?.organizerVerificationStatus === "approved" ||
              profile?.businessVerificationStatus === "approved";

            const isRejected =
              profile?.organizerVerificationStatus === "rejected" ||
              profile?.businessVerificationStatus === "rejected";

            const hasBusinessDetails = !!(
              profile?.businessName ||
              profile?.businessCategory ||
              profile?.shortDesc ||
              profile?.businessRegisterNumber
            );

            const isPending =
              profile?.businessVerificationStatus === "pending" ||
              profile?.organizerVerificationStatus === "pending";

            if (isApproved) {
              setOrgStep("approved");
            } else if (isRejected) {
              setRejectionReason(
                profile?.businessRejectionReason ||
                profile?.organizerRejectionReason ||
                ""
              );
              setOrgStep("rejected");
            } else if (isPending || hasBusinessDetails) {
              setOrgStep("review");
            } else {
              setOrgStep("orgabout");
            }

            setOrganizerData({
              businessName:
                profile?.businessName ||
                profile?.fullname ||
                (profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : ""),
              businessCategory:
                profile?.businessCategory?._id ||
                profile?.businessCategory ||
                "",
              shortDesc: profile?.shortDesc || "",
              socialMediaLink: profile?.socialMediaLink || "",
              city: profile?.city || profile?.location?.city || "",
              website: profile?.website || profile?.socialMediaLink || "",
              businessRegisterNumber: profile?.businessRegisterNumber || "",
            });
          } else {
            setIsOrganizer(false);

            if (profile?.firstName && profile?.lastName) {
              if (!profile?.categories || profile?.categories.length === 0) {
                return router.push("/insterest");
              } else {
                return router.push("/");
              }
            }

            setCustomerData({
              firstName: profile?.firstName || "",
              lastName: profile?.lastName || "",
              gender: profile?.gender || "",
              dob: profile?.dob ? profile.dob.split("T")[0] : "",
              bio: profile?.bio || "",
              profileImage: profile?.profileImage || "",
              backgroundImage: profile?.backgroundImage || "",
            });
            if (profile?.profileImage) {
              setPreview(getFullImageUrl(profile.profileImage));
            }
            if (profile?.backgroundImage) {
              setBackgroundPreview(getFullImageUrl(profile.backgroundImage));
            }
          }
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setIsChecking(false);
      }
    };

    fetchInitialData();
  }, [router, isMn]);

  /* ══════════════ ORGANIZER ACTIONS ══════════════ */
  const handleOrganizerChange = (field, value) => {
    setOrganizerData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleNextToProfile = () => {
    const errs = {};
    if (!organizerData.businessName.trim()) {
      errs.businessName = isMn ? "Байгууллагын нэрээ оруулна уу." : "Please enter organization name.";
    }
    if (!organizerData.businessCategory) {
      errs.businessCategory = isMn ? "Үндсэн ангилал сонгоно уу." : "Please select a primary category.";
    }
    if (!organizerData.shortDesc.trim() || organizerData.shortDesc.trim().length < 5) {
      errs.shortDesc = isMn ? "Товч тайлбараа бичнэ үү (хамгийн багадаа 5 тэмдэгт)." : "Please enter short description (min 5 chars).";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setOrgStep("orgprofile");
  };

  const handleOrganizerSubmit = async () => {
    const errs = {};
    if (!organizerData.businessRegisterNumber?.trim()) {
      errs.businessRegisterNumber = isMn ? "Регистрийн дугаараа оруулна уу." : "Please enter registration number.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        businessVerification: {
          businessName: organizerData.businessName.trim(),
          businessCategory: organizerData.businessCategory,
          shortDesc: organizerData.shortDesc.trim(),
          socialMediaLink: organizerData.socialMediaLink.trim() || organizerData.website.trim(),
          city: organizerData.city.trim(),
          website: organizerData.website.trim(),
          businessRegisterNumber: organizerData.businessRegisterNumber.trim(),
        },
      };

      const response = await authApi.submitVerification(payload);
      if (response?.status) {
        toast.success(isMn ? "Хүсэлт амжилттай илгээгдлээ!" : "Application submitted for review!");
        // Update cached profile
        try {
          const fresh = await authApi.getSelfProfile();
          if (fresh?.data?.user) {
            localStorage.setItem("userProfile", JSON.stringify(fresh.data.user));
          }
        } catch (_) {}
        setOrgStep("review");
      }
    } catch (error) {
      console.error("Organizer verification submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await authApi.getSelfProfile();
      if (response?.status) {
        const profile = response?.data?.user;
        localStorage.setItem("userProfile", JSON.stringify(profile));

        const isApproved =
          profile?.hasBeenApproved === true ||
          profile?.isVerified === true ||
          profile?.organizerVerificationStatus === "approved" ||
          profile?.businessVerificationStatus === "approved";

        const isRejected =
          profile?.organizerVerificationStatus === "rejected" ||
          profile?.businessVerificationStatus === "rejected";

        if (isApproved) {
          toast.success(isMn ? "Таны хүсэлт батлагдсан байна!" : "Your application has been approved!");
          setOrgStep("approved");
        } else if (isRejected) {
          setRejectionReason(
            profile?.businessRejectionReason ||
            profile?.organizerRejectionReason ||
            ""
          );
          setOrgStep("rejected");
        } else {
          toast(
            isMn
              ? "Таны хүсэлт хянагдаж байна (1–2 ажлын өдөр)."
              : "Your application is still under review (1–2 business days).",
            { icon: "⏳" }
          );
        }
      }
    } catch (error) {
      console.error("Failed to check application status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  /* ══════════════ CUSTOMER ACTIONS ══════════════ */
  const handleProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImageFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
  };

  const handleBackgroundFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBackgroundImageFile(file);
    const localPreview = URL.createObjectURL(file);
    setBackgroundPreview(localPreview);
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName" || name === "lastName") {
      const cleanValue = value.replace(/\d/g, "");
      setCustomerData((prev) => ({ ...prev, [name]: cleanValue }));
    } else {
      setCustomerData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerData.firstName.trim() || !customerData.lastName.trim()) {
      toast.error(isMn ? "Нэр, овгоо оруулна уу" : "Please enter your first and last name");
      return;
    }
    if (!customerData.dob) {
      toast.error(isMn ? "Төрсөн огноогоо оруулна уу" : "Please enter your date of birth");
      return;
    }

    try {
      setLoading(true);
      let uploadedProfileImage = customerData.profileImage;
      let uploadedBackgroundImage = customerData.backgroundImage;

      if (profileImageFile) {
        const formData = new FormData();
        formData.append("files", profileImageFile);
        const response = await authApi.uploadFile(formData);
        if (response?.status && response.data?.files?.length > 0) {
          uploadedProfileImage = response.data.files[0];
        }
      }

      if (backgroundImageFile) {
        const formData = new FormData();
        formData.append("files", backgroundImageFile);
        const response = await authApi.uploadFile(formData);
        if (response?.status && response.data?.files?.length > 0) {
          uploadedBackgroundImage = response.data.files[0];
        }
      }

      const payload = {
        ...customerData,
        firstName: customerData.firstName.trim(),
        lastName: customerData.lastName.trim(),
        profileImage: uploadedProfileImage,
        backgroundImage: uploadedBackgroundImage,
      };

      const response = await authApi.updateProfile(payload);
      if (response?.status) {
        toast.success(isMn ? "Профайл амжилттай шинэчлэгдлээ!" : "Profile updated!");
        router.push("/insterest");
      }
    } catch (error) {
      console.error("Customer profile update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return <GlobalLoader fullScreen />;
  }

  return (
    <>
      <Header />
      <main className="lg-shell">
        <section className="lg-panel">
          {isOrganizer ? (
            /* ══════════════════════════════════════════════════
               ORGANIZER FLOW (orgabout, orgprofile, review, approved, rejected)
               ══════════════════════════════════════════════════ */
            <>
              {/* ──────────────── 1. ORG ABOUT (1/2) ──────────────── */}
              {orgStep === "orgabout" && (
                <div>
                  <div className="lg-top">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="lg-back"
                      aria-label="Back"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M 7.238 0.181 C 7.553 0.45 7.589 0.924 7.319 1.238 L 1.738 7.75 L 7.319 14.262 C 7.589 14.576 7.553 15.05 7.238 15.319 C 6.924 15.589 6.45 15.553 6.181 15.238 L 0.181 8.238 C -0.06 7.957 -0.06 7.543 0.181 7.262 L 6.181 0.262 C 6.45 -0.053 6.924 -0.089 7.238 0.181 Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          transform="matrix(1 0 0 1 8.250 4.250)"
                        />
                      </svg>
                    </button>
                    <span className="lg-eyebrow">
                      {isMn ? "Зохион байгуулагчийн хүсэлт · 1/2" : "Organizer application · 1/2"}
                    </span>
                  </div>

                  <h1 className="lg-h1">
                    {isMn ? "Зохион байгуулагчийн мэдээлэл" : "Organizer Details"}
                  </h1>
                  <p className="lg-sub">
                    {isMn
                      ? "Зохион байгуулагчийн бүртгэлийг шалгахад бидэнд туслана уу."
                      : "Help us verify your organizer account so you can start creating events."}
                  </p>

                  <div className="lg-fields" style={{ gap: 20, marginTop: 24 }}>
                    {/* Organization Name */}
                    <label>
                      <span className="lg-flabel">
                        {isMn ? "Байгууллагын нэр" : "Organization name"} *
                      </span>
                      <input
                        type="text"
                        className="lg-in"
                        placeholder={isMn ? "Байгууллагын нэрээ оруулна уу" : "Enter organization name"}
                        value={organizerData.businessName}
                        aria-invalid={!!errors.businessName}
                        onChange={(e) => handleOrganizerChange("businessName", e.target.value)}
                      />
                      {errors.businessName && <span className="lg-err">{errors.businessName}</span>}
                    </label>

                    {/* Primary Category */}
                    <label>
                      <span className="lg-flabel">
                        {isMn ? "Үндсэн ангилал" : "Primary Category"} *
                      </span>
                      <select
                        className="lg-in"
                        value={organizerData.businessCategory}
                        aria-invalid={!!errors.businessCategory}
                        onChange={(e) => handleOrganizerChange("businessCategory", e.target.value)}
                        style={{
                          cursor: "pointer",
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 20px center",
                          paddingRight: "44px",
                          backgroundColor: "transparent",
                        }}
                      >
                        <option value="" disabled style={{ background: "#1a1a1a", color: "#888" }}>
                          {isMn ? "Үндсэн ангилал сонгох" : "Select Primary Category"}
                        </option>
                        {categories?.map((cat) => (
                          <option key={cat._id} value={cat._id} style={{ background: "#1a1a1a", color: "#fff" }}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {errors.businessCategory && <span className="lg-err">{errors.businessCategory}</span>}
                    </label>

                    {/* Short Description */}
                    <label>
                      <span className="lg-flabel">
                        {isMn ? "Товч тайлбар" : "Short description"} *
                      </span>
                      <textarea
                        className="lg-ta"
                        style={{ minHeight: "140px" }}
                        placeholder={
                          isMn
                            ? "Та юу зохион байгуулдаг талаараа бичнэ үү."
                            : "Tell us about what you organize."
                        }
                        value={organizerData.shortDesc}
                        onChange={(e) => handleOrganizerChange("shortDesc", e.target.value)}
                      />
                      {errors.shortDesc && <span className="lg-err">{errors.shortDesc}</span>}
                    </label>

                    {/* Social Media Link */}
                    <label>
                      <span className="lg-flabel">
                        {isMn
                          ? "Instagram эсвэл Facebook холбоос (заавал биш)"
                          : "Instagram or Facebook link (optional)"}
                      </span>
                      <input
                        type="url"
                        className="lg-in"
                        placeholder="instagram.com/..."
                        value={organizerData.socialMediaLink}
                        onChange={(e) => handleOrganizerChange("socialMediaLink", e.target.value)}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="lg-submit"
                    disabled={loading}
                    onClick={handleNextToProfile}
                  >
                    {loading && <span className="lg-spin" />}
                    {isMn ? "Үргэлжлүүлэх" : "Continue"}
                  </button>
                </div>
              )}

              {/* ──────────────── 2. ORG PROFILE (2/2) ──────────────── */}
              {orgStep === "orgprofile" && (
                <div>
                  <div className="lg-top">
                    <button
                      type="button"
                      onClick={() => setOrgStep("orgabout")}
                      className="lg-back"
                      aria-label="Back"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M 7.238 0.181 C 7.553 0.45 7.589 0.924 7.319 1.238 L 1.738 7.75 L 7.319 14.262 C 7.589 14.576 7.553 15.05 7.238 15.319 C 6.924 15.589 6.45 15.553 6.181 15.238 L 0.181 8.238 C -0.06 7.957 -0.06 7.543 0.181 7.262 L 6.181 0.262 C 6.45 -0.053 6.924 -0.089 7.238 0.181 Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          transform="matrix(1 0 0 1 8.250 4.250)"
                        />
                      </svg>
                    </button>
                    <span className="lg-eyebrow">
                      {isMn ? "Зохион байгуулагчийн хүсэлт · 2/2" : "Organizer application · 2/2"}
                    </span>
                  </div>

                  <h1 className="lg-h1">
                    {isMn ? "Профайлаа дүүргэх" : "Complete your profile"}
                  </h1>
                  <p className="lg-sub">
                    {isMn
                      ? "Эдгээр мэдээлэл нийтийн профайл болон хүсэлтэд харагдана."
                      : "This information will be displayed on your public profile and application."}
                  </p>

                  <div className="lg-fields" style={{ marginTop: 24 }}>
                    {/* City / District */}
                    <label>
                      <input
                        type="text"
                        className="lg-in"
                        placeholder={isMn ? "Хот, дүүрэг" : "City, district"}
                        value={organizerData.city}
                        onChange={(e) => handleOrganizerChange("city", e.target.value)}
                      />
                    </label>

                    {/* Website or Instagram */}
                    <label>
                      <input
                        type="text"
                        className="lg-in"
                        placeholder={
                          isMn
                            ? "Вэб сайт эсвэл Instagram (заавал биш)"
                            : "Website or Instagram (optional)"
                        }
                        value={organizerData.website}
                        onChange={(e) => handleOrganizerChange("website", e.target.value)}
                      />
                    </label>

                    {/* Registration Number */}
                    <label>
                      <input
                        type="text"
                        className="lg-in"
                        placeholder={isMn ? "Регистрийн дугаар *" : "Business registration number *"}
                        aria-invalid={!!errors.businessRegisterNumber}
                        value={organizerData.businessRegisterNumber}
                        onChange={(e) => handleOrganizerChange("businessRegisterNumber", e.target.value)}
                      />
                      {errors.businessRegisterNumber && (
                        <span className="lg-err">{errors.businessRegisterNumber}</span>
                      )}
                    </label>
                  </div>

                  {/* Verification Note Banner */}
                  <div className="lg-alert" data-tone="ok" style={{ marginTop: 20 }}>
                    <span style={{ display: "inline-flex", flexShrink: 0, color: "var(--acc-bright)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M 12.809 9.25 C 13.085 8.941 13.058 8.466 12.75 8.191 C 12.441 7.915 11.966 7.942 11.691 8.25 L 8.679 11.624 L 7.809 10.65 C 7.534 10.342 7.059 10.315 6.75 10.591 C 6.442 10.866 6.415 11.341 6.691 11.65 L 8.119 13.25 C 8.261 13.409 8.465 13.5 8.679 13.5 C 8.892 13.5 9.096 13.409 9.238 13.25 L 12.809 9.25 Z"
                          fill="currentColor"
                          fillRule="nonzero"
                          transform="matrix(1 0 0 1 2.250 1.250)"
                        />
                        <path
                          d="M 9.75 0 C 8.812 0 7.917 0.307 6.473 0.801 L 5.746 1.05 C 4.265 1.557 3.121 1.949 2.303 2.281 C 1.891 2.448 1.536 2.611 1.251 2.776 C 0.976 2.936 0.701 3.135 0.514 3.402 C 0.329 3.665 0.233 3.989 0.173 4.301 C 0.11 4.626 0.073 5.015 0.048 5.461 C 0 6.348 0 7.564 0 9.14 L 0 10.741 C 0 16.842 4.608 19.768 7.348 20.965 L 7.375 20.976 C 7.715 21.125 8.035 21.264 8.402 21.358 C 8.789 21.458 9.201 21.5 9.75 21.5 C 10.299 21.5 10.711 21.458 11.098 21.358 C 11.465 21.264 11.785 21.125 12.125 20.976 L 12.152 20.965 C 14.892 19.768 19.5 16.842 19.5 10.741 L 19.5 9.14 C 19.5 7.564 19.5 6.348 19.452 5.461 C 19.427 5.015 19.39 4.626 19.327 4.301 C 19.267 3.989 19.171 3.665 18.986 3.402 C 18.799 3.135 18.524 2.936 18.249 2.776 C 17.964 2.611 17.609 2.448 17.197 2.281 C 16.379 1.949 15.235 1.557 13.754 1.05 L 13.027 0.801 C 11.583 0.307 10.688 0 9.75 0 Z M 6.831 2.264 C 8.445 1.712 9.092 1.5 9.75 1.5 C 10.408 1.5 11.055 1.712 12.669 2.264 L 13.242 2.46 C 14.755 2.978 15.858 3.356 16.632 3.671 C 17.019 3.828 17.299 3.959 17.496 4.074 C 17.593 4.13 17.66 4.176 17.704 4.213 C 17.742 4.243 17.757 4.261 17.759 4.263 C 17.761 4.267 17.773 4.287 17.791 4.337 C 17.811 4.393 17.833 4.473 17.854 4.585 C 17.898 4.812 17.931 5.123 17.954 5.543 C 18 6.384 18 7.558 18 9.167 L 18 10.741 C 18 15.916 14.13 18.463 11.551 19.59 C 11.18 19.752 10.965 19.844 10.726 19.905 C 10.498 19.964 10.22 20 9.75 20 C 9.28 20 9.002 19.964 8.774 19.905 C 8.535 19.844 8.32 19.752 7.949 19.59 C 5.37 18.463 1.5 15.916 1.5 10.741 L 1.5 9.167 C 1.5 7.558 1.5 6.384 1.546 5.543 C 1.569 5.123 1.602 4.812 1.646 4.585 C 1.667 4.473 1.689 4.393 1.709 4.337 C 1.727 4.287 1.739 4.267 1.741 4.263 C 1.743 4.261 1.758 4.244 1.796 4.213 C 1.84 4.176 1.907 4.13 2.004 4.074 C 2.201 3.959 2.481 3.828 2.868 3.671 C 3.642 3.356 4.745 2.978 6.258 2.46 L 6.831 2.264 Z\"
                          fill="currentColor"
                          fillRule="evenodd"
                          transform="matrix(1 0 0 1 2.250 1.250)"
                        />
                      </svg>
                    </span>
                    <span>
                      {isMn ? (
                        <>
                          Хувийн болон банкны баталгаажуулалтыг батлагдсаны дараа{" "}
                          <b>Баталгаажуулалт</b> хэсэгт хийнэ.
                        </>
                      ) : (
                        <>
                          Identity and bank verification will be completed in the{" "}
                          <b>Verification</b> section after approval.
                        </>
                      )}
                    </span>
                  </div>

                  {/* Submit application */}
                  <button
                    type="button"
                    className="lg-submit"
                    disabled={loading}
                    onClick={handleOrganizerSubmit}
                  >
                    {loading && <span className="lg-spin" />}
                    {isMn ? "Хүсэлт илгээх" : "Submit application"}
                  </button>

                  {/* Back button */}
                  <button
                    type="button"
                    className="lg-ghost"
                    onClick={() => setOrgStep("orgabout")}
                  >
                    {isMn ? "Буцах" : "Back"}
                  </button>
                </div>
              )}

              {/* ──────────────── 3. APPLICATION UNDER REVIEW ──────────────── */}
              {orgStep === "review" && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="lg-top">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="lg-back"
                      aria-label="Back"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M 7.238 0.181 C 7.553 0.45 7.589 0.924 7.319 1.238 L 1.738 7.75 L 7.319 14.262 C 7.589 14.576 7.553 15.05 7.238 15.319 C 6.924 15.589 6.45 15.553 6.181 15.238 L 0.181 8.238 C -0.06 7.957 -0.06 7.543 0.181 7.262 L 6.181 0.262 C 6.45 -0.053 6.924 -0.089 7.238 0.181 Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          transform="matrix(1 0 0 1 8.250 4.250)"
                        />
                      </svg>
                    </button>
                    <span className="lg-eyebrow">
                      {isMn ? "ЗОХИОН БАЙГУУЛАГЧИЙН ХҮСЭЛТ" : "ORGANIZER APPLICATION"}
                    </span>
                  </div>

                  <span
                    className="lg-mark"
                    style={{
                      display: "flex",
                      margin: "0 auto 22px",
                      background: "rgba(255, 138, 51, 0.14)",
                      color: "#FF8A33",
                    }}
                  >
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M 7 0.75 C 7 0.336 7.336 0 7.75 0 L 11.75 0 C 12.164 0 12.5 0.336 12.5 0.75 C 12.5 1.164 12.164 1.5 11.75 1.5 L 7.75 1.5 C 7.336 1.5 7 1.164 7 0.75 Z M 9.75 3.5 C 5.194 3.5 1.5 7.194 1.5 11.75 C 1.5 16.306 5.194 20 9.75 20 C 14.306 20 18 16.306 18 11.75 C 18 7.194 14.306 3.5 9.75 3.5 Z M 0 11.75 C 0 6.365 4.365 2 9.75 2 C 15.135 2 19.5 6.365 19.5 11.75 C 19.5 17.135 15.135 21.5 9.75 21.5 C 4.365 21.5 0 17.135 0 11.75 Z M 9.75 7 C 10.164 7 10.5 7.336 10.5 7.75 L 10.5 11.75 C 10.5 12.164 10.164 12.5 9.75 12.5 C 9.336 12.5 9 12.164 9 11.75 L 9 7.75 C 9 7.336 9.336 7 9.75 7 Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        transform="matrix(1 0 0 1 2.250 1.250)"
                      />
                    </svg>
                  </span>

                  <h1 className="lg-h1" style={{ textAlign: "center" }}>
                    {isMn ? "Хүсэлт хянагдаж байна" : "Application in review"}
                  </h1>
                  <p className="lg-sub" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
                    {isMn
                      ? "Батлагдмагц имэйлээр мэдэгдэнэ. Түүнээс өмнө хэрэглэгчээр үзэж болно."
                      : "We will email you once it is approved. Until then you can browse as a user."}
                  </p>

                  <div className="lg-meta">
                    <div>
                      <dt>{isMn ? "Байгууллага" : "Organization"}</dt>
                      <dd>{organizerData.businessName || "Bondy Organizer"}</dd>
                    </div>
                    <div>
                      <dt>{isMn ? "Хүсэлт" : "Application"}</dt>
                      <dd>{isMn ? "Хянагдаж байна" : "Under review"}</dd>
                    </div>
                    <div>
                      <dt>{isMn ? "Хугацаа" : "Timing"}</dt>
                      <dd>{isMn ? "1–2 ажлын өдөр" : "1–2 business days"}</dd>
                    </div>
                  </div>

                  <Link href="/" className="lg-submit" style={{ textDecoration: "none" }}>
                    {isMn ? "Нүүр хуудас руу" : "Back to home"}
                  </Link>

                  <button
                    type="button"
                    className="lg-ghost"
                    disabled={checkingStatus}
                    onClick={handleCheckStatus}
                  >
                    {checkingStatus && <span className="lg-spin" />}
                    {isMn ? "Хүсэлтийн төлөвийг шалгах" : "Check application status"}
                  </button>
                </div>
              )}

              {/* ──────────────── 4. APPLICATION APPROVED ──────────────── */}
              {orgStep === "approved" && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="lg-top">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="lg-back"
                      aria-label="Back"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M 7.238 0.181 C 7.553 0.45 7.589 0.924 7.319 1.238 L 1.738 7.75 L 7.319 14.262 C 7.589 14.576 7.553 15.05 7.238 15.319 C 6.924 15.589 6.45 15.553 6.181 15.238 L 0.181 8.238 C -0.06 7.957 -0.06 7.543 0.181 7.262 L 6.181 0.262 C 6.45 -0.053 6.924 -0.089 7.238 0.181 Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          transform="matrix(1 0 0 1 8.250 4.250)"
                        />
                      </svg>
                    </button>
                    <span className="lg-eyebrow">
                      {isMn ? "ЗОХИОН БАЙГУУЛАГЧИЙН ХҮСЭЛТ" : "ORGANIZER APPLICATION"}
                    </span>
                  </div>

                  <span
                    className="lg-mark"
                    style={{
                      display: "flex",
                      margin: "0 auto 22px",
                      background: "rgba(35, 173, 164, 0.14)",
                      color: "var(--acc-bright)",
                    }}
                  >
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M 14.78 8.78 C 15.073 8.487 15.073 8.013 14.78 7.72 C 14.487 7.427 14.013 7.427 13.72 7.72 L 9.25 12.189 L 7.78 10.72 C 7.487 10.427 7.013 10.427 6.72 10.72 C 6.427 11.013 6.427 11.487 6.72 11.78 L 8.72 13.78 C 9.013 14.073 9.487 14.073 9.78 13.78 L 14.78 8.78 Z"
                        fill="currentColor"
                        fillRule="nonzero"
                        transform="matrix(1 0 0 1 1.250 1.250)"
                      />
                      <path
                        d="M 10.75 0 C 4.813 0 0 4.813 0 10.75 C 0 16.687 4.813 21.5 10.75 21.5 C 16.687 21.5 21.5 16.687 21.5 10.75 C 21.5 4.813 16.687 0 10.75 0 Z M 1.5 10.75 C 1.5 5.641 5.641 1.5 10.75 1.5 C 15.859 1.5 20 5.641 20 10.75 C 20 15.859 15.859 20 10.75 20 C 5.641 20 1.5 15.859 1.5 10.75 Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        transform="matrix(1 0 0 1 1.250 1.250)"
                      />
                    </svg>
                  </span>

                  <h1 className="lg-h1" style={{ textAlign: "center" }}>
                    {isMn ? "Хүсэлт батлагдлаа" : "Application approved"}
                  </h1>
                  <p className="lg-sub" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
                    {isMn
                      ? "Одоо эвент, сургалт нийтэлж, тасалбар борлуулж болно."
                      : "You can now publish events, courses, and sell tickets."}
                  </p>

                  <div className="lg-meta">
                    <div>
                      <dt>{isMn ? "Байгууллага" : "Organization"}</dt>
                      <dd>{organizerData.businessName || "Bondy Organizer"}</dd>
                    </div>
                    <div>
                      <dt>{isMn ? "Төлөв" : "Status"}</dt>
                      <dd style={{ color: "var(--acc-bright)" }}>
                        {isMn ? "Батлагдсан" : "Approved"}
                      </dd>
                    </div>
                  </div>

                  <Link href="/(OrganizerAdmin)/dashboard" className="lg-submit" style={{ textDecoration: "none" }}>
                    {isMn ? "Хяналтын самбар руу" : "Go to dashboard"}
                  </Link>

                  <Link href="/OrganizerProfile" className="lg-ghost" style={{ textDecoration: "none" }}>
                    {isMn ? "Баталгаажуулалтаа дүүргэх" : "Complete verification"}
                  </Link>
                </div>
              )}

              {/* ──────────────── 5. APPLICATION REJECTED ──────────────── */}
              {orgStep === "rejected" && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="lg-top">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="lg-back"
                      aria-label="Back"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M 7.238 0.181 C 7.553 0.45 7.589 0.924 7.319 1.238 L 1.738 7.75 L 7.319 14.262 C 7.589 14.576 7.553 15.05 7.238 15.319 C 6.924 15.589 6.45 15.553 6.181 15.238 L 0.181 8.238 C -0.06 7.957 -0.06 7.543 0.181 7.262 L 6.181 0.262 C 6.45 -0.053 6.924 -0.089 7.238 0.181 Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          transform="matrix(1 0 0 1 8.250 4.250)"
                        />
                      </svg>
                    </button>
                    <span className="lg-eyebrow">
                      {isMn ? "ЗОХИОН БАЙГУУЛАГЧИЙН ХҮСЭЛТ" : "ORGANIZER APPLICATION"}
                    </span>
                  </div>

                  <span
                    className="lg-mark"
                    style={{
                      display: "flex",
                      margin: "0 auto 22px",
                      background: "rgba(255, 90, 90, 0.13)",
                      color: "#FF5A5A",
                    }}
                  >
                    <svg
                      width="34"
                      height="34"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>

                  <h1 className="lg-h1" style={{ textAlign: "center" }}>
                    {isMn ? "Хүсэлт батлагдсангүй" : "Application not approved"}
                  </h1>
                  <p className="lg-sub" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
                    {isMn
                      ? "Доорх шалтгааныг шалгаад мэдээллээ засаж дахин илгээнэ үү."
                      : "Please review the reason below, update your details, and re-submit."}
                  </p>

                  <div className="lg-alert" data-tone="err" style={{ marginTop: 22 }}>
                    <span style={{ display: "inline-flex", flexShrink: 0 }}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                    <span>
                      {rejectionReason ||
                        (isMn
                          ? "Байгууллагын нэр болон регистрийн дугаар тохирохгүй байна. Мэдээллээ шалгаад дахин илгээнэ үү."
                          : "Organization name and registration number do not match. Please verify your information and re-submit.")}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="lg-submit"
                    onClick={() => setOrgStep("orgabout")}
                  >
                    {isMn ? "Мэдээллээ засаад дахин илгээх" : "Edit details and resubmit"}
                  </button>

                  <Link href="/help#contact" className="lg-ghost" style={{ textDecoration: "none" }}>
                    {isMn ? "Тусламж авах" : "Get help"}
                  </Link>

                  <p className="lg-switch">
                    <span>{isMn ? "Хэрэглэгчээр үргэлжлүүлэх?" : "Continue as user?"}</span>
                    <Link href="/" className="lg-link" style={{ marginLeft: 6 }}>
                      {isMn ? "Нүүр хуудас" : "Homepage"}
                    </Link>
                  </p>
                </div>
              )}
            </>
          ) : (
            /* ══════════════════════════════════════════════════
               CUSTOMER COMPLETE PROFILE (Customer user role)
               ══════════════════════════════════════════════════ */
            <>
              <div className="lg-top">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="lg-back"
                  aria-label="Back"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M 7.238 0.181 C 7.553 0.45 7.589 0.924 7.319 1.238 L 1.738 7.75 L 7.319 14.262 C 7.589 14.576 7.553 15.05 7.238 15.319 C 6.924 15.589 6.45 15.553 6.181 15.238 L 0.181 8.238 C -0.06 7.957 -0.06 7.543 0.181 7.262 L 6.181 0.262 C 6.45 -0.053 6.924 -0.089 7.238 0.181 Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      transform="matrix(1 0 0 1 8.250 4.250)"
                    />
                  </svg>
                </button>
                <span className="lg-eyebrow">
                  {isMn ? "ХЭРЭГЛЭГЧИЙН БҮРТГЭЛ" : "COMPLETE YOUR PROFILE"}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="lg-h1">
                {isMn ? "Профайлаа дүүргэх" : "Complete your profile"}
              </h1>
              <p className="lg-sub" style={{ marginBottom: 20 }}>
                {isMn
                  ? "Хувийн мэдээллээ оруулснаар таны туршлага сайжирна."
                  : "Complete your personal details to personalize your event experience."}
              </p>

              {/* Cover & Avatar Upload Hero */}
              <div className="cp-upload-wrap">
                {/* Cover Banner */}
                <div
                  className="cp-cover"
                  onClick={() => coverInputRef.current?.click()}
                  title={isMn ? "Ковер зураг солих" : "Click to change cover photo"}
                >
                  {backgroundPreview ? (
                    <img src={backgroundPreview} alt="Cover Preview" className="cp-cover-img" />
                  ) : (
                    <div className="cp-cover-empty">
                      <Upload size={18} />
                      <span>{isMn ? "Ковер зураг оруулах" : "Add Cover Photo"}</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={coverInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleBackgroundFileChange}
                  />
                </div>

                {/* Overlapping Avatar */}
                <div
                  className="cp-avatar"
                  onClick={() => avatarInputRef.current?.click()}
                  title={isMn ? "Зураг оруулах" : "Click to upload profile photo"}
                >
                  <img
                    src={preview || "/img/default-user.png"}
                    alt="Avatar Preview"
                    onError={(e) => {
                      e.target.src = "/img/default-user.png";
                    }}
                  />
                  <div className="cp-avatar-badge">
                    <Camera size={13} />
                  </div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleProfileFileChange}
                  />
                </div>
              </div>

              {/* Customer Form */}
              <form onSubmit={handleCustomerSubmit} noValidate style={{ marginTop: 28 }}>
                <div className="lg-fields">
                  {/* Name Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label>
                      <input
                        type="text"
                        name="firstName"
                        maxLength={25}
                        placeholder={isMn ? "Нэр *" : "First name *"}
                        className="lg-in"
                        value={customerData.firstName}
                        onChange={handleCustomerChange}
                        required
                      />
                    </label>
                    <label>
                      <input
                        type="text"
                        name="lastName"
                        maxLength={25}
                        placeholder={isMn ? "Овог *" : "Last name *"}
                        className="lg-in"
                        value={customerData.lastName}
                        onChange={handleCustomerChange}
                        required
                      />
                    </label>
                  </div>

                  {/* Gender Select */}
                  <label>
                    <select
                      name="gender"
                      value={customerData.gender}
                      onChange={handleCustomerChange}
                      className="lg-in"
                      style={{
                        cursor: "pointer",
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 20px center",
                        paddingRight: "44px",
                      }}
                    >
                      <option value="" disabled style={{ background: "#1a1a1a", color: "#888" }}>
                        {isMn ? "Хүйс" : "Gender"}
                      </option>
                      <option value="male" style={{ background: "#1a1a1a", color: "#fff" }}>
                        {isMn ? "Эрэгтэй" : "Male"}
                      </option>
                      <option value="female" style={{ background: "#1a1a1a", color: "#fff" }}>
                        {isMn ? "Эмэгтэй" : "Female"}
                      </option>
                      <option value="other" style={{ background: "#1a1a1a", color: "#fff" }}>
                        {isMn ? "Бусад" : "Other"}
                      </option>
                    </select>
                  </label>

                  {/* Date of Birth */}
                  <label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="date"
                        name="dob"
                        className="lg-in"
                        value={customerData.dob}
                        onChange={handleCustomerChange}
                        max={new Date().toISOString().split("T")[0]}
                        style={{
                          colorScheme: "dark",
                          cursor: "pointer",
                        }}
                        required
                      />
                    </div>
                  </label>

                  {/* Bio (Optional) */}
                  <label>
                    <textarea
                      name="bio"
                      rows={2}
                      maxLength={150}
                      placeholder={isMn ? "Товч танилцуулга (заавал биш)" : "Short bio (optional)"}
                      className="lg-in"
                      value={customerData.bio}
                      onChange={handleCustomerChange}
                      style={{
                        height: "auto",
                        minHeight: 80,
                        borderRadius: 20,
                        padding: "14px 20px",
                        resize: "vertical",
                        lineHeight: 1.4,
                      }}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="lg-submit"
                  disabled={loading || !customerData.firstName.trim() || !customerData.lastName.trim() || !customerData.dob}
                  style={{ marginTop: 24 }}
                >
                  {loading && <span className="lg-spin" />}
                  {loading ? (isMn ? "Шинэчилж байна…" : "Updating...") : (isMn ? "Үргэлжлүүлэх" : "Continue")}
                </button>
              </form>
            </>
          )}
        </section>
      </main>

      <style jsx>{`
        .cp-upload-wrap {
          position: relative;
          width: 100%;
          margin-bottom: 24px;
        }
        .cp-cover {
          width: 100%;
          height: 130px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px dashed rgba(255, 255, 255, 0.16);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .cp-cover:hover {
          border-color: var(--acc, #23ada4);
          background: rgba(35, 173, 164, 0.05);
        }
        .cp-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cp-cover-empty {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--bd-gray-500, #9ca3af);
          font-size: 13.5px;
          font-weight: 500;
        }
        .cp-avatar {
          position: absolute;
          bottom: -22px;
          left: 20px;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid var(--bd-ink-850, #141414);
          background: #222;
          overflow: visible;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }
        .cp-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }
        .cp-avatar-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--acc, #23ada4);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bd-ink-850, #141414);
          transition: transform 0.15s ease;
        }
        .cp-avatar:hover .cp-avatar-badge {
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}
