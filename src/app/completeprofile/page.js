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
  ArrowLeft,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
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
    document.title = isMn ? "Бүртгэл баталгаажуулах - Bondy" : "Complete Profile - Bondy";

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
                      <ArrowLeft size={18} />
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
                      <ArrowLeft size={18} />
                    </button>
                    <span className="lg-eyebrow">
                      {isMn ? "Зохион байгуулагчийн хүсэлт · 2/2" : "Organizer application · 2/2"}
                    </span>
                  </div>

                  <h1 className="lg-h1">
                    {isMn ? "Профайлаа дүүргэх" : "Complete Profile"}
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
                      <ShieldCheck size={18} />
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
                <div>
                  <div className="lg-top">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="lg-back"
                      aria-label="Back"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <span className="lg-eyebrow">
                      {isMn ? "ЗОХИОН БАЙГУУЛАГЧИЙН ХҮСЭЛТ" : "ORGANIZER APPLICATION"}
                    </span>
                  </div>

                  <span
                    className="lg-mark"
                    style={{ background: "rgba(255, 138, 51, 0.14)", color: "#FF8A33" }}
                  >
                    <Clock size={34} />
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
                <div>
                  <div className="lg-top">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="lg-back"
                      aria-label="Back"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <span className="lg-eyebrow">
                      {isMn ? "ЗОХИОН БАЙГУУЛАГЧИЙН ХҮСЭЛТ" : "ORGANIZER APPLICATION"}
                    </span>
                  </div>

                  <span
                    className="lg-mark"
                    style={{ background: "rgba(35, 173, 164, 0.14)", color: "var(--acc-bright)" }}
                  >
                    <CheckCircle2 size={34} />
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
                <div>
                  <div className="lg-top">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="lg-back"
                      aria-label="Back"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <span className="lg-eyebrow">
                      {isMn ? "ЗОХИОН БАЙГУУЛАГЧИЙН ХҮСЭЛТ" : "ORGANIZER APPLICATION"}
                    </span>
                  </div>

                  <span
                    className="lg-mark"
                    style={{ background: "rgba(255, 90, 90, 0.13)", color: "#FF5A5A" }}
                  >
                    <AlertCircle size={34} />
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
                      <AlertCircle size={18} />
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
                  <ArrowLeft size={18} />
                </button>
                <span className="lg-eyebrow">
                  {isMn ? "ХЭРЭГЛЭГЧИЙН БҮРТГЭЛ" : "COMPLETE PROFILE"}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="lg-h1">
                {isMn ? "Профайлаа дүүргэх" : "Complete Profile"}
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
