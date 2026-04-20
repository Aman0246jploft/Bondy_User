import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Map({ latitude, longitude, title }) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    if (document.getElementById(scriptId)) return;

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

    // Add Marker
    new window.google.maps.Marker({
      position,
      map: googleMapRef.current,
      title: title || "Venue",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
      }
    });

  }, [isLoaded, latitude, longitude, title]);

  const { t } = useLanguage();

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
