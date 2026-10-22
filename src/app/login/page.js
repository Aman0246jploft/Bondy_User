"use client";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import LanguageSelector from "@/components/LanguageSelector";
import authApi from "@/api/authApi";
import staffApi from "@/api/staffApi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";
import { useGoogleLogin } from "@react-oauth/google";

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    ["eventCreationData", "bondy_favorites", "bondy_social_links", "bondy_footer_links"].forEach((name) => {
      try { localStorage.removeItem(name); } catch (e) { /* storage is full */ }
    });
    try { localStorage.setItem(key, value); } catch (e) { /* still full; login can continue */ }
  }
}

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
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [codeLoading, setCodeLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const codeRefs = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role") || params.get("tab") || params.get("type");
    if (roleParam && roleParam.toLowerCase() === "staff") {
      setActiveTab("Staff");
    }
    const step = params.get("step");
    const email = sessionStorage.getItem("bondyLoginEmail") || localStorage.getItem("loginEmail");
    if (step === "otp") {
      if (email) {
        setFormData((prev) => ({ ...prev, email }));
      }
      setShowCode(true);
      setTimer(60);
    }
  }, []);

  useEffect(() => {
    if (!showCode || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showCode, timer]);

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
    let leaving = false;
    try {
      if (activeTab === "Staff") {
        const response = await staffApi.loginStaff({
          email: trimmedData.email,
          password: trimmedData.password,
        });
        if (response?.status) {
          writeLocal("token", response.data.token);
          writeLocal("userProfile", JSON.stringify(response.data.user));
          toast.success(
            t("staffLoginSuccess") && t("staffLoginSuccess") !== "staffLoginSuccess"
              ? t("staffLoginSuccess")
              : (response?.message || "Logged in successfully as Staff")
          );
          leaving = true;
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
          try {
            sessionStorage.setItem("bondyLoginEmail", trimmedData.email);
            sessionStorage.setItem("bondyLoginType", roleType);
          } catch (storageError) { /* session storage is optional */ }
          writeLocal("loginEmail", trimmedData.email);
          writeLocal("loginType", roleType);
          leaving = true;
          window.location.replace("/login?step=otp");
          return;
        }
      }
    } catch (error) {
      toast.error(error?.message || t("pleaseEnterFullOtp"));
    } finally {
      if (!leaving) setLoading(false);
    }
  };

  const handlePostLoginRedirect = async () => {
    const go = (path) => window.location.assign(path);
    try {
      const profileRes = await authApi.getSelfProfile();
      if (profileRes?.status) {
        const profile = profileRes?.data?.user;
        if (profile) writeLocal("userProfile", JSON.stringify(profile));
        const isOrganizer = profile?.roleId === 2 || profile?.organizerVerificationStatus;
        if (isOrganizer) {
          go("/OrganizerProfile");
          return;
        } else {
          let returnTo = "";
          try {
            returnTo = sessionStorage.getItem("bondy.returnTo") || "";
            sessionStorage.removeItem("bondy.returnTo");
          } catch (e) { }

          if (returnTo && returnTo.startsWith("/")) {
            go(returnTo);
            return;
          }

          if (!profile?.firstName || !profile?.lastName) return go("/completeprofile");
          if (!profile?.categories || profile?.categories.length === 0) return go("/insterest");
          go("/");
        }
      } else {
        go("/completeprofile");
      }
    } catch {
      go("/completeprofile");
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const otpValue = code.join("");
    if (otpValue.length < 5) {
      toast.error(t("pleaseEnterFullOtp"));
      return;
    }
    setCodeLoading(true);
    try {
      const response = await authApi.verifyUniversalOtp({
        email: formData.email.trim(),
        otp: otpValue,
        type: "LOGIN",
      });
      if (response?.status) {
        if (response?.data?.token) writeLocal("token", response.data.token);
        if (response?.data?.user) writeLocal("userProfile", JSON.stringify(response.data.user));
        localStorage.removeItem("loginEmail");
        localStorage.removeItem("loginType");
        sessionStorage.removeItem("bondyLoginEmail");
        sessionStorage.removeItem("bondyLoginType");
        await handlePostLoginRedirect();
      }
    } catch (error) {
      // handled by interceptor
    } finally {
      setCodeLoading(false);
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
          if (response?.data?.token) writeLocal("token", response?.data?.token);
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

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (!pasted) return;
    const nextCode = ["", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      nextCode[i] = pasted[i];
    }
    setCode(nextCode);
    const nextIdx = Math.min(pasted.length, 4);
    codeRefs.current[nextIdx]?.focus();
  };

  const handleResendOtp = async () => {
    if (timer > 0 || resendLoading) return;
    const emailToUse =
      formData.email ||
      (typeof window !== "undefined" &&
        (sessionStorage.getItem("bondyLoginEmail") ||
          localStorage.getItem("loginEmail") ||
          localStorage.getItem("registerEmail")));

    if (!emailToUse) {
      toast.error(t("emailNotFound") || "Email not found");
      return;
    }

    setResendLoading(true);
    try {
      const response = await authApi.resendUniversalOtp({
        email: emailToUse,
        type: "LOGIN",
      });
      if (response?.status) {
        toast.success(t("otpResentSuccessfully") || "OTP resent successfully");
        setTimer(60);
        setCode(["", "", "", "", ""]);
        codeRefs.current[0]?.focus();
      }
    } catch (error) {
      // Handled by interceptor
    } finally {
      setResendLoading(false);
    }
  };

  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

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

          {showCode ? (
            <form onSubmit={handleVerifyCode}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", marginBottom: 16 }}>
                <button
                  type="button"
                  className="lg-back"
                  onClick={() => setShowCode(false)}
                  aria-label={t("goBack") || "Go back"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "1px solid var(--bd-border-strong, #333)",
                    background: "transparent",
                    color: "var(--bd-white, #fff)",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
              </div>

              <h1 className="lg-h1">{t("enterVerificationCode")}</h1>
              <p className="lg-sub" style={{ marginBottom: 0 }}>{t("weSentCode")}</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "var(--acc-bright)", wordBreak: "break-all" }}>
                {formData.email}
              </p>
              <div className="lg-otp" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    className="lg-otp-input"
                    value={digit}
                    ref={(el) => { codeRefs.current[index] = el; }}
                    aria-label={`OTP digit ${index + 1}`}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, "").slice(-1);
                      const next = [...code];
                      next[index] = value;
                      setCode(next);
                      if (value && index < 4) codeRefs.current[index + 1]?.focus();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !code[index] && index > 0) {
                        codeRefs.current[index - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              {/* ── Resend countdown row ── */}
              <div
                className="lg-resend-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 22,
                  marginBottom: 6,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "var(--bd-gray-400, #9ca3af)" }}>
                  {t("didntReceiveCode") || "Didn't receive the code?"}
                </span>
                {timer > 0 ? (
                  <span
                    className="lg-resend-timer"
                    style={{
                      fontWeight: 600,
                      color: "var(--bd-gray-400, #9ca3af)",
                    }}
                  >
                    {t("resendIn") || "Resend in"} ({mm}:{ss})
                  </span>
                ) : (
                  <button
                    type="button"
                    className="lg-resend-btn"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--acc-bright, #10B981)",
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    {resendLoading ? (t("sending") || "Sending...") : (t("resendOtp") || "Resend OTP")}
                  </button>
                )}
              </div>

              {/* ── Action Buttons ── */}
              <button
                type="submit"
                disabled={codeLoading || code.join("").length < 5}
                className="lg-submit"
                style={{ marginTop: 14 }}
              >
                {codeLoading && <span className="lg-spin" />}
                {codeLoading ? t("verifying") : t("verifyAndContinue")}
              </button>

              <button
                type="button"
                className="lg-btn-secondary"
                onClick={() => setShowCode(false)}
              >
                {t("goBack") || "Go back"}
              </button>
            </form>
          ) : (
            <>
              {/* ── Title ── */}
              <h1 className="lg-h1">
                {activeTab === "Staff"
                  ? (t("loginAsStaff") || t("staffLogin") || "Login as Staff")
                  : t("goodToSeeYouAgain")}
              </h1>
              <p className="lg-sub">
                {activeTab === "Staff"
                  ? (t("staffLoginDesc") !== "staffLoginDesc" ? t("staffLoginDesc") : "Enter your credentials to continue.")
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
                    {t("user") || "User"}
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
            </>
          )}
        </section>
      </main>
    </GuestRoute>
  );
}
