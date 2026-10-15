"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TicketDetailView from "@/components/Tickets/TicketDetailView";
import CustomerBookingDetail from "@/components/Tickets/CustomerBookingDetail";

function TicketDetailsInner() {
  const view = useSearchParams().get("view");
  if (view === "qr") return <TicketDetailView showCustomerNav />;
  return <CustomerBookingDetail />;
}

export default function TicketDetailsPage() {
  return (
    <Suspense fallback={null}>
      <TicketDetailsInner />
    </Suspense>
  );
}
