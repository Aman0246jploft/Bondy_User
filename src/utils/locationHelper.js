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
