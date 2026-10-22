"use client";

import React, { Suspense } from "react";
import TicketDetailView from "@/components/Tickets/TicketDetailView";
import GlobalLoader from "@/components/GlobalLoader";

export default function OrganizerBookingDetailPage() {
  return (
    <Suspense fallback={<GlobalLoader fullScreen={false} />}>
      <TicketDetailView />
    </Suspense>
  );
}
