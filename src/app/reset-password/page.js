"use client";
import React, { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function ResetPasswordRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/forgot-password");
  }, [router]);

  return (
    <div className="lg-shell">
      <div
        className="lg-panel"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <span className="lg-spin" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordRedirect />
    </Suspense>
  );
}
