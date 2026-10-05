"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OTPSignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/otp?flow=signup");
  }, [router]);

  return (
    <div className="lg-shell">
      <div className="lg-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="lg-spin" />
      </div>
    </div>
  );
}
