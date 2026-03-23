import React, { useEffect, useRef, useState } from "react";

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

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "400px", borderRadius: "15px", background: "#f0f0f0" }}
      className="event-detail-map"
    >
      {!isLoaded && (
        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
          Loading Map...
        </div>
      )}
    </div>
  );
}
