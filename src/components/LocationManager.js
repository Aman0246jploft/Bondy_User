"use client";
import { useEffect } from "react";
import authApi from "@/api/authApi";

export default function LocationManager() {
    useEffect(() => {
        const handleLocationUpdate = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            // Avoid updating every time the component renders or on every page load
            const sessionUpdated = sessionStorage.getItem("location_synced");
            if (sessionUpdated) return;

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;

                        try {
                            // Try to get city/country information using a free reverse geocoding service
                            // Using Nominatim (OpenStreetMap)
                            const geoRes = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                                {
                                    headers: {
                                        "Accept-Language": "en",
                                        "User-Agent": "Bondy-App"
                                    },
                                }
                            );

                            let city = "San Francisco";
                            let country = "USA";
                            let address = "";
                            let state = "";

                            if (geoRes.ok) {
                                const geoData = await geoRes.json();
                                city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || city;
                                country = geoData.address.country || country;
                                address = geoData.display_name || "";
                                state = geoData.address.state || "";
                            }

                            const locationPayload = {
                                location: {
                                    latitude,
                                    longitude,
                                    city,
                                    country,
                                    address,
                                    state
                                }
                            };

                            const response = await authApi.updateProfile(locationPayload);
                            if (response.status) {
                                sessionStorage.setItem("location_synced", "true");
                                console.log("Global location updated:", locationPayload.location);
                            }
                        } catch (error) {
                            console.error("Global location update error:", error);
                            // Fallback to coordinates only if geocoding fails
                            const fallbackPayload = {
                                location: {
                                    latitude,
                                    longitude,
                                    city: "San Francisco",
                                    country: "USA",
                                    address: ""
                                }
                            };
                            await authApi.updateProfile(fallbackPayload);
                            sessionStorage.setItem("location_synced", "true");
                        }
                    },
                    (error) => {
                        console.warn("Geolocation permission denied or error:", error);
                    }
                );
            }
        };

        handleLocationUpdate();
    }, []);

    return null;
}
