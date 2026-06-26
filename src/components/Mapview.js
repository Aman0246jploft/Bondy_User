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
  const [browserCoords, setBrowserCoords] = useState(null);
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
    // 1st priority: explicit search/filter coords passed by parent
    const latFromSearch = Number(searchParams?.latitude);
    const lngFromSearch = Number(searchParams?.longitude);
    if (!Number.isNaN(latFromSearch) && !Number.isNaN(lngFromSearch)) {
      return { lat: latFromSearch, lng: lngFromSearch };
    }

    // 2nd priority: browser GPS (requested on mount)
    if (browserCoords?.lat !== undefined && browserCoords?.lng !== undefined) {
      return browserCoords;
    }

    // 3rd priority: profile-saved location
    if (profileCoords?.lat !== undefined && profileCoords?.lng !== undefined) {
      return profileCoords;
    }

    return null;
  };

  const buildMapDrivenParams = (baseParams = {}) => {
    const params = {
      limit: 20,
      page: 1,
      excludeMyEvents: true,
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

  // Fetch browser GPS — highest priority for default center.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBrowserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Permission denied or unavailable — fall through to profile coords.
      },
      { timeout: 5000, maximumAge: 60000 }
    );
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

  // 2. Pan map when any location source resolves. List updates via idle only.
  useEffect(() => {
    if (!isLoaded) return;

    const effectiveCenter = getEffectiveCenter();
    if (googleMapRef.current && effectiveCenter) {
      googleMapRef.current.panTo(effectiveCenter);
    }
  }, [browserCoords, profileCoords, isLoaded]);

  // 3. Initialize & Update Map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const effectiveCenter = getEffectiveCenter();
    // If no coords at all, start at a neutral wide view — idle fetch will find data
    const center = effectiveCenter || { lat: 20, lng: 0 };
    const initialZoom = effectiveCenter ? 12 : 3;

    // Initialize Map if not already done
    if (!googleMapRef.current) {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: initialZoom,
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
      // If we have no location at all, do a broad fetch and pan to first event.
      if (!effectiveCenter) {
        fetchMapEvents({ limit: 20, page: 1, excludeMyEvents: true }).then(() => {
          // After fetch, pan to first event if it has coordinates
          // (events state updates async, handled by the idle event + marker effect)
        });
      } else {
        fetchMapEvents();
      }
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
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.25 8.51464C4.25 4.45264 7.77146 1.25 12 1.25C16.2285 1.25 19.75 4.45264 19.75 8.51464C19.75 12.3258 17.3871 16.8 13.5748 18.4292C12.574 18.8569 11.426 18.8569 10.4252 18.4292C6.61289 16.8 4.25 12.3258 4.25 8.51464ZM12 2.75C8.49655 2.75 5.75 5.38076 5.75 8.51464C5.75 11.843 7.85543 15.6998 11.0147 17.0499C11.639 17.3167 12.361 17.3167 12.9853 17.0499C16.1446 15.6998 18.25 11.843 18.25 8.51464C18.25 5.38076 15.5034 2.75 12 2.75ZM12 7.75C11.3096 7.75 10.75 8.30964 10.75 9C10.75 9.69036 11.3096 10.25 12 10.25C12.6904 10.25 13.25 9.69036 13.25 9C13.25 8.30964 12.6904 7.75 12 7.75ZM9.25 9C9.25 7.48122 10.4812 6.25 12 6.25C13.5188 6.25 14.75 7.48122 14.75 9C14.75 10.5188 13.5188 11.75 12 11.75C10.4812 11.75 9.25 10.5188 9.25 9ZM3.59541 14.9966C3.87344 15.3036 3.84992 15.7779 3.54288 16.0559C2.97519 16.57 2.75 17.0621 2.75 17.5C2.75 18.2637 3.47401 19.2048 5.23671 19.998C6.929 20.7596 9.31952 21.25 12 21.25C14.6805 21.25 17.071 20.7596 18.7633 19.998C20.526 19.2048 21.25 18.2637 21.25 17.5C21.25 17.0621 21.0248 16.57 20.4571 16.0559C20.1501 15.7779 20.1266 15.3036 20.4046 14.9966C20.6826 14.6895 21.1569 14.666 21.4639 14.9441C22.227 15.635 22.75 16.5011 22.75 17.5C22.75 19.2216 21.2354 20.5305 19.3788 21.3659C17.4518 22.2331 14.8424 22.75 12 22.75C9.15764 22.75 6.54815 22.2331 4.62116 21.3659C2.76457 20.5305 1.25 19.2216 1.25 17.5C1.25 16.5011 1.77305 15.635 2.53605 14.9441C2.84309 14.666 3.31738 14.6895 3.59541 14.9966Z" fill="#18a0a0"/></svg>`),
          scaledSize: new window.google.maps.Size(36, 36),
          anchor: new window.google.maps.Point(18, 36),
        },
      });

      marker.addListener("mouseover", () => {
        const content = `
          <div style="width: 200px; padding: 0; background: #fff; overflow: hidden;">
            <img src="${event.posterImage?.[0] || "/img/sidebar-logo.svg"}" onerror="this.onerror=null;this.src='/img/sidebar-logo.svg'" style="width:100%; height:110px; object-fit:cover; border-radius: 8px 8px 0 0;" />
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

    // If no user location is known, pan map to where the data is (first event with coords).
    const effectiveCenterForPan = getEffectiveCenter();
    if (!effectiveCenterForPan && googleMapRef.current && events.length > 0) {
      const firstWithCoords = events.find(
        (e) => e.venueAddress?.coordinates?.length >= 2
      );
      if (firstWithCoords) {
        const [lng, lat] = firstWithCoords.venueAddress.coordinates;
        googleMapRef.current.panTo({ lat, lng });
        googleMapRef.current.setZoom(10);
      }
    }

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
                        src={event.posterImage?.[0] || "/img/sidebar-logo.svg"}
                        alt={event.eventTitle}
                        onError={(e) => { e.target.onerror = null; e.target.src = "/img/sidebar-logo.svg"; }}
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
