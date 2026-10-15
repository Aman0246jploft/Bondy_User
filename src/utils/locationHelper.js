import React from "react";

/**
 * Global function to fetch and format location data.
 * Currently uses browser Geolocation API.
 * Designed to be extended with Google Maps API/Geocoding in the future.
 * 
 * @returns {Promise<{latitude: number, longitude: number, city: string, country: string, address: string, state: string, zipcode: string}>}
 */
export const fetchCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) {
            return reject(new Error("Geolocation is not supported by your browser"));
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Standard payload structure expected by backend validation
                const locationData = {
                    latitude,
                    longitude,
                    // Placeholders for future reverse geocoding (Google Maps API)
                    city: "JAIPUR",
                    country: "INDIA",
                    address: "123 Main St",
                    state: "RAJASTHAN",
                    zipcode: "302001",
                };

                // TODO: In future, call Google Maps Geocoding API here to populate city, country, etc.
                // const addressDetails = await getGoogleAddressDetails(latitude, longitude);
                // Object.assign(locationData, addressDetails);

                resolve(locationData);
            },
            (error) => {
                reject(error);
            }
        );
    });
};

/**
 * Formats location object for API payload.
 * Converts GeoJSON format (from DB) to flat structure (lat/long) for validation.
 * 
 * @param {Object} locationObj - Location object from state/DB
 * @returns {Object|null} - Formatted location object or null
 */
export const formatLocationForApi = (locationObj) => {
    if (!locationObj) return null;

    // If already has lat/long (is in correct format), return as is
    if (locationObj.latitude !== undefined && locationObj.longitude !== undefined) {
        return {
            latitude: locationObj.latitude,
            longitude: locationObj.longitude,
            city: locationObj.city || "",
            country: locationObj.country || "",
            address: locationObj.address || "",
            state: locationObj.state || "",
            zipcode: locationObj.zipcode || "",
        };
    }

    // If GeoJSON with coordinates [lng, lat]
    if (locationObj.coordinates && Array.isArray(locationObj.coordinates)) {
        return {
            latitude: locationObj.coordinates[1],
            longitude: locationObj.coordinates[0],
            city: locationObj.city || undefined,
            country: locationObj.country || undefined,
            address: locationObj.address || undefined,
            state: locationObj.state || undefined,
            zipcode: locationObj.zipcode || undefined,
        };
    }

    return null; // Invalid format
};

/**
 * Fetches latitude and longitude for a given address string using Google Geocoding API.
 * 
 * @param {string} address - The full address string (e.g., "City, State, Country")
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCoordinatesFromAddress = async (address) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        throw new Error("Google Maps API key is not configured");
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return { latitude: lat, longitude: lng };
        } else {
            throw new Error(data.error_message || `Geocoding failed: ${data.status}`);
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        throw error;
    }
};

/**
 * Calculates distance in km between two lat/lon pairs using the Haversine formula.
 * Returns null if any coordinate is missing or invalid.
 */
export function calcDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const nLat1 = Number(lat1);
    const nLon1 = Number(lon1);
    const nLat2 = Number(lat2);
    const nLon2 = Number(lon2);
    if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

    const R = 6371; // Earth's radius in km
    const dLat = (nLat2 - nLat1) * (Math.PI / 180);
    const dLon = (nLon2 - nLon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(nLat1 * (Math.PI / 180)) * Math.cos(nLat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist < 10 ? Math.round(dist * 10) / 10 : Math.round(dist);
}

/**
 * Extracts { latitude, longitude } from an event or course object.
 * Supports both flat latitude/longitude and GeoJSON coordinates: [lng, lat].
 */
export function extractCoordinates(item) {
    if (!item) return null;
    const va = item.venueAddress || item.location;
    if (va) {
        if (va.latitude != null && va.longitude != null) {
            const lat = Number(va.latitude);
            const lng = Number(va.longitude);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                return { latitude: lat, longitude: lng };
            }
        }
        if (Array.isArray(va.coordinates) && va.coordinates.length >= 2) {
            const lng = Number(va.coordinates[0]);
            const lat = Number(va.coordinates[1]);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                return { latitude: lat, longitude: lng };
            }
        }
    }
    if (Array.isArray(item.coordinates) && item.coordinates.length >= 2) {
        const lng = Number(item.coordinates[0]);
        const lat = Number(item.coordinates[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return { latitude: lat, longitude: lng };
        }
    }
    if (item.latitude != null && item.longitude != null) {
        const lat = Number(item.latitude);
        const lng = Number(item.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return { latitude: lat, longitude: lng };
        }
    }
    return null;
}

/**
 * Retrieves cached user coordinates from browser storage.
 */
export function getCachedUserLocation() {
    if (typeof window === "undefined") return null;
    try {
        const cached = sessionStorage.getItem("user_coords") || localStorage.getItem("user_coords");
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
                return parsed;
            }
        }
    } catch (e) {}
    return null;
}

/**
 * Saves user coordinates to browser storage and broadcasts to other components.
 */
export function saveUserLocation(coords) {
    if (typeof window === "undefined" || !coords) return;
    try {
        const data = {
            latitude: Number(coords.latitude),
            longitude: Number(coords.longitude),
            timestamp: Date.now(),
        };
        sessionStorage.setItem("user_coords", JSON.stringify(data));
        localStorage.setItem("user_coords", JSON.stringify(data));
        window.dispatchEvent(new CustomEvent("bondy_user_location", { detail: data }));
    } catch (e) {}
}

/**
 * React hook to get and observe user location across guest, customer, and organizer pages.
 */
export function useUserLocation() {
    const [coords, setCoords] = React.useState(() => getCachedUserLocation());

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        // 1. Initial check from cache
        const cached = getCachedUserLocation();
        if (cached && (!coords || coords.latitude !== cached.latitude || coords.longitude !== cached.longitude)) {
            setCoords(cached);
        }

        // 2. If no coords yet, ask browser geolocation (works for both guests and logged in users)
        if (!cached && "geolocation" in navigator && !sessionStorage.getItem("user_coords_denied")) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newCoords = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    };
                    saveUserLocation(newCoords);
                    setCoords(newCoords);
                },
                () => {
                    try {
                        sessionStorage.setItem("user_coords_denied", "true");
                    } catch (e) {}
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
            );
        }

        // 3. Listen for global location updates
        const handleUpdate = (e) => {
            if (e.detail?.latitude && e.detail?.longitude) {
                setCoords(e.detail);
            }
        };

        window.addEventListener("bondy_user_location", handleUpdate);
        return () => window.removeEventListener("bondy_user_location", handleUpdate);
    }, []);

    return coords;
}
