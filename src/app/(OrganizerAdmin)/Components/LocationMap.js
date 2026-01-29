"use client";
import React from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic imports
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

function LocationMap() {
  return (
    <div>
      <div className="location-map">
        <div className="map-box">
          {typeof window !== "undefined" && (
            <MapContainer
              center={[37.33, -121.88]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationMap;
