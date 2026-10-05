"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnifiedProfile from "@/components/Profile/UnifiedProfile";

export default function OrganizerPersonalInfo() {
  return (
    <ProtectedRoute>
      <UnifiedProfile forcedRole="ORGANIZER" />
    </ProtectedRoute>
  );
}
