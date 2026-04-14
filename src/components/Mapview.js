import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Col, Row } from "react-bootstrap";
import Link from "next/link";
import eventApi from "../api/eventApi";

export default function Mapview({ searchParams }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);

  // 1. Load Google Maps script (similar to VenueAutocomplete)
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

  // 2. Fetch Events
  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      try {
        let currentParams = { limit: 20, page: 1, ...searchParams };

        // Try Near You first
        const nearRes = await eventApi.getEvents({ ...currentParams, filter: "nearyou" });
        if (nearRes.data?.events?.length > 0) {
          setEvents(nearRes.data.events);
        } else {
          // Fallback to Recommended
          const recommendedRes = await eventApi.getEvents({ ...currentParams, filter: "recommended" });
          setEvents(recommendedRes.data?.events || []);
        }
      } catch (error) {
        console.error("Error fetching map events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [searchParams]);

  // 3. Initialize & Update Map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const center = events.length > 0 && events[0].venueAddress?.coordinates
      ? { lat: events[0].venueAddress.coordinates[1], lng: events[0].venueAddress.coordinates[0] }
      : { lat: 37.33, lng: -121.88 };

    // Initialize Map if not already done
    if (!googleMapRef.current) {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
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
      googleMapRef.current.setCenter(center);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add new markers
    const infoWindow = new window.google.maps.InfoWindow();

    events.forEach((event) => {
      const coords = event.venueAddress?.coordinates;
      if (!coords || coords.length < 2) return;

      const marker = new window.google.maps.Marker({
        position: { lat: coords[1], lng: coords[0] },
        map: googleMapRef.current,
        title: event.eventTitle,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        }
      });

      marker.addListener("mouseover", () => {
        const content = `
          <div style="width: 200px; padding: 0; background: #fff; overflow: hidden;">
            <img src="${event.posterImage?.[0] || "/img/no-image.png"}" style="width:100%; height:110px; object-fit:cover; border-radius: 8px 8px 0 0;" />
            <div style="padding: 10px;">
              <h6 style="margin: 0 0 5px; font-weight: 700; color: #333; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${event.eventTitle}</h6>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">
                <img src="/img/loc_icon.svg" style="width: 10px; opacity: 0.7;" />
                <span style="font-size: 11px; color: #666;">${event.venueAddress?.city || "Location"}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 10px;">
                <img src="/img/date_icon.svg" style="width: 10px; opacity: 0.7;" />
                <span style="font-size: 11px; color: #666;">${new Date(event.startDate).toLocaleDateString()}</span>
              </div>
              <a href="/eventDetails?id=${event._id}" style="display:block; text-align:center; background:#18a0a0; color:white; padding:7px; border-radius:6px; text-decoration:none; font-size:12px; font-weight: 600;">
                View Details
              </a>
            </div>
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(googleMapRef.current, marker);
      });

      marker.addListener("click", () => {
        window.location.href = `/eventDetails?id=${event._id}`;
      });

      markersRef.current.push(marker);
    });

  }, [isLoaded, events]);

  return (
    <div className="main-wrapper">
      <div className="container-fluid">
        <Row className="gy-4">
          <Col lg={7} xl={6} xxl={5}>
            <div className="card_map_view">
              {loading ? (
                <div className="text-center py-5"><p>Loading events...</p></div>
              ) : events.length === 0 ? (
                <div className="text-center py-5"><p>No events found.</p></div>
              ) : (
                events.map((event, i) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="event-card shadow"
                  >
                    <div className="img-container">
                      <img
                        src={event.posterImage?.[0] || "/img/no-image.png"}
                        alt={event.eventTitle}
                        onError={(e) => { e.target.src = "/img/no-image.png"; }}
                      />
                    </div>
                    <div className="card-content flex-grow-1">
                      <div>
                        <h6>{event.eventTitle}</h6>
                        <div className="text-muted-custom mb-2">
                          <span><img src="/img/date_icon.svg" alt="date" /> {new Date(event.startDate).toLocaleDateString()}</span>
                          <span><img src="/img/loc_icon.svg" alt="loc" /> {event.venueAddress?.city || "Location"}</span>
                        </div>
                      </div>
                      <div className="price-section">
                        <div><h5 className="m-0 fw-bold">{event.ticketPrice ? `₮${event.ticketPrice}` : "Free"}</h5></div>
                        <Link href={`/eventDetails?id=${event._id}`} className="common_btn text-decoration-none text-white text-center">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Col>

          <Col lg={5} xl={6} xxl={7}>
            <div
              ref={mapRef}
              className="map-box"
              style={{ borderRadius: '15px', height: '600px', background: '#1a1a1a' }}
            >
              {!isLoaded && <div className="d-flex align-items-center justify-content-center h-100"><p>Loading Google Maps...</p></div>}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
