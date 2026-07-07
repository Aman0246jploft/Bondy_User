import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Map({
  latitude,
  longitude,
  title,
  address,
  venueName,
  imageUrl,
  ticketPrice,
  startDate,
  startTime,
  endTime,
}) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { t, language } = useLanguage();

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    if (document.getElementById(scriptId)) {
      const check = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          clearInterval(check);
        }
      }, 100);
      return () => clearInterval(check);
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize and Update Map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const position = {
      lat: parseFloat(latitude) || 37.33,
      lng: parseFloat(longitude) || -121.88,
    };

    if (!googleMapRef.current) {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        minZoom: 12, // 🔒 prevents too much zoom out
        maxZoom: 18, // 🔒 prevents too much zoom in
        styles: [
          { elementType: "geometry", stylers: [{ color: "#121212" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
          {
            elementType: "labels.text.stroke",
            stylers: [{ color: "#121212" }],
          },
          {
            featureType: "administrative",
            elementType: "geometry",
            stylers: [{ color: "#757575" }],
          },
          {
            featureType: "administrative.country",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#bdbdbd" }],
          },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          {
            featureType: "road",
            elementType: "geometry.fill",
            stylers: [{ color: "#2c2c2c" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#8a8a8a" }],
          },
          {
            featureType: "road.arterial",
            elementType: "geometry",
            stylers: [{ color: "#373737" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#3c3c3c" }],
          },
          {
            featureType: "road.highway.controlled_access",
            elementType: "geometry",
            stylers: [{ color: "#4e4e4e" }],
          },
          {
            featureType: "road.local",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }],
          },
          {
            featureType: "transit",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#000000" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#3d3d3d" }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
      });
    } else {
      googleMapRef.current.setCenter(position);
    }

    // Remove previous marker/infowindow
    if (markerRef.current) markerRef.current.setMap(null);
    if (infoWindowRef.current) infoWindowRef.current.close();

    // Build InfoWindow HTML
    const formatDate = (d) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };
    const formatTime = (t) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const suffix = language === "mn" ? " Цаг" : " H";
      return `${hour.toString().padStart(2, "0")}:${m}${suffix}`;
    };

    const imgHtml = imageUrl
      ? `<img src="${imageUrl}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:8px 8px 0 0;display:block;" onerror="this.style.display='none'" />`
      : "";

    const dateLine = startDate
      ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
           <span style="font-size:14px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M11.3334 9.33332C11.7016 9.33332 12 9.03485 12 8.66666C12 8.29847 11.7016 7.99999 11.3334 7.99999C10.9652 7.99999 10.6667 8.29847 10.6667 8.66666C10.6667 9.03485 10.9652 9.33332 11.3334 9.33332Z" fill="url(#paint0_linear_4557_4578)"/>
  <path d="M11.3334 12C11.7016 12 12 11.7015 12 11.3333C12 10.9651 11.7016 10.6667 11.3334 10.6667C10.9652 10.6667 10.6667 10.9651 10.6667 11.3333C10.6667 11.7015 10.9652 12 11.3334 12Z" fill="url(#paint1_linear_4557_4578)"/>
  <path d="M8.66671 8.66666C8.66671 9.03485 8.36823 9.33332 8.00004 9.33332C7.63185 9.33332 7.33337 9.03485 7.33337 8.66666C7.33337 8.29847 7.63185 7.99999 8.00004 7.99999C8.36823 7.99999 8.66671 8.29847 8.66671 8.66666Z" fill="url(#paint2_linear_4557_4578)"/>
  <path d="M8.66671 11.3333C8.66671 11.7015 8.36823 12 8.00004 12C7.63185 12 7.33337 11.7015 7.33337 11.3333C7.33337 10.9651 7.63185 10.6667 8.00004 10.6667C8.36823 10.6667 8.66671 10.9651 8.66671 11.3333Z" fill="url(#paint3_linear_4557_4578)"/>
  <path d="M4.66671 9.33332C5.0349 9.33332 5.33337 9.03485 5.33337 8.66666C5.33337 8.29847 5.0349 7.99999 4.66671 7.99999C4.29852 7.99999 4.00004 8.29847 4.00004 8.66666C4.00004 9.03485 4.29852 9.33332 4.66671 9.33332Z" fill="url(#paint4_linear_4557_4578)"/>
  <path d="M4.66671 12C5.0349 12 5.33337 11.7015 5.33337 11.3333C5.33337 10.9651 5.0349 10.6667 4.66671 10.6667C4.29852 10.6667 4.00004 10.9651 4.00004 11.3333C4.00004 11.7015 4.29852 12 4.66671 12Z" fill="url(#paint5_linear_4557_4578)"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.66671 1.16666C4.94285 1.16666 5.16671 1.39051 5.16671 1.66666V2.17514C5.60804 2.16665 6.09426 2.16665 6.62901 2.16666H9.37099C9.90575 2.16665 10.392 2.16665 10.8334 2.17514V1.66666C10.8334 1.39051 11.0572 1.16666 11.3334 1.16666C11.6095 1.16666 11.8334 1.39051 11.8334 1.66666V2.21805C12.0067 2.23126 12.1708 2.24787 12.3261 2.26875C13.1077 2.37383 13.7403 2.59524 14.2392 3.09415C14.7381 3.59306 14.9595 4.22569 15.0646 5.00731C15.1667 5.76678 15.1667 6.73719 15.1667 7.96235V9.37093C15.1667 10.5961 15.1667 11.5665 15.0646 12.326C14.9595 13.1076 14.7381 13.7403 14.2392 14.2392C13.7403 14.7381 13.1077 14.9595 12.3261 15.0646C11.5666 15.1667 10.5962 15.1667 9.37101 15.1667H6.6291C5.40394 15.1667 4.4335 15.1667 3.67403 15.0646C2.89241 14.9595 2.25978 14.7381 1.76087 14.2392C1.26196 13.7403 1.04055 13.1076 0.935464 12.326C0.833355 11.5665 0.833364 10.5961 0.833374 9.37093V7.96238C0.833364 6.73721 0.833355 5.76678 0.935464 5.00731C1.04055 4.22569 1.26196 3.59306 1.76087 3.09415C2.25978 2.59524 2.89241 2.37383 3.67403 2.26875C3.82931 2.24787 3.99341 2.23126 4.16671 2.21805V1.66666C4.16671 1.39051 4.39057 1.16666 4.66671 1.16666ZM3.80727 3.25983C3.13655 3.35001 2.75012 3.51912 2.46798 3.80126C2.18584 4.0834 2.01672 4.46983 1.92655 5.14056C1.91128 5.25415 1.89851 5.37373 1.88783 5.49999H14.1123C14.1016 5.37373 14.0888 5.25415 14.0735 5.14056C13.9834 4.46983 13.8142 4.0834 13.5321 3.80126C13.25 3.51912 12.8635 3.35001 12.1928 3.25983C11.5077 3.16772 10.6046 3.16666 9.33337 3.16666H6.66671C5.39549 3.16666 4.49238 3.16772 3.80727 3.25983ZM1.83337 7.99999C1.83337 7.43065 1.83359 6.93514 1.8421 6.49999H14.158C14.1665 6.93514 14.1667 7.43065 14.1667 7.99999V9.33332C14.1667 10.6045 14.1656 11.5076 14.0735 12.1928C13.9834 12.8635 13.8142 13.2499 13.5321 13.5321C13.25 13.8142 12.8635 13.9833 12.1928 14.0735C11.5077 14.1656 10.6046 14.1667 9.33337 14.1667H6.66671C5.39549 14.1667 4.49238 14.1656 3.80727 14.0735C3.13655 13.9833 2.75012 13.8142 2.46798 13.5321C2.18584 13.2499 2.01672 12.8635 1.92655 12.1928C1.83444 11.5076 1.83337 10.6045 1.83337 9.33332V7.99999Z" fill="url(#paint6_linear_4557_4578)"/>
  <defs>
    <linearGradient id="paint0_linear_4557_4578" x1="4.4237" y1="-0.59321" x2="11.5116" y2="18.9812" gradientUnits="userSpaceOnUse">
      <stop stop-color="#23ADA4"/>
      <stop offset="1" stop-color="#23ADA4"/>
    </linearGradient>
    <linearGradient id="paint1_linear_4557_4578" x1="4.4237" y1="-0.59321" x2="11.5116" y2="18.9812" gradientUnits="userSpaceOnUse">
      <stop stop-color="#23ADA4"/>
      <stop offset="1" stop-color="#23ADA4"/>
    </linearGradient>
    <linearGradient id="paint2_linear_4557_4578" x1="4.4237" y1="-0.59321" x2="11.5116" y2="18.9812" gradientUnits="userSpaceOnUse">
      <stop stop-color="#23ADA4"/>
      <stop offset="1" stop-color="#23ADA4"/>
    </linearGradient>
    <linearGradient id="paint3_linear_4557_4578" x1="4.4237" y1="-0.59321" x2="11.5116" y2="18.9812" gradientUnits="userSpaceOnUse">
      <stop stop-color="#23ADA4"/>
      <stop offset="1" stop-color="#23ADA4"/>
    </linearGradient>
    <linearGradient id="paint4_linear_4557_4578" x1="4.4237" y1="-0.59321" x2="11.5116" y2="18.9812" gradientUnits="userSpaceOnUse">
      <stop stop-color="#23ADA4"/>
      <stop offset="1" stop-color="#23ADA4"/>
    </linearGradient>
    <linearGradient id="paint5_linear_4557_4578" x1="4.4237" y1="-0.59321" x2="11.5116" y2="18.9812" gradientUnits="userSpaceOnUse">
      <stop stop-color="#23ADA4"/>
      <stop offset="1" stop-color="#23ADA4"/>
    </linearGradient>
    <linearGradient id="paint6_linear_4557_4578" x1="4.4237" y1="-0.59321" x2="11.5116" y2="18.9812" gradientUnits="userSpaceOnUse">
      <stop stop-color="#23ADA4"/>
      <stop offset="1" stop-color="#23ADA4"/>
    </linearGradient>
  </defs>
</svg></span>
           <span style="font-size:12px;color:#ccc;">${formatDate(startDate)}${startTime ? ` &nbsp;${formatTime(startTime)}` : ""}${endTime ? ` – ${formatTime(endTime)}` : ""}</span>
         </div>`
      : "";

    const addressLine = address
      ? `<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;">
           <span style="font-size:14px;">📍</span>
           <span style="font-size:12px;color:#ccc;">${address}</span>
         </div>`
      : "";

    const priceLine =
      ticketPrice !== undefined && ticketPrice !== null
        ? `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
           <span style="font-size:14px;">🎟️</span>
           <span style="font-size:13px;font-weight:700;color:#23ada4;">₮${ticketPrice}</span>
         </div>`
        : "";

    const infoContent = `
      <div style="font-family:sans-serif;min-width:220px;max-width:260px;background:#242424;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.6);">
        ${imgHtml}
        <div style="padding:12px 14px 14px;">
          <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:8px;line-height:1.3;">${title || "Event"}</div>
          ${venueName ? `<div style="font-size:11px;color:#888;margin-bottom:8px;">${venueName}</div>` : ""}
          ${dateLine}
          ${addressLine}
          ${priceLine}
        </div>
      </div>`;

    // Create InfoWindow
    infoWindowRef.current = new window.google.maps.InfoWindow({
      content: infoContent,
      disableAutoPan: false,
    });

    // Create Marker
    const marker = new window.google.maps.Marker({
      position,
      map: googleMapRef.current,
      title: title || "Venue",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      },
      animation: window.google.maps.Animation.DROP,
    });
    markerRef.current = marker;

    // Keep popup stable: open on click and let user close manually if needed.
    marker.addListener("click", () => {
      infoWindowRef.current.open({ anchor: marker, map: googleMapRef.current });
    });

    // Auto-open on load
    infoWindowRef.current.open({ anchor: marker, map: googleMapRef.current });
  }, [
    isLoaded,
    latitude,
    longitude,
    title,
    address,
    venueName,
    imageUrl,
    ticketPrice,
    startDate,
    startTime,
    endTime,
    language,
  ]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "15px",
        background: "#1a1a1a",
      }}
      className="event-detail-map">
      {!isLoaded && (
        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
          {t("loadingMap")}
        </div>
      )}
    </div>
  );
}
