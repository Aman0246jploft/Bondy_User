import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Col, Row } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import eventApi from "../api/eventApi";
import authApi from "../api/authApi";

export default function Mapview({ searchParams }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [profileCoords, setProfileCoords] = useState(null);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const idleListenerRef = useRef(null);
  const debounceRef = useRef(null);
  const latestFetchIdRef = useRef(0);
  const router = useRouter();

  const getDistanceInKm = (lat1, lng1, lat2, lng2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const getEffectiveCenter = () => {
    const latFromSearch = Number(searchParams?.latitude);
    const lngFromSearch = Number(searchParams?.longitude);
    if (!Number.isNaN(latFromSearch) && !Number.isNaN(lngFromSearch)) {
      return { lat: latFromSearch, lng: lngFromSearch };
    }

    if (profileCoords?.lat !== undefined && profileCoords?.lng !== undefined) {
      return profileCoords;
    }

    return null;
  };

  const buildMapDrivenParams = (baseParams = {}) => {
    const params = {
      limit: 20,
      page: 1,
      ...baseParams,
    };

    // Map view should not force recommended.
    if (String(params.filter || "").toLowerCase() === "recommended") {
      delete params.filter;
    }

    const map = googleMapRef.current;
    if (map) {
      const center = map.getCenter();
      const bounds = map.getBounds();

      if (center) {
        params.latitude = center.lat();
        params.longitude = center.lng();
      }

      if (center && bounds) {
        const northEast = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        params.north = northEast.lat();
        params.east = northEast.lng();
        params.south = sw.lat();
        params.west = sw.lng();
        params.northEastLat = northEast.lat();
        params.northEastLng = northEast.lng();
        params.southWestLat = sw.lat();
        params.southWestLng = sw.lng();

        const radiusFromCenterToEdge = getDistanceInKm(
          center.lat(),
          center.lng(),
          northEast.lat(),
          northEast.lng(),
        );
        // Keep radius practical and avoid zero.
        params.radius = Math.max(1, Math.min(500, Math.ceil(radiusFromCenterToEdge)));
      }
    } else {
      const effectiveCenter = getEffectiveCenter();
      if (effectiveCenter) {
        params.latitude = effectiveCenter.lat;
        params.longitude = effectiveCenter.lng;
      }
    }

    return params;
  };

  const fetchMapEvents = async (overrideParams = {}) => {
    const fetchId = ++latestFetchIdRef.current;
    setLoading(true);
    try {
      const params = buildMapDrivenParams({ ...searchParams, ...overrideParams });
      const response = await eventApi.getEvents(params);
      const fetchedEvents = response?.data?.events || response?.data?.data?.events || [];

      if (fetchId === latestFetchIdRef.current) {
        setEvents(Array.isArray(fetchedEvents) ? fetchedEvents : []);
      }
    } catch (error) {
      if (fetchId === latestFetchIdRef.current) {
        setEvents([]);
      }
      console.error("Error fetching map events:", error);
    } finally {
      if (fetchId === latestFetchIdRef.current) {
        setLoading(false);
      }
    }
  };

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

  // Fetch profile location for default map center.
  useEffect(() => {
    const loadProfileLocation = async () => {
      try {
        const response = await authApi.getSelfProfile();
        const user = response?.data?.user || response?.user;
        const coordinates = user?.location?.coordinates;
        if (Array.isArray(coordinates) && coordinates.length >= 2) {
          setProfileCoords({
            lng: Number(coordinates[0]),
            lat: Number(coordinates[1]),
            city: user?.location?.city || "",
            country: user?.location?.country || "",
          });
        }
      } catch (error) {
        // Keep graceful fallback when user is not logged in.
        setProfileCoords(null);
      }
    };

    loadProfileLocation();
  }, []);

  // 2. Pan map when profile/initial location is resolved. List updates via idle only.
  useEffect(() => {
    if (!isLoaded) return;

    const effectiveCenter = getEffectiveCenter();
    if (googleMapRef.current && effectiveCenter) {
      googleMapRef.current.panTo(effectiveCenter);
    }
  }, [profileCoords, isLoaded]);

  // 3. Initialize & Update Map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const effectiveCenter = getEffectiveCenter();
    const center = effectiveCenter || { lat: 37.33, lng: -121.88 };

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

      // Fetch fresh events whenever map stops moving (zoom/pan complete).
      idleListenerRef.current = googleMapRef.current.addListener("idle", () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          fetchMapEvents();
        }, 120);
      });

      // Initial fetch once map is ready.
      fetchMapEvents();
    }

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add new markers
    if (!infoWindowRef.current) {
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }

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
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(googleMapRef.current, marker);
      });

      marker.addListener("click", () => {
        window.location.href = `/eventDetails?id=${event._id}`;
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [isLoaded, events, searchParams]);

  useEffect(() => {
    return () => {
      if (idleListenerRef.current) {
        window.google?.maps?.event?.removeListener(idleListenerRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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
                    onClick={() => router.push(`/eventDetails?id=${event._id}`)}
                    style={{ cursor: "pointer" }}
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
