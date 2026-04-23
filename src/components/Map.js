import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Map({ latitude, longitude, title, address, venueName, imageUrl, ticketPrice, startDate, startTime, endTime }) {
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
      lng: parseFloat(longitude) || -121.88
    };

    if (!googleMapRef.current) {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        styles: [
          { "elementType": "geometry", "stylers": [{ "color": "#121212" }] },
          { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
          { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
          { "elementType": "labels.text.stroke", "stylers": [{ "color": "#121212" }] },
          { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
          { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
          { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
          { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
          { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
          { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
          { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
          { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
          { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
          { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
          { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
          { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
          { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
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
      return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
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
           <span style="font-size:14px;">📅</span>
           <span style="font-size:12px;color:#ccc;">${formatDate(startDate)}${startTime ? ` &nbsp;${formatTime(startTime)}` : ""}${endTime ? ` – ${formatTime(endTime)}` : ""}</span>
         </div>`
      : "";

    const addressLine = address
      ? `<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;">
           <span style="font-size:14px;">📍</span>
           <span style="font-size:12px;color:#ccc;">${address}</span>
         </div>`
      : "";

    const priceLine = ticketPrice !== undefined && ticketPrice !== null
      ? `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
           <span style="font-size:14px;">🎟️</span>
           <span style="font-size:13px;font-weight:700;color:#23ada4;">₮${ticketPrice}</span>
         </div>`
      : "";

    const infoContent = `
      <div style="font-family:sans-serif;min-width:220px;max-width:260px;background:#1a1a2e;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.6);">
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
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
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

  }, [isLoaded, latitude, longitude, title, address, venueName, imageUrl, ticketPrice, startDate, startTime, endTime, language]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "400px", borderRadius: "15px", background: "#1a1a1a" }}
      className="event-detail-map"
    >
      {!isLoaded && (
        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
          {t("loadingMap")}
        </div>
      )}
    </div>
  );
}
