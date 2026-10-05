"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import LanguageSelector from "@/components/LanguageSelector";
import authApi from "@/api/authApi";
import staffApi from "@/api/staffApi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";
import { useGoogleLogin } from "@react-oauth/google";

export default function Page() {
  const router = useRouter();
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Customer"); // "Customer" | "Organizer" | "Staff"

  useEffect(() => {
    document.title = `${t("login")} - Bondy`;
  }, [t]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const validateForm = (data) => {
    const newErrors = {};
    const email = data.email.trim();
    const password = data.password.trim();
    if (!email) {
      newErrors.email = t("emailRequired");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) newErrors.email = t("pleaseEnterValidEmail");
    }
    if (!password) {
      newErrors.password = t("passwordRequired");
    } else {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$&*~%^()_+=\[\]{};:<>|./?,-]).{8,}$/;
      if (!passwordRegex.test(password)) newErrors.password = t("passwordComplexity");
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedData = {
      email: formData.email.trim(),
      password: formData.password.trim(),
    };
    setFormData(trimmedData);
    const validationErrors = validateForm(trimmedData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      if (activeTab === "Staff") {
        const response = await staffApi.loginStaff({
          email: trimmedData.email,
          password: trimmedData.password,
        });
        if (response?.status) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("userProfile", JSON.stringify(response.data.user));
          toast.success("Logged in successfully as Staff");
          router.push("/StaffHome");
        }
      } else {
        const roleType = activeTab === "Organizer" ? "ORGANIZER" : "CUSTOMER";
        const response = await authApi.loginInit({
          email: trimmedData.email,
          password: trimmedData.password,
          type: roleType,
        });
        if (response?.status) {
          localStorage.setItem("loginEmail", trimmedData.email);
          localStorage.setItem("loginType", roleType);
          router.push("/otp?flow=login");
        }
      }
    } catch (error) {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handlePostLoginRedirect = async () => {
    try {
      const profileRes = await authApi.getSelfProfile();
      if (profileRes?.status) {
        const profile = profileRes?.data?.user;
        if (profile) localStorage.setItem("userProfile", JSON.stringify(profile));
        const isOrganizer = profile?.roleId === 2 || profile?.organizerVerificationStatus;
        if (isOrganizer) {
          if (!profile?.businessName || !profile?.businessCategory) return router.push("/completeprofile");
          if (!(profile?.hasBeenApproved || profile?.isVerified)) return router.push("/completeprofile");
          router.push("/");
        } else {
          if (!profile?.firstName || !profile?.lastName) return router.push("/completeprofile");
          if (!profile?.categories || profile?.categories.length === 0) return router.push("/insterest");
          router.push("/");
        }
      } else {
        router.push("/completeprofile");
      }
    } catch {
      router.push("/completeprofile");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        const roleType = activeTab === "Organizer" ? "ORGANIZER" : "CUSTOMER";
        const response = await authApi.socialLogin({
          socialId: userInfo.sub,
          socialType: "GOOGLE",
          type: roleType,
          email: userInfo.email || "",
          firstName: userInfo.given_name || "",
          lastName: userInfo.family_name || "",
          profileImage: userInfo.picture || "",
        });
        if (response?.status) {
          if (response?.data?.token) localStorage.setItem("token", response?.data?.token);
          await handlePostLoginRedirect();
        }
      } catch (error) {
        // handled by interceptor
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => toast.error("Google login failed. Please try again."),
  });

  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setFormData({ email: "", password: "" });
    setShow(false);
  };

  return (
    <GuestRoute>
      <Header />
      <main className="lg-shell">
        <section className="lg-panel">

          {/* ── Staff badge ── */}
          {activeTab === "Staff" && (
            <div className="lg-staff-badge">
              🔒 {t("loginAsStaff")}
            </div>
          )}

          {/* ── Title ── */}
          <h1 className="lg-h1">
            {activeTab === "Staff" ? (t("staffLogin") || "Staff Sign In") : t("goodToSeeYouAgain")}
          </h1>
          <p className="lg-sub">
            {activeTab === "Staff"
              ? (t("staffLoginDesc") || "Enter your staff credentials to continue.")
              : t("smartTravelPlans")}
          </p>

          {/* ── Customer / Organizer segment (hidden for Staff) ── */}
          {activeTab !== "Staff" && (
            <div className="lg-seg" role="tablist">
              <button
                type="button"
                role="tab"
                className="lg-seg-btn"
                aria-selected={activeTab === "Customer" ? "true" : "false"}
                onClick={() => switchTab("Customer")}
              >
                {t("customer")}
              </button>
              <button
                type="button"
                role="tab"
                className="lg-seg-btn"
                aria-selected={activeTab === "Organizer" ? "true" : "false"}
                onClick={() => switchTab("Organizer")}
              >
                {t("organizer")}
              </button>
            </div>
          )}

          {/* ── Form ── */}
          <form className="login_field" noValidate onSubmit={handleLogin}>
            <div className="lg-fields">
              {/* Email */}
              <label>
                <input
                  type="email"
                  name="email"
                  maxLength={50}
                  placeholder={t("email")}
                  value={formData.email}
                  onChange={handleChange}
                  className="lg-in"
                  aria-invalid={!!errors.email}
                  aria-label={t("email")}
                />
                {errors.email && <span className="lg-err">{errors.email}</span>}
              </label>

              {/* Password */}
              <label>
                <div className="lg-pw">
                  <input
                    type={show ? "text" : "password"}
                    name="password"
                    maxLength={50}
                    placeholder={t("enterPassword")}
                    value={formData.password}
                    onChange={handleChange}
                    className="lg-in"
                    aria-invalid={!!errors.password}
                    aria-label={t("enterPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="lg-eye-btn"
                    aria-label="Toggle password"
                  >
                    <img src={show ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle password" />
                  </button>
                </div>
                {errors.password && <span className="lg-err">{errors.password}</span>}
              </label>
            </div>

            {/* Forgot password */}
            <Link
              href={activeTab === "Staff" ? "/forgot-password?role=staff" : "/forgot-password"}
              className="lg-forgot"
            >
              {t("forgotPasswordQuestion")}
            </Link>

            {/* Submit */}
            <button type="submit" disabled={loading} className="lg-submit">
              {loading && <span className="lg-spin" />}
              {loading ? t("signingIn") : t("signIn")}
            </button>
          </form>

          {/* ── Social (Customer / Organizer only) ── */}
          {activeTab !== "Staff" && (
            <>
              <div className="lg-or">
                <span>{t("orSignUpWith")}</span>
              </div>
              <div className="lg-social">
                {/* Apple — disabled */}
                <button type="button" disabled className="lg-social-btn" title="Apple login coming soon">
                  <span className="lg-circle">
                    <img src="/img/app_icon.svg" alt="apple" />
                  </span>
                  <span>Apple</span>
                </button>
                {/* Google — active */}
                <button
                  type="button"
                  onClick={() => googleLogin()}
                  disabled={googleLoading}
                  className="lg-social-btn"
                  title="Sign in with Google"
                >
                  <span className="lg-circle">
                    {googleLoading
                      ? <span className="lg-spin" />
                      : <img src="/img/google_icon.svg" alt="google" />}
                  </span>
                  <span>Google</span>
                </button>
              </div>
            </>
          )}

          {/* ── Bottom links ── */}
          {activeTab !== "Staff" ? (
            <>
              <div className="lg-switch">
                <span>{t("dontHaveAccount")}</span>
                <Link href="/register" className="lg-switch-link">{t("signUp")}</Link>
              </div>
              <Link href="/" className="lg-guest-link">{t("continueAsGuest")}</Link>
              <button type="button" onClick={() => switchTab("Staff")} className="lg-staff-link">
                {t("loginAsStaff")}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => switchTab("Customer")} className="lg-staff-link">
              {t("backToUserLogin")}
            </button>
          )}
        </section>
      </main>
    </GuestRoute>
  );
}
