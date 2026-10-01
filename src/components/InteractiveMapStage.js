"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";

// Bondy bespoke dark map theme — obsidian base, slate roads, midnight blue water, muted typography
const BONDY_DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#16171a" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a919e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#16171a" }, { weight: 3 }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#2d323b" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c8ced9" }, { weight: 0.5 }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b94a5" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616875" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#122019" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4f7567" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#22252c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6e7786" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#282d36" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#313845" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1e26" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b4" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1c2027" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0c1722" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#394d61" }],
  },
];

const DEFAULT_CENTER = { lat: 47.9188, lng: 106.9176 }; // Ulaanbaatar Sukhbaatar Square

function isValidMongoliaCoord(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  // Mongolia bounding box: lat ~41° - 52°, lng ~87° - 120°
  return lat >= 40.5 && lat <= 53.0 && lng >= 86.5 && lng <= 121.0;
}

const DEFAULT_MAP_POSTER = "/assets/img/95915dd284f4c106.jpg";
const FALLBACK_IMAGE_PLACEHOLDER = "/img/imageholder.png";

function MapPreviewThumb({ src, alt = "" }) {
  const resolvedSrc =
    src && typeof src === "string" && src.trim() && !src.includes("sidebar-logo.svg")
      ? src
      : DEFAULT_MAP_POSTER;

  const [imgSrc, setImgSrc] = useState(resolvedSrc);

  useEffect(() => {
    const nextSrc =
      src && typeof src === "string" && src.trim() && !src.includes("sidebar-logo.svg")
        ? src
        : DEFAULT_MAP_POSTER;
    setImgSrc(nextSrc);
  }, [src]);

  const handleError = () => {
    if (imgSrc !== DEFAULT_MAP_POSTER) {
      setImgSrc(DEFAULT_MAP_POSTER);
    } else {
      setImgSrc(FALLBACK_IMAGE_PLACEHOLDER);
    }
  };

  return (
    <span
      className="thumb"
      style={{
        backgroundImage: `url(${imgSrc})`,
        backgroundColor: "#1c1d22",
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "12px",
        flexShrink: 0,
        width: "64px",
        height: "64px",
        display: "block",
        position: "relative",
      }}
    >
      <img
        src={imgSrc}
        alt={alt}
        style={{ display: "none" }}
        onError={handleError}
      />
    </span>
  );
}

/**
 * Disperses items that share identical or near-identical coordinates into a small,
 * elegant radial pattern so every pin is distinct, visible, and individually clickable.
 */
function disperseItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const groups = {};
  rawItems.forEach((item, index) => {
    let rawLat =
      typeof item.lat === "number" && !isNaN(item.lat) ? item.lat : DEFAULT_CENTER.lat;
    let rawLng =
      typeof item.lng === "number" && !isNaN(item.lng) ? item.lng : DEFAULT_CENTER.lng;

    // If coordinates are invalid (e.g. 0,0 or outside Mongolia), fallback to Ulaanbaatar center
    if (!isValidMongoliaCoord(rawLat, rawLng)) {
      rawLat = DEFAULT_CENTER.lat;
      rawLng = DEFAULT_CENTER.lng;
    }

    const key = `${rawLat.toFixed(4)}_${rawLng.toFixed(4)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ item, index, baseLat: rawLat, baseLng: rawLng });
  });

  const result = [];
  Object.values(groups).forEach((group) => {
    if (group.length === 1) {
      result.push({
        ...group[0].item,
        mapLat: group[0].baseLat,
        mapLng: group[0].baseLng,
      });
    } else {
      group.forEach((entry, i) => {
        // Disperse in a subtle radial flower around the venue
        const angle = (2 * Math.PI * i) / group.length + 0.2;
        // Radius between ~80m and ~180m
        const radius = 0.001 + (i >= 6 ? 0.0007 : 0);
        const latOffset = Math.sin(angle) * radius;
        const lngOffset = Math.cos(angle) * radius * 1.45; // scale for Ulaanbaatar ~48° latitude

        result.push({
          ...entry.item,
          mapLat: entry.baseLat + latOffset,
          mapLng: entry.baseLng + lngOffset,
        });
      });
    }
  });

  return result;
}

export default function InteractiveMapStage({
  items = [],
  selectedId = null,
  onSelectItem = () => { },
  cityLabel = "Ulaanbaatar City",
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  hasMore = false,
  onLoadMore = null,
  isLoadingMore = false,
  totalCount = 0,
  t = null,
}) {
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const overlayRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [engine, setEngine] = useState("loading"); // "google" | "leaflet" | "loading"
  const [isReady, setIsReady] = useState(false);

  // Compute dispersed items with unique mapLat & mapLng
  const dispersedItems = useMemo(() => disperseItems(items), [items]);

  // Selected item object for preview card
  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return dispersedItems.find((it) => it.id === selectedId) || null;
  }, [selectedId, dispersedItems]);

  // 1. Load Google Maps SDK
  useEffect(() => {
    let isCancelled = false;

    const initGoogleScript = () => {
      if (typeof window !== "undefined" && window.google?.maps?.OverlayView) {
        if (!isCancelled) setEngine("google");
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not found. Using fallback engine.");
        if (!isCancelled) setEngine("leaflet");
        return;
      }

      // Handle auth failure gracefully
      window.gm_authFailure = () => {
        console.warn("Google Maps authentication failure. Falling back to alternative map.");
        if (!isCancelled) setEngine("leaflet");
      };

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        const checkInterval = setInterval(() => {
          if (window.google?.maps?.OverlayView) {
            clearInterval(checkInterval);
            if (!isCancelled) setEngine("google");
          }
        }, 80);

        setTimeout(() => clearInterval(checkInterval), 4000);
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!isCancelled) setEngine("google");
      };
      script.onerror = () => {
        console.warn("Failed to load Google Maps script. Switching to fallback.");
        if (!isCancelled) setEngine("leaflet");
      };
      document.head.appendChild(script);
    };

    initGoogleScript();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Initialize Google Map instance
  useEffect(() => {
    if (engine !== "google" || !mapContainerRef.current) return;
    if (!window.google?.maps) return;

    if (!googleMapRef.current) {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 13,
        minZoom: 5,
        maxZoom: 19,
        styles: BONDY_DARK_MAP_STYLE,
        disableDefaultUI: true,
        keyboardShortcuts: false,
        gestureHandling: "greedy",
        clickableIcons: false,
        backgroundColor: "#16171a",
      });

      // Clicking empty area on map closes the preview card
      map.addListener("click", () => {
        onSelectItem(null);
      });

      googleMapRef.current = map;
      setIsReady(true);
    }
  }, [engine, onSelectItem]);

  // 3. Create & Manage HTML Overlay Markers on Google Map
  useEffect(() => {
    if (engine !== "google" || !googleMapRef.current || !isReady) return;
    if (!window.google?.maps?.OverlayView) return;

    const map = googleMapRef.current;

    // Clean up previous overlay
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    class BondyHtmlOverlay extends window.google.maps.OverlayView {
      constructor(containerDiv) {
        super();
        this.containerDiv = containerDiv;
        this.markerNodes = [];
        this.setMap(map);
      }

      onAdd() {
        const panes = this.getPanes();
        if (panes?.overlayMouseTarget) {
          panes.overlayMouseTarget.appendChild(this.containerDiv);
        }
      }

      draw() {
        const projection = this.getProjection();
        if (!projection) return;

        this.markerNodes.forEach((node) => {
          const point = projection.fromLatLngToDivPixel(
            new window.google.maps.LatLng(node.item.mapLat, node.item.mapLng)
          );
          if (point) {
            node.btn.style.left = `${Math.round(point.x)}px`;
            node.btn.style.top = `${Math.round(point.y)}px`;
          }
        });
      }

      onRemove() {
        if (this.containerDiv?.parentNode) {
          this.containerDiv.parentNode.removeChild(this.containerDiv);
        }
        this.markerNodes = [];
      }
    }

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "0";
    container.style.height = "0";
    container.style.pointerEvents = "none";

    const overlay = new BondyHtmlOverlay(container);

    // Create marker button elements
    dispersedItems.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      const isSel = item.id === selectedId;
      btn.className = `bd-map-pin ${isSel ? "active" : ""}`;
      btn.style.position = "absolute";
      btn.style.pointerEvents = "auto";
      btn.style.zIndex = isSel ? "999" : "5";
      btn.setAttribute("aria-label", item.title || "Map Location");

      // Custom inner pill HTML
      btn.innerHTML = `<span>${item.priceText || ""}</span>`;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelectItem(item.id);

        // Smooth pan to clicked marker
        if (googleMapRef.current) {
          googleMapRef.current.panTo({ lat: item.mapLat, lng: item.mapLng });
        }
      });

      btn.addEventListener("mouseenter", () => {
        onSelectItem(item.id);
      });

      container.appendChild(btn);
      overlay.markerNodes.push({ item, btn });
    });

    overlayRef.current = overlay;

    // Trigger initial draw
    if (map) {
      window.google.maps.event.trigger(map, "resize");
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [engine, isReady, dispersedItems, onSelectItem]);

  // 4. Update active marker highlighting & z-index when selectedId changes
  useEffect(() => {
    if (engine !== "google" || !overlayRef.current) return;

    overlayRef.current.markerNodes?.forEach((node) => {
      const isSel = node.item.id === selectedId;
      if (isSel) {
        node.btn.classList.add("active");
        node.btn.style.zIndex = "999";
      } else {
        node.btn.classList.remove("active");
        node.btn.style.zIndex = "5";
      }
    });

    // Pan to selected marker if selected externally
    if (selectedId && googleMapRef.current) {
      const target = dispersedItems.find((it) => it.id === selectedId);
      if (target) {
        const bounds = googleMapRef.current.getBounds();
        const pt = new window.google.maps.LatLng(target.mapLat, target.mapLng);
        // Only pan if currently outside visible bounds
        if (bounds && !bounds.contains(pt)) {
          googleMapRef.current.panTo(pt);
        }
      }
    }
  }, [selectedId, engine, dispersedItems]);

  // 5. Fit bounds or center when items change
  useEffect(() => {
    if (engine !== "google" || !googleMapRef.current || !isReady) return;
    if (dispersedItems.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    dispersedItems.forEach((item) => {
      if (item.mapLat && item.mapLng) {
        bounds.extend(new window.google.maps.LatLng(item.mapLat, item.mapLng));
        hasCoords = true;
      }
    });

    if (hasCoords) {
      if (dispersedItems.length === 1) {
        googleMapRef.current.panTo({
          lat: dispersedItems[0].mapLat,
          lng: dispersedItems[0].mapLng,
        });
        googleMapRef.current.setZoom(14);
      } else {
        googleMapRef.current.fitBounds(bounds, {
          top: 60,
          bottom: 90,
          left: 60,
          right: 60,
        });

        // Ensure zoom is at a comfortable city/venue level (between 12 and 14)
        window.google.maps.event.addListenerOnce(
          googleMapRef.current,
          "idle",
          () => {
            const currentZoom = googleMapRef.current.getZoom();
            if (currentZoom > 14) {
              googleMapRef.current.setZoom(13);
            } else if (currentZoom < 11) {
              googleMapRef.current.setCenter(DEFAULT_CENTER);
              googleMapRef.current.setZoom(13);
            }
          }
        );
      }
    }
  }, [engine, isReady, dispersedItems.length]);

  // 6. Fallback: Leaflet with CartoDB Dark Matter tiles (if Google key fails or offline)
  useEffect(() => {
    if (engine !== "leaflet" || !mapContainerRef.current) return;

    let isCancelled = false;

    const loadLeaflet = async () => {
      try {
        const L = (await import("leaflet")).default;

        // Ensure Leaflet CSS is present
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        if (isCancelled || !mapContainerRef.current) return;

        if (!leafletMapRef.current) {
          const lmap = L.map(mapContainerRef.current, {
            center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
            zoom: 13,
            zoomControl: false,
            attributionControl: false,
          });

          // Ultra-crisp CartoDB Dark Matter tiles
          L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
              subdomains: "abcd",
              maxZoom: 19,
            }
          ).addTo(lmap);

          lmap.on("click", () => {
            onSelectItem(null);
          });

          leafletMapRef.current = lmap;
        }

        const lmap = leafletMapRef.current;

        // Clear existing markers
        if (lmap._bondyMarkers) {
          lmap._bondyMarkers.forEach((m) => lmap.removeLayer(m));
        }
        lmap._bondyMarkers = [];

        dispersedItems.forEach((item) => {
          const isSel = item.id === selectedId;
          const icon = L.divIcon({
            className: "leaflet-bondy-div-icon",
            html: `<button type="button" class="bd-map-pin ${isSel ? "active" : ""}" style="position:static;"><span>${item.priceText || ""}</span></button>`,
            iconSize: [60, 30],
            iconAnchor: [30, 30],
          });

          const marker = L.marker([item.mapLat, item.mapLng], { icon }).addTo(lmap);
          marker.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectItem(item.id);
            lmap.panTo([item.mapLat, item.mapLng]);
          });
          marker.on("mouseover", () => {
            onSelectItem(item.id);
          });

          lmap._bondyMarkers.push(marker);
        });

        setIsReady(true);
      } catch (err) {
        console.error("Leaflet fallback failed to load:", err);
      }
    };

    loadLeaflet();

    return () => {
      isCancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [engine, dispersedItems, selectedId, onSelectItem]);

  // Handlers for custom controls
  const handleZoomIn = useCallback(() => {
    if (engine === "google" && googleMapRef.current) {
      googleMapRef.current.setZoom(googleMapRef.current.getZoom() + 1);
    } else if (engine === "leaflet" && leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    }
  }, [engine]);

  const handleZoomOut = useCallback(() => {
    if (engine === "google" && googleMapRef.current) {
      googleMapRef.current.setZoom(googleMapRef.current.getZoom() - 1);
    } else if (engine === "leaflet" && leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    }
  }, [engine]);

  const handleRecenter = useCallback(() => {
    if (engine === "google" && googleMapRef.current) {
      googleMapRef.current.panTo(DEFAULT_CENTER);
      googleMapRef.current.setZoom(13);
    } else if (engine === "leaflet" && leafletMapRef.current) {
      leafletMapRef.current.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 13);
    }
  }, [engine]);

  return (
    <div className="bd-mapstage">
      <div className="bd-map-surface" style={{ touchAction: "auto" }}>
        {/* Map Canvas */}
        <div
          ref={mapContainerRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#16171a",
          }}
        />

        {/* Loading shimmer overlay */}
        {!isReady && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              background: "#141518",
              zIndex: 10,
              color: "var(--bd-gray-400)",
              fontSize: "13px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid rgba(255,255,255,0.1)",
                borderTopColor: "var(--acc, #23ada4)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span>Loading Map...</span>
            <style jsx>{`
              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        )}

        {/* City Location Stamp (Clickable to recenter) */}
        <button
          type="button"
          className="bd-map-stamp"
          onClick={handleRecenter}
          title="Recenter to Ulaanbaatar"
          style={{
            cursor: "pointer",
            border: "1px solid var(--bd-border)",
            background: "rgba(16, 17, 20, 0.9)",
            backdropFilter: "blur(12px)",
            zIndex: 220,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{cityLabel}</span>
        </button>

        {/* Floating Load More Button in Map */}
        {hasMore && onLoadMore && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadMore();
            }}
            disabled={isLoadingMore}
            title={t?.("showMore") || "Load more items"}
            style={{
              position: "absolute",
              top: "14px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 220,
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              height: "32px",
              padding: "0 14px",
              borderRadius: "999px",
              border: "1px solid var(--bd-border-strong)",
              background: "rgba(18, 19, 23, 0.92)",
              backdropFilter: "blur(12px)",
              color: "var(--bd-white)",
              fontFamily: "var(--bd-font-ui)",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: isLoadingMore ? "not-allowed" : "pointer",
              boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
              transition: "all 160ms var(--bd-ease)",
            }}
          >
            {isLoadingMore ? (
              <>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderTopColor: "var(--acc, #23ada4)",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                    display: "inline-block",
                  }}
                />
                <span>...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>
                  {t?.("showMore") || "Show more"} ({items.length}{totalCount > 0 ? `/${totalCount}` : ""})
                </span>
              </>
            )}
          </button>
        )}

        {/* Custom Minimalist Zoom Controls */}
        <div className="bd-map-zoom" style={{ zIndex: 220, right: "16px", bottom: "16px" }}>
          <button
            type="button"
            onClick={handleZoomIn}
            title={zoomInLabel}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title={zoomOutLabel}
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        {/* Selected Event / Course Floating Preview Card */}
        {selectedItem && (
          <Link
            href={selectedItem.href || "#"}
            className="bd-map-preview"
            style={{ zIndex: 250, left: "16px", bottom: "16px" }}
          >
            <MapPreviewThumb
              src={selectedItem.image}
              alt={selectedItem.title || "Preview"}
            />
            <span className="body">
              <b>{selectedItem.title}</b>
              <span>{selectedItem.dateText || selectedItem.schedLine}</span>
              <span>{selectedItem.venue}</span>
              <i>{selectedItem.priceText}</i>
            </span>
            <button
              type="button"
              className="close-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectItem(null);
              }}
              aria-label="Close"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
