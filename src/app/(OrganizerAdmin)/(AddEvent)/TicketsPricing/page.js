"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TicketsPricingRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const eventId = searchParams.get("eventId");
    const query = eventId ? `?step=3&eventId=${eventId}` : "?step=3";
    router.replace(`/BasicInfo${query}`);
  }, [router, searchParams]);

  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TicketsPricingRedirect />
    </Suspense>
  );
}
