"use client";

import React, { Suspense } from "react";
import TicketDetailView from "@/components/Tickets/TicketDetailView";

export default function TicketDetailsPage() {
  return (
    <Suspense fallback={null}>
      <TicketDetailView showCustomerNav />
    </Suspense>
  );
}
