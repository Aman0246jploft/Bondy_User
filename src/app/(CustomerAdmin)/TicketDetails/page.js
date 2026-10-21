"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TicketDetailView from "@/components/Tickets/TicketDetailView";
import CustomerBookingDetail from "@/components/Tickets/CustomerBookingDetail";
import GlobalLoader from "@/components/GlobalLoader";

function TicketDetailsInner() {
  const view = useSearchParams().get("view");
  if (view === "qr") return <TicketDetailView showCustomerNav />;
  return <CustomerBookingDetail />;
}

export default function TicketDetailsPage() {
  return (
    <Suspense fallback={<GlobalLoader fullScreen={false} />}>
      <TicketDetailsInner />
    </Suspense>
  );
}
