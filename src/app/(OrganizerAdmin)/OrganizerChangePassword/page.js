"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnifiedSecurity from "@/components/Security/UnifiedSecurity";

export default function OrganizerChangePasswordPage() {
  return (
    <ProtectedRoute>
      <UnifiedSecurity role="organizer" defaultOpenPassword={true} />
    </ProtectedRoute>
  );
}
