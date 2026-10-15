"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnifiedFavorites from "@/components/Favorites/UnifiedFavorites";

export default function CustomerFavoritePage() {
  return (
    <ProtectedRoute>
      <UnifiedFavorites titleKey="saved" />
    </ProtectedRoute>
  );
}
