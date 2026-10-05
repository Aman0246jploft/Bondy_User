"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import VerificationModl from "@/components/Modal/VerificationModl";
import { Upload, Camera, Building2, User } from "lucide-react";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";

export default function CompleteProfile() {
  return (
    <ProtectedRoute>
      <CompleteProfileContent />
    </ProtectedRoute>
  );
}

function CompleteProfileContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [categories, setCategories] = useState([]);
  const [modalShow, setModalShow] = useState(false);

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

  // Organizer Business details state
  const [organizerData, setOrganizerData] = useState({
    businessName: "",
    businessCategory: "",
    shortDesc: "",
    socialMediaLink: "",
  });

  useEffect(() => {
    document.title = "Complete Profile - Bondy";

    const fetchInitialData = async () => {
      try {
        const catRes = await authApi.getCategoryList();
        if (catRes?.status) {
          setCategories(catRes?.data?.categories || []);
        }

        const response = await authApi.getSelfProfile();
        if (response?.status) {
          const profile = response?.data?.user;
          if (profile?.roleId === 2 || profile?.organizerVerificationStatus) {
            setIsOrganizer(true);
            const isApproved = profile?.hasBeenApproved || profile?.isVerified || false;

            const hasBusinessDetails = !!(
              profile?.businessName ||
              profile?.businessCategory ||
              profile?.shortDesc ||
              profile?.socialMediaLink
            );

            if (!isApproved) {
              if (hasBusinessDetails) {
                setModalShow(true);
              } else {
                setOrganizerData({
                  businessName: profile?.businessName || "",
                  businessCategory: profile?.businessCategory || "",
                  shortDesc: profile?.shortDesc || "",
                  socialMediaLink: profile?.socialMediaLink || "",
                });
              }
            } else {
              router.push("/");
            }
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
  }, [router]);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName" || name === "lastName") {
      const cleanValue = value.replace(/\d/g, "");
      setCustomerData((prev) => ({ ...prev, [name]: cleanValue }));
    } else {
      setCustomerData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOrganizerChange = (e) => {
    const { name, value } = e.target;
    setOrganizerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerData.firstName.trim() || !customerData.lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }
    if (!customerData.dob) {
      toast.error("Please enter your date of birth");
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
        toast.success("Profile updated!");
        router.push("/insterest");
      }
    } catch (error) {
      console.error("Customer profile update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerSubmit = async (e) => {
    e.preventDefault();
    if (!organizerData.businessName.trim() || !organizerData.businessCategory) {
      toast.error("Business Name and Primary Category are required");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        businessVerification: {
          businessName: organizerData.businessName.trim(),
          businessCategory: organizerData.businessCategory,
          shortDesc: organizerData.shortDesc.trim(),
          socialMediaLink: organizerData.socialMediaLink.trim(),
        },
      };

      const response = await authApi.submitVerification(payload);
      if (response?.status) {
        setModalShow(true);
      }
    } catch (error) {
      console.error("Organizer verification submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <>
        <Header />
        <div className="lg-shell">
          <div className="lg-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
            <span className="lg-spin" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="lg-shell" style={{ padding: "36px 20px" }}>
        <section className="lg-panel" style={{ maxWidth: 520 }}>
          {isOrganizer ? (
            /* ══════════════ ORGANIZER COMPLETE PROFILE ══════════════ */
            <>
              {/* Icon */}
              <span
                className="lg-otp-mark"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "999px",
                  background: "rgba(35,173,164,.14)",
                  color: "var(--acc-bright)",
                  marginBottom: 16,
                }}
              >
                <Building2 size={26} />
              </span>

              {/* Title & Subtitle */}
              <h1 className="lg-h1">Tell us about your organization</h1>
              <p className="lg-sub" style={{ marginBottom: 24 }}>
                Help us verify your organizer account so you can start creating events.
              </p>

              {/* Form */}
              <form onSubmit={handleOrganizerSubmit} noValidate>
                <div className="lg-fields">
                  {/* Business Name */}
                  <label>
                    <input
                      type="text"
                      name="businessName"
                      maxLength={50}
                      placeholder="Organizer / Business name *"
                      className="lg-in"
                      value={organizerData.businessName}
                      onChange={handleOrganizerChange}
                      required
                    />
                  </label>

                  {/* Primary Category */}
                  <label>
                    <select
                      name="businessCategory"
                      value={organizerData.businessCategory}
                      onChange={handleOrganizerChange}
                      className="lg-in"
                      style={{
                        cursor: "pointer",
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 20px center",
                        paddingRight: "44px",
                      }}
                      required
                    >
                      <option value="" disabled style={{ background: "#1a1a1a", color: "#888" }}>
                        Select Primary Category *
                      </option>
                      {categories?.map((cat) => (
                        <option key={cat._id} value={cat._id} style={{ background: "#1a1a1a", color: "#fff" }}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Short Description */}
                  <label>
                    <textarea
                      name="shortDesc"
                      rows={3}
                      maxLength={150}
                      placeholder="Tell us about your organization (short description)"
                      className="lg-in"
                      value={organizerData.shortDesc}
                      onChange={handleOrganizerChange}
                      style={{
                        height: "auto",
                        minHeight: 96,
                        borderRadius: 20,
                        padding: "16px 20px",
                        resize: "vertical",
                        lineHeight: 1.4,
                      }}
                    />
                  </label>

                  {/* Social Media Link */}
                  <label>
                    <input
                      type="text"
                      name="socialMediaLink"
                      placeholder="Instagram or Facebook link (optional)"
                      className="lg-in"
                      value={organizerData.socialMediaLink}
                      onChange={handleOrganizerChange}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="lg-submit"
                  disabled={loading || !organizerData.businessName.trim() || !organizerData.businessCategory}
                  style={{ marginTop: 24 }}
                >
                  {loading && <span className="lg-spin" />}
                  {loading ? "Submitting..." : "Submit for review"}
                </button>
              </form>
            </>
          ) : (
            /* ══════════════ CUSTOMER COMPLETE PROFILE ══════════════ */
            <>
              {/* Title & Subtitle */}
              <h1 className="lg-h1">Complete Profile</h1>
              <p className="lg-sub" style={{ marginBottom: 20 }}>
                Complete your personal details to personalize your event experience.
              </p>

              {/* Cover & Avatar Upload Hero */}
              <div className="cp-upload-wrap">
                {/* Cover Banner */}
                <div
                  className="cp-cover"
                  onClick={() => coverInputRef.current?.click()}
                  title="Click to change cover photo"
                >
                  {backgroundPreview ? (
                    <img src={backgroundPreview} alt="Cover Preview" className="cp-cover-img" />
                  ) : (
                    <div className="cp-cover-empty">
                      <Upload size={18} />
                      <span>Add Cover Photo</span>
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
                  title="Click to upload profile photo"
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
                        placeholder="First name *"
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
                        placeholder="Last name *"
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
                        Gender
                      </option>
                      <option value="male" style={{ background: "#1a1a1a", color: "#fff" }}>Male</option>
                      <option value="female" style={{ background: "#1a1a1a", color: "#fff" }}>Female</option>
                      <option value="other" style={{ background: "#1a1a1a", color: "#fff" }}>Other</option>
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
                      placeholder="Short bio (optional)"
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
                  {loading ? "Updating..." : "Continue"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>

      <VerificationModl
        show={modalShow}
        onHide={() => {
          setModalShow(false);
          localStorage.removeItem("token");
          router.push("/");
        }}
        onGoBack={() => {
          localStorage.removeItem("token");
        }}
        redirectPath="/"
      />

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
