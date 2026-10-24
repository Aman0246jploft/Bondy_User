"use client";
import React, { useState } from "react";

/**
 * LocationPreviewMap - High-visibility map & location preview card.
 * Renders an embedded interactive map if coordinates are provided,
 * or a stylized high-contrast map graphic with a prominent glowing pin.
 * Clicking opens the destination in Google Maps.
 */
export default function LocationPreviewMap({
  latitude,
  longitude,
  venueAddress,
  coordinates,
  address = "",
  venueName = "",
  googleMapsUrl,
  width = 132,
  height = 132,
  borderRadius = 18,
  className = "",
  style = {},
}) {
  const [iframeError, setIframeError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  let rawLat = latitude;
  let rawLng = longitude;
  if ((rawLat == null || rawLng == null) && venueAddress) {
    if (venueAddress.latitude != null && venueAddress.longitude != null) {
      rawLat = venueAddress.latitude;
      rawLng = venueAddress.longitude;
    } else if (Array.isArray(venueAddress.coordinates) && venueAddress.coordinates.length >= 2) {
      rawLng = venueAddress.coordinates[0];
      rawLat = venueAddress.coordinates[1];
    }
  } else if ((rawLat == null || rawLng == null) && Array.isArray(coordinates) && coordinates.length >= 2) {
    rawLng = coordinates[0];
    rawLat = coordinates[1];
  }

  const lat = typeof rawLat === "number" ? rawLat : parseFloat(rawLat);
  const lng = typeof rawLng === "number" ? rawLng : parseFloat(rawLng);
  const hasCoords =
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0 &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  const effectiveAddress = address || venueAddress?.address || "";
  const effectiveVenue = venueName || venueAddress?.venueName || "";
  const effectiveQuery = [effectiveVenue, effectiveAddress].filter(Boolean).join(", ");
  const effectiveUrl =
    googleMapsUrl ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          effectiveQuery || "Ulaanbaatar, Mongolia"
        )}`);

  const bbox = hasCoords
    ? `${(lng - 0.007).toFixed(6)}%2C${(lat - 0.0045).toFixed(6)}%2C${(
        lng + 0.007
      ).toFixed(6)}%2C${(lat + 0.0045).toFixed(6)}`
    : "";
  const embedSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(
        6
      )}%2C${lng.toFixed(6)}`
    : "";

  return (
    <a
      href={effectiveUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={effectiveQuery ? `Open ${effectiveQuery} on Google Maps` : "Open location in Google Maps"}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        width,
        height,
        flexShrink: 0,
        borderRadius,
        overflow: "hidden",
        border: isHovered
          ? "1.5px solid var(--acc, #23ada4)"
          : "1px solid var(--bd-border, rgba(255, 255, 255, 0.15))",
        background: "linear-gradient(160deg, #18222b 0%, #0d1217 100%)",
        display: "block",
        cursor: "pointer",
        textDecoration: "none",
        boxShadow: isHovered
          ? "0 8px 24px rgba(35, 173, 164, 0.25), 0 4px 12px rgba(0, 0, 0, 0.5)"
          : "0 4px 14px rgba(0, 0, 0, 0.35)",
        transition: "all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)",
        transform: isHovered ? "translateY(-1px) scale(1.02)" : "none",
        ...style,
      }}
    >
      {hasCoords && !iframeError ? (
        <>
          <iframe
            title="Location Map"
            src={embedSrc}
            onError={() => setIframeError(true)}
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              pointerEvents: "none",
              display: "block",
              filter: "contrast(1.08) saturate(1.15) brightness(0.92)",
            }}
            loading="lazy"
          />
          {/* Subtle gradient vignette overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at center, rgba(35, 173, 164, 0.08) 0%, rgba(13, 18, 23, 0.42) 100%)",
            }}
          />
        </>
      ) : (
        /* Stylized high-contrast map graphic fallback */
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "linear-gradient(145deg, #131c24 0%, #0c1117 100%)",
          }}
        >
          {/* Decorative roads & map terrain paths */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 132 132"
            fill="none"
            style={{ position: "absolute", inset: 0, opacity: 0.45 }}
          >
            <rect width="132" height="132" fill="#0c1117" />
            {/* Grid lines */}
            <path
              d="M0 33 H132 M0 66 H132 M0 99 H132 M33 0 V132 M66 0 V132 M99 0 V132"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="1"
            />
            {/* Arterial Roads */}
            <path
              d="M-10 40 Q 50 60, 80 20 T 150 35"
              stroke="#23ada4"
              strokeWidth="3.5"
              strokeOpacity="0.75"
              fill="none"
            />
            <path
              d="M15 145 Q 65 95, 85 115 T 145 85"
              stroke="#36cec2"
              strokeWidth="2.5"
              strokeOpacity="0.8"
              fill="none"
            />
            <path
              d="M-15 90 L 145 80"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <path
              d="M66 -10 L 66 142"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
            />
            {/* Radar rings */}
            <circle
              cx="66"
              cy="66"
              r="46"
              stroke="rgba(35, 173, 164, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <circle
              cx="66"
              cy="66"
              r="24"
              stroke="rgba(35, 173, 164, 0.5)"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      )}

      {/* Prominent Glowing Center Marker Pin */}
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #2fd1c6 0%, #17837b 100%)",
          boxShadow:
            "0 0 18px rgba(35, 173, 164, 0.85), 0 4px 10px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
          color: "#ffffff",
          pointerEvents: "none",
          zIndex: 3,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </span>

      {/* Bottom Open/Google Map Pill Badge */}
      <span
        style={{
          position: "absolute",
          bottom: 7,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: "#ffffff",
          background: "rgba(10, 14, 20, 0.82)",
          backdropFilter: "blur(6px)",
          padding: "2.5px 8px",
          borderRadius: 999,
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          pointerEvents: "none",
          zIndex: 3,
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--acc-bright, #36cec2)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Map
      </span>
    </a>
  );
}
