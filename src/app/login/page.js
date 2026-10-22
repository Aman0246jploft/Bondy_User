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
  const { t, language } = useLanguage();
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
                    <span>{language === "mn" ? "эсвэл" : "or"}</span>
                  </div>
                  <div className="lg-social">
                    {/* Apple */}
                    <button
                      type="button"
                      onClick={() => toast(language === "mn" ? "Тун удахгүй" : "Coming soon")}
                      className="lg-social-btn"
                      title="Apple login coming soon"
                    >
                      <span className="lg-circle">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                          <path d="M17.05 12.72c.02 2.68 2.35 3.57 2.38 3.58-.02.06-.37 1.27-1.23 2.51-.74 1.07-1.51 2.14-2.72 2.16-1.19.02-1.57-.71-2.93-.71-1.36 0-1.78.69-2.9.73-1.17.04-2.06-1.15-2.81-2.22C5.28 16.5 4.1 12.5 5.68 9.8c.79-1.35 2.2-2.2 3.72-2.22 1.15-.02 2.23.77 2.93.77.7 0 2.02-.95 3.4-.81.58.02 2.2.21 3.24 1.6-.08.05-1.93 1.13-1.92 3.58ZM14.83 5.9c.62-.75 1.04-1.79.92-2.83-.89.04-1.97.6-2.61 1.34-.58.66-1.08 1.72-.94 2.74.99.08 1.99-.5 2.63-1.25Z" />
                        </svg>
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
                        {googleLoading ? (
                          <span className="lg-spin" />
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2.1 5-4.4 6.5v5.4h7.1c4.2-3.8 6.6-9.5 6.6-16.1Z" />
                            <path fill="#34A853" d="M24 46c6 0 11-2 14.5-5.4l-7.1-5.4c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.8-12.3-9.1H4.4v5.6C7.9 41 15.4 46 24 46Z" />
                            <path fill="#FBBC05" d="M11.7 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.6H4.4C2.9 17.1 2 20.4 2 24s.9 6.9 2.4 9.8l7.3-5.6Z" />
                            <path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 30 2 24 2 15.4 2 7.9 7 4.4 14.2l7.3 5.6C13.4 14.2 18.3 10.4 24 10.4Z" />
                          </svg>
                        )}
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
