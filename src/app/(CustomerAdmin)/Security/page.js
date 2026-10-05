"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnifiedSecurity from "@/components/Security/UnifiedSecurity";

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <UnifiedSecurity role="customer" />
    </ProtectedRoute>
  );
}
