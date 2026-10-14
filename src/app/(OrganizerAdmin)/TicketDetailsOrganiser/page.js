"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import bookingApi from "@/api/bookingApi";
import { useLanguage } from "@/context/LanguageContext";
import TicketDetailView from "@/components/Tickets/TicketDetailView";
import BookingDetailView from "@/components/Tickets/BookingDetailView";

const ORDERS = "/MyTicketsOrganiser";

function OrderDetail() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const id = params.get("id");
  const view = params.get("view");
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!id) {
      setState("error");
      return undefined;
    }
    let cancelled = false;
    setState("loading");
    bookingApi.getTicketDetail(id).then((res) => {
      if (cancelled) return;
      if (!res?.status || !res.data?.ticket) {
        setState("error");
      } else {
        setData(res.data);
        setState("ready");
      }
    }).catch(() => {
      if (!cancelled) setState("error");
    });
    return () => {
      cancelled = true;
    };
  }, [id, retry]);

  if (state === "loading") {
    return <div className="td-state-page"><b>{t("loading")}</b></div>;
  }
  if (state === "error" || !data) {
    return (
      <div className="td-state-page">
        <b>{t("bdLoadFail")}</b>
        <p style={{ margin: "8px 0 14px", color: "#bdbdbd" }}>{t("obLoadFailBody")}</p>
        <button
          type="button"
          onClick={() => setRetry((n) => n + 1)}
          style={{ height: 42, padding: "0 22px", border: "none", borderRadius: 12, background: "#23ada4", color: "#fff", fontWeight: 700, cursor: "pointer" }}
        >
          {t("obRetry")}
        </button>
      </div>
    );
  }

  // Events open on the ticket page. Courses open on the booking page, with the
  // QR code one step further on.
  const isCourse = data.ticket.bookingType === "COURSE";
  if (isCourse && view !== "qr") {
    return (
      <BookingDetailView
        data={data}
        ordersHref={ORDERS}
        qrHref={`/TicketDetailsOrganiser?id=${id}&view=qr`}
      />
    );
  }
  return <TicketDetailView data={data} ordersHref={ORDERS} />;
}

export default function TicketDetailsOrganiserPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <OrderDetail />
    </Suspense>
    </ProtectedRoute>
  );
}
