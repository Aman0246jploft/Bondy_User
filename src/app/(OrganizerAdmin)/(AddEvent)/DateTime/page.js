"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DateTimeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const eventId = searchParams.get("eventId");
    const query = eventId ? `?step=2&eventId=${eventId}` : "?step=2";
    router.replace(`/BasicInfo${query}`);
  }, [router, searchParams]);

  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DateTimeRedirect />
    </Suspense>
  );
}
