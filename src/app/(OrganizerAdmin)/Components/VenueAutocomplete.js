"use client";
import React, { useCallback, useRef, useEffect, useState } from "react";
import { Form } from "react-bootstrap";

// Global flag to track Google Maps script loading state
let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;

// Venue Autocomplete returning data in [longitude, latitude] Point format
const VenueAutocomplete = ({
  defaultValue,
  onPlaceSelected,
  placeholder = "Search Venue Address",
  className = "form-control",
  disabled = false,
  minLength = 3,
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState(defaultValue || "");

  // Load Google Maps API
  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key is not configured");
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      isGoogleMapsLoaded = true;
      return;
    }

    // If already loaded via global flag, just set local state
    if (isGoogleMapsLoaded) {
      setIsLoaded(true);
      return;
    }

    // If script is currently loading, wait for it
    if (isGoogleMapsLoading) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          isGoogleMapsLoaded = true;
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }

    // Check if script tag already exists in the document
    const existingScripts = document.querySelectorAll(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existingScripts.length > 0) {
      // Remove duplicate scripts if any (keep only the first one)
      if (existingScripts.length > 1) {
        console.warn(
          `Found ${existingScripts.length} Google Maps scripts, removing duplicates`
        );
        for (let i = 1; i < existingScripts.length; i++) {
          existingScripts[i].remove();
        }
      }

      // Script exists, wait for it to load
      isGoogleMapsLoading = true;
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          isGoogleMapsLoaded = true;
          isGoogleMapsLoading = false;
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }

    // Load Google Maps API for the first time
    isGoogleMapsLoading = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.id = "google-maps-script"; // Add ID for easy identification

    script.onload = () => {
      setIsLoaded(true);
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
    };

    script.onerror = () => {
      setError("Failed to load Google Maps API");
      isGoogleMapsLoading = false;
    };

    document.head.appendChild(script);

    // Don't remove the script on unmount - Google Maps should persist
    return () => {
      // No cleanup needed - script stays in the DOM
    };
  }, [apiKey]);

  // Initialize autocomplete when Google Maps API is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // If autocomplete is already initialized for this input, don't reinitialize
    if (autocompleteRef.current) return;

    try {
      // Create autocomplete instance with better configuration
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["establishment", "geocode"], // Include both places and addresses
          fields: [
            "formatted_address",
            "name",
            "geometry.location",
            "address_components",
          ],
          // Configure autocomplete behavior
          componentRestrictions: {}, // No country restrictions - global search
          strictBounds: false, // Don't restrict to viewport
        }
      );

      // Store reference
      autocompleteRef.current = autocomplete;

      // Configure autocomplete options for better search
      autocomplete.setOptions({
        types: ["establishment", "geocode"],
        strictBounds: false,
        bounds: null, // Remove any bounds restrictions
      });

      // Add place selection listener
      const listener = autocomplete.addListener(
        "place_changed",
        handlePlaceSelect
      );

      // Cleanup on unmount
      return () => {
        if (listener && window.google?.maps?.event) {
          window.google.maps.event.removeListener(listener);
        }
        // Clear the pac-container elements (Google Places dropdown)
        const pacContainers = document.querySelectorAll(".pac-container");
        pacContainers.forEach((container) => container.remove());

        // Clear autocomplete reference
        autocompleteRef.current = null;
      };
    } catch (err) {
      console.error("Error initializing Google Places Autocomplete:", err);
      setError("Failed to initialize Places autocomplete");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]); // Only reinitialize when API loads, not on every input change

  // Manage autocomplete behavior based on input length (separate from initialization)
  useEffect(() => {
    if (!autocompleteRef.current) return;

    if (inputValue.length < minLength) {
      // Disable autocomplete for short queries
      autocompleteRef.current.setOptions({ types: [] });
    } else {
      // Enable autocomplete when minimum characters reached
      autocompleteRef.current.setOptions({
        types: ["establishment", "geocode"],
        strictBounds: false,
        bounds: null,
      });
    }
  }, [inputValue.length, minLength]);

  const extractLocationData = (place) => {
    const addressComponents = place.address_components || [];
    const location = place.geometry.location;

    // Initialize location data object with more detailed structure
    const locationData = {
      longitude: location.lng(),
      latitude: location.lat(),
      address: place.formatted_address || "",
      city: "",
      country: "",
      sublocality: "",
      administrative_area_level_2: "",
    };

    // Extract detailed address components
    addressComponents.forEach((component) => {
      const types = component.types;
      const longName = component.long_name;

      if (
        types.includes("sublocality") ||
        types.includes("sublocality_level_1")
      ) {
        locationData.sublocality = longName;
      } else if (types.includes("locality")) {
        locationData.city = longName;
      } else if (types.includes("administrative_area_level_2")) {
        locationData.administrative_area_level_2 = longName;
      } else if (types.includes("country")) {
        locationData.country = longName;
      }
    });

    // If no city found, try alternative fields
    if (!locationData.city) {
      if (locationData.sublocality) {
        locationData.city = locationData.sublocality;
      } else if (locationData.administrative_area_level_2) {
        locationData.city = locationData.administrative_area_level_2;
      }
    }

    return locationData;
  };

  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();

    if (!place.geometry || !place.geometry.location) {
      console.warn("No geometry data available for selected place");
      return;
    }

    // Extract location data
    const locData = extractLocationData(place);

    // Format strictly for validation schema payload
    const venueAddress = {
      latitude: locData.latitude,
      longitude: locData.longitude,
      city: locData.city,
      country: locData.country,
      address: locData.address || inputValue,
    };

    // Update input value
    setInputValue(locData.address || inputValue);

    // Call parent callback with full location data
    if (onPlaceSelected) {
      onPlaceSelected(venueAddress);
    }
  }, [onPlaceSelected, inputValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(defaultValue || "");
  }, [defaultValue]);

  if (error) {
    return (
      <div>
        <Form.Control
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
        />
        <small className="text-danger">{error}</small>
      </div>
    );
  }

  return (
    <>
      <Form.Control
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={`${placeholder} (min ${minLength} characters)`}
        className={className}
        disabled={disabled || !isLoaded}
      />
      {!isLoaded && !error && (
        <small className="text-muted">Loading...</small>
      )}
    </>
  );
};

export default VenueAutocomplete;
