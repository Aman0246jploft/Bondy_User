"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AgeRestrictionRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const eventId = searchParams.get("eventId");
    const query = eventId ? `?step=4&eventId=${eventId}` : "?step=4";
    router.replace(`/BasicInfo${query}`);
  }, [router, searchParams]);

  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AgeRestrictionRedirect />
    </Suspense>
  );
}
