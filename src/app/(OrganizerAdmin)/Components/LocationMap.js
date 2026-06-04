"use client";
import React, { useEffect, useRef, useState } from "react";
import { useEventContext } from "@/context/EventContext";

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242424" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242424" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b9" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }]
  }
];

function LocationMap() {
  const { eventData, updateEventData } = useEventContext();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const eventDataRef = useRef(eventData);
  useEffect(() => {
    eventDataRef.current = eventData;
  }, [eventData]);

  // Load Google Maps script if not loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;

    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const reverseGeocode = (lat, lng) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const place = results[0];
        const addressComponents = place.address_components || [];

        const locData = {
          latitude: lat,
          longitude: lng,
          address: place.formatted_address || "",
          city: "",
          country: "",
          state: "",
          zipcode: "",
        };

        addressComponents.forEach((component) => {
          const types = component.types;
          const longName = component.long_name;

          if (types.includes("locality") || types.includes("postal_town")) {
            locData.city = longName;
          } else if (types.includes("administrative_area_level_1")) {
            locData.state = longName;
          } else if (types.includes("postal_code")) {
            locData.zipcode = longName;
          } else if (types.includes("country")) {
            locData.country = longName;
          }
        });

        // Ensure city fallbacks
        if (!locData.city) {
          const sublocality = addressComponents.find(c => c.types.includes("sublocality") || c.types.includes("sublocality_level_1"));
          if (sublocality) {
            locData.city = sublocality.long_name;
          }
        }

        updateEventData({
          venueAddress: locData
        });
      } else {
        console.error("Geocoding failed due to: " + status);
      }
    });
  };

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    // Get current coords or fallback to Ulaanbaatar, Mongolia (default map view or target city)
    const lat = Number(eventData.venueAddress?.latitude) || 47.9188;
    const lng = Number(eventData.venueAddress?.longitude) || 106.9176;

    let googleMap = map;
    let googleMarker = marker;

    if (!googleMap) {
      googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 14,
        styles: darkMapStyle,
        disableDefaultUI: false,
      });

      googleMarker = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMap,
        draggable: true,
        animation: window.google?.maps?.Animation?.DROP || 1,
      });

      // Handle map click to position marker and update address
      googleMap.addListener("click", (e) => {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();
        googleMarker.setPosition({ lat: clickedLat, lng: clickedLng });
        reverseGeocode(clickedLat, clickedLng);
      });

      // Handle marker dragend
      googleMarker.addListener("dragend", (e) => {
        const draggedLat = e.latLng.lat();
        const draggedLng = e.latLng.lng();
        reverseGeocode(draggedLat, draggedLng);
      });

      setMap(googleMap);
      setMarker(googleMarker);
    } else {
      const currentPos = googleMarker.getPosition();
      if (currentPos && (Math.abs(currentPos.lat() - lat) > 0.0001 || Math.abs(currentPos.lng() - lng) > 0.0001)) {
        googleMarker.setPosition({ lat, lng });
        googleMap.setCenter({ lat, lng });
      }
    }
  }, [isLoaded, eventData.venueAddress?.latitude, eventData.venueAddress?.longitude]);

  return (
    <div>
      <div className="location-map" style={{ height: "250px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(35, 173, 164, 0.3)" }}>
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}

export default LocationMap;
