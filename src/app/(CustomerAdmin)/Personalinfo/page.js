"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnifiedProfile from "@/components/Profile/UnifiedProfile";

export default function PersonalInfo() {
  return (
    <ProtectedRoute>
      <UnifiedProfile forcedRole="CUSTOMER" />
    </ProtectedRoute>
  );
}
