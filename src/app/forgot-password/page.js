"use client";
import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import authApi from "@/api/authApi";
import staffApi from "@/api/staffApi";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { t } = useLanguage();
  const role = searchParams.get("role");

  useEffect(() => {
    document.title = `${t("forgotPasswordQuestion")} - Bondy`;
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(t("pleaseEnterEmail") || "Please enter your email");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (role === "staff") {
        response = await staffApi.forgotPasswordInit({ email: email.trim() });
      } else {
        response = await authApi.forgotPasswordInit({ email: email.trim() });
      }

      if (response?.status) {
        localStorage.setItem("resetEmail", email.trim());
        if (role === "staff") {
          localStorage.setItem("resetRole", "staff");
        } else {
          localStorage.removeItem("resetRole");
        }
        toast.success(t("otpSentToEmail") || "Verification code sent to email");
        router.push("/reset-password");
      }
    } catch (error) {
      // Error handled by apiClient interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestRoute>
      <Header />
      <main className="lg-shell">
        <section className="lg-panel">

          {/* ── Icon mark ── */}
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
              fontSize: 24,
              marginBottom: 18,
            }}
          >
            🔒
          </span>

          {/* ── Title & Subtitle ── */}
          <h1 className="lg-h1">{t("forgotPasswordQuestion")}</h1>
          <p className="lg-sub" style={{ marginBottom: 20 }}>
            {t("noWorriesEnterEmail") || "Enter your email address and we'll send you a code to reset your password."}
          </p>

          {/* ── Form ── */}
          <form noValidate onSubmit={handleSubmit}>
            <div className="lg-fields">
              <label>
                <input
                  type="email"
                  name="email"
                  className="lg-in"
                  placeholder={t("enterYourEmail") || "Enter your email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              className="lg-submit"
              disabled={loading || !email.trim()}
              style={{ marginTop: 20 }}
            >
              {loading && <span className="lg-spin" />}
              {loading ? t("sending") || "Sending..." : t("sendVerificationCode") || "Send Verification Code"}
            </button>
          </form>

          {/* ── Back to Login Link ── */}
          <div className="lg-switch" style={{ marginTop: 22 }}>
            <span>{t("rememberPassword") || "Remember your password?"}</span>
            <Link href="/login" className="lg-switch-link">
              {t("backToLogin") || "Back to Login"}
            </Link>
          </div>
        </section>
      </main>
    </GuestRoute>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="lg-shell">
          <div className="lg-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="lg-spin" />
          </div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
