"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { Col, Row } from "react-bootstrap";

// Dynamic imports
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});

const eventData = [
  {
    id: 1,
    title: "Kanazawa Grand Inn Hotel",
    date: "May 6, 2025",
    loc: "San Jose South",
    price: "$48",
    pos: [37.33, -121.88],
    img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400",
  },
  {
    id: 2,
    title: "Mardi Gras (New Orleans)",
    date: "4 March 2025",
    loc: "San Jose South",
    price: "$18",
    pos: [37.35, -121.9],
    img: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400",
  },
  {
    id: 3,
    title: "Masters Golf Tournament",
    date: "7-13 April 2025",
    loc: "San Jose South",
    price: "$12",
    pos: [37.31, -121.85],
    img: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400",
  },
];
export default function Map() {
  const [customIcon, setCustomIcon] = useState(null);

  useEffect(() => {
    // Leaflet Icon Setup (Client side only)
    const L = require("leaflet");
    const icon = new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    setCustomIcon(icon);
  }, []);

  return (
    <div className="">
      <div className="map-box">
        {typeof window !== "undefined" && customIcon && (
          <MapContainer
            center={[37.33, -121.88]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* North Carolina Glass Center (Highlighted Popup) */}
            <Marker position={[37.33, -121.88]} icon={customIcon}>
              <Popup className="custom-popup">
                <img src="/img/Card.png" className="popup-inner-img" />
                <div className="popup-text">
                  <h6 className="m-0 fw-bold">North Carolina Glass Center</h6>
                  <ul className="map_list">
                    <li>
                      <img src="/img/location_map.svg" />
                      Nirwana Plot
                    </li>
                    <li>
                      <img src="/img/datemap.svg" />
                      20.12.2022
                    </li>
                  </ul>
                </div>
              </Popup>
            </Marker>

            {/* Other pins */}
            <Marker position={[37.35, -121.9]} icon={customIcon} />
            <Marker position={[37.31, -121.85]} icon={customIcon} />
          </MapContainer>
        )}
      </div>
    </div>
  );
}
