"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import apiClient from "@/api/apiClient";
import authApi from "@/api/authApi";
import courseApi from "@/api/courseApi";
import eventApi from "@/api/eventApi";
import VenueAutocomplete from "../Components/VenueAutocomplete";
import { getFullImageUrl } from "@/utils/imageHelper";

// ─── Constants & Fallback Data ────────────────────────────────────────────────
const DAYS = [
  { id: "mon", key: "Mon", mn: "Да", en: "Mon" },
  { id: "tue", key: "Tue", mn: "Мя", en: "Tue" },
  { id: "wed", key: "Wed", mn: "Лха", en: "Wed" },
  { id: "thu", key: "Thu", mn: "Пү", en: "Thu" },
  { id: "fri", key: "Fri", mn: "Ба", en: "Fri" },
  { id: "sat", key: "Sat", mn: "Бя", en: "Sat" },
  { id: "sun", key: "Sun", mn: "Ня", en: "Sun" },
];

const DISTRICTS = [
  "Сүхбаатар дүүрэг",
  "Чингэлтэй дүүрэг",
  "Хан-Уул дүүрэг",
  "Баянзүрх дүүрэг",
  "Баянгол дүүрэг",
  "Сонгинохайрхан дүүрэг",
];

const DISTRICT_MATCHERS = [
  { keys: ["сүхбаатар", "sukhbaatar", "sükhbaatar", "sbd", "сбд"], mn: "Сүхбаатар дүүрэг", en: "Sukhbaatar District" },
  { keys: ["баянзүрх", "bayanzurkh", "bayanzürkh", "bzd", "бзд"], mn: "Баянзүрх дүүрэг", en: "Bayanzurkh District" },
  { keys: ["хан-уул", "хануул", "khan-uul", "khan uul", "khanuul", "hud", "худ"], mn: "Хан-Уул дүүрэг", en: "Khan-Uul District" },
  { keys: ["баянгол", "bayangol", "bgd", "бгд"], mn: "Баянгол дүүрэг", en: "Bayangol District" },
  { keys: ["чингэлтэй", "chingeltei", "chd", "чд"], mn: "Чингэлтэй дүүрэг", en: "Chingeltei District" },
  { keys: ["сонгинохайрхан", "songinokhairkhan", "songino khairkhan", "shd", "схд"], mn: "Сонгинохайрхан дүүрэг", en: "Songinokhairkhan District" },
  { keys: ["налайх", "nalaikh", "nld", "нд"], mn: "Налайх дүүрэг", en: "Nalaikh District" },
  { keys: ["багануур", "baganuur", "bnd", "бнд"], mn: "Багануур дүүрэг", en: "Baganuur District" },
  { keys: ["багахангай", "bagakhangai", "bkhd", "бхд"], mn: "Багахангай дүүрэг", en: "Bagakhangai District" },
];

const BONDY_DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#141414" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#858585" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#141414" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#666666" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#222222" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#363636" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b22" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#2b4c59" }] },
];

const STEP_TITLES = [
  { mn: "Үндсэн мэдээлэл", en: "Basic Info" },
  { mn: "Байршил, хуваарь", en: "Location & Schedule" },
  { mn: "Үнэ", en: "Pricing & Capacity" },
  { mn: "Хянах", en: "Review" },
];

export default function LearningEditorPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isMn = language === "mn";

  // ─── Core State ────────────────────────────────────────────────────────────
  const [courseId, setCourseId] = useState(null);
  const [mode, setMode] = useState("new"); // "new" | "draft" | "published"
  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState({});
  const [dirty, setDirty] = useState(false);

  // Form Data - Clean initial state with ZERO prefilled defaults
  const [formData, setFormData] = useState({
    courseTitle: "",
    shortdesc: "",
    longdesc: "",
    whatYouWillLearn: "",
    courseCategory: "",
    posterImage: [],
    mediaLinks: [],
    shortTeaserVideo: [],
    venueName: "",
    venueAddress: {
      address: "",
      city: "",
      country: "",
      district: "",
      latitude: null,
      longitude: null,
      state: "",
      zipcode: "",
    },
    startDate: "",
    endDate: "",
    totalSessions: "",
    batches: [],
    price: "",
    refundPolicy: "",
    enrollmentType: "fixedStart",
    isDraft: false,
  });

  // UI state
  const [categories, setCategories] = useState([]);
  const [refundOptions, setRefundOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingTeaser, setUploadingTeaser] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Modals & Overlays - NO prefilled cohort data
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [editingCohortIndex, setEditingCohortIndex] = useState(null);
  const [cohortForm, setCohortForm] = useState({
    name: "",
    days: [],
    startTime: "",
    endTime: "",
    seats: "",
  });
  const [cohortError, setCohortError] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [doneModal, setDoneModal] = useState(null); // { type: 'published' | 'updated' | 'draft', title, msg }

  // ─── Toast Helper ──────────────────────────────────────────────────────────
  const flashToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2400);
  };

  // ─── Interactive Google Map State & Refs ────────────────────────────────────
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    const checkMaps = () => {
      if (typeof window !== "undefined" && window.google?.maps) {
        setGoogleMapsLoaded(true);
        return true;
      }
      return false;
    };
    if (checkMaps()) return;
    const interval = setInterval(() => {
      if (checkMaps()) clearInterval(interval);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const detectDistrictFromCoords = (lat, lng) => {
    if (lat >= 47.91 && lat <= 47.95 && lng >= 106.90 && lng <= 106.95) return "Сүхбаатар дүүрэг";
    if (lat >= 47.91 && lat <= 47.96 && lng >= 106.86 && lng <= 106.91) return "Чингэлтэй дүүрэг";
    if (lat >= 47.85 && lat <= 47.91 && lng >= 106.85 && lng <= 106.98) return "Хан-Уул дүүрэг";
    if (lat >= 47.88 && lat <= 47.94 && lng >= 106.94 && lng <= 107.05) return "Баянзүрх дүүрэг";
    if (lat >= 47.89 && lat <= 47.93 && lng >= 106.82 && lng <= 106.89) return "Баянгол дүүрэг";
    if (lat >= 47.88 && lat <= 47.96 && lng >= 106.70 && lng <= 106.83) return "Сонгинохайрхан дүүрэг";
    return "Сүхбаатар дүүрэг";
  };

  const reverseGeocodeFallback = useCallback(async (cLat, cLng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${cLat}&lon=${cLng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": isMn ? "mn,en" : "en,mn" } }
      );
      if (!res.ok) throw new Error("OSM reverse geocode error");
      const data = await res.json();
      const addrObj = data?.address || {};
      const street = addrObj.road || addrObj.pedestrian || addrObj.street || "";
      const rawDistrict = addrObj.city_district || addrObj.district || addrObj.suburb || addrObj.county || "";
      const city = addrObj.city || addrObj.town || addrObj.state || "Улаанбаатар";

      let resolvedDistrict = "";
      if (rawDistrict) {
        for (const m of DISTRICT_MATCHERS) {
          if (m.keys.some((k) => rawDistrict.toLowerCase().includes(k))) {
            resolvedDistrict = m.mn;
            break;
          }
        }
      }
      if (!resolvedDistrict && data?.display_name) {
        for (const m of DISTRICT_MATCHERS) {
          if (m.keys.some((k) => data.display_name.toLowerCase().includes(k))) {
            resolvedDistrict = m.mn;
            break;
          }
        }
      }
      if (!resolvedDistrict) {
        resolvedDistrict = detectDistrictFromCoords(cLat, cLng);
      }

      const cleanAddress = data?.display_name
        ? data.display_name.split(",").slice(0, 4).map((s) => s.trim()).join(", ")
        : `${street || resolvedDistrict}, ${city}`;

      return {
        address: cleanAddress,
        district: resolvedDistrict,
        city,
      };
    } catch (e) {
      return {
        address: `${cLat.toFixed(4)}, ${cLng.toFixed(4)}`,
        district: detectDistrictFromCoords(cLat, cLng),
        city: "Улаанбаатар",
      };
    }
  }, [isMn]);

  const updateLocationFromCoords = useCallback(
    (newLat, newLng) => {
      const roundedLat = Number(newLat.toFixed(5));
      const roundedLng = Number(newLng.toFixed(5));

      if (markerRef.current) {
        markerRef.current.setPosition({ lat: roundedLat, lng: roundedLng });
      }

      const applyLocation = (loc) => {
        if (!loc) return;
        setFormData((prev) => ({
          ...prev,
          venueAddress: {
            ...prev.venueAddress,
            latitude: roundedLat,
            longitude: roundedLng,
            address: loc.address || prev.venueAddress.address,
            district: loc.district || prev.venueAddress.district,
            city: loc.city || prev.venueAddress.city,
            state: loc.district || prev.venueAddress.state,
          },
        }));
        setDirty(true);
        flashToast(
          isMn
            ? `Байршил шинэчлэгдлээ (${loc.district || ""})`
            : `Location & district updated from map`
        );
      };

      if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: roundedLat, lng: roundedLng } }, async (results, status) => {
          if (status === "OK" && results?.[0]) {
            const r = results[0];
            const comp = r.address_components || [];
            let district = "";
            for (const c of comp) {
              for (const m of DISTRICT_MATCHERS) {
                if (m.keys.some((k) => c.long_name.toLowerCase().includes(k))) {
                  district = m.mn;
                  break;
                }
              }
              if (district) break;
            }
            applyLocation({
              address: r.formatted_address || `${roundedLat}, ${roundedLng}`,
              district: district || detectDistrictFromCoords(roundedLat, roundedLng),
              city: "Улаанбаатар",
            });
          } else {
            const fallback = await reverseGeocodeFallback(roundedLat, roundedLng);
            applyLocation(fallback);
          }
        });
      } else {
        reverseGeocodeFallback(roundedLat, roundedLng).then(applyLocation);
      }
    },
    [isMn, reverseGeocodeFallback]
  );

  // Initialize interactive Google Map when on Step 2
  useEffect(() => {
    if (step !== 2 || !googleMapsLoaded || !mapContainerRef.current || typeof window === "undefined" || !window.google?.maps) return;

    const initialPos = {
      lat: Number(formData.venueAddress?.latitude || 47.9188),
      lng: Number(formData.venueAddress?.longitude || 106.9176),
    };

    if (!googleMapRef.current) {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialPos,
        zoom: 15,
        styles: BONDY_DARK_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        backgroundColor: "#141414",
      });

      const marker = new window.google.maps.Marker({
        position: initialPos,
        map,
        draggable: true,
        icon: {
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
          fillColor: "#23ada4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: new window.google.maps.Point(12, 22),
        },
      });

      map.addListener("click", (e) => {
        updateLocationFromCoords(e.latLng.lat(), e.latLng.lng());
      });

      marker.addListener("dragend", (e) => {
        updateLocationFromCoords(e.latLng.lat(), e.latLng.lng());
      });

      googleMapRef.current = map;
      markerRef.current = marker;
    } else {
      googleMapRef.current.setCenter(initialPos);
      if (markerRef.current) {
        markerRef.current.setPosition(initialPos);
      }
    }
  }, [step, googleMapsLoaded, updateLocationFromCoords]);

  // Keep map synced with formData coordinates
  useEffect(() => {
    if (googleMapRef.current && markerRef.current && formData.venueAddress?.latitude && formData.venueAddress?.longitude) {
      const pos = {
        lat: Number(formData.venueAddress.latitude),
        lng: Number(formData.venueAddress.longitude),
      };
      markerRef.current.setPosition(pos);
      googleMapRef.current.panTo(pos);
    }
  }, [formData.venueAddress?.latitude, formData.venueAddress?.longitude]);


  // ─── Initial Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("courseId");
    if (id) {
      setCourseId(id);
    }

    const loadConfigAndData = async () => {
      try {
        setLoading(true);

        // 1. Categories
        const catRes = await apiClient.get("/category/list?limit=1000", { skipToast: true });
        if (catRes?.data?.categories) {
          setCategories(catRes.data.categories);
        }

        // 2. Refund policies from backend API ONLY (no static fallback)
        try {
          const refundRes = await eventApi.getRefundPolicies();
          const rawList = refundRes?.data?.data || refundRes?.data;
          if (Array.isArray(rawList)) {
            const list = rawList.map((r) => {
              if (typeof r === "object" && r !== null) {
                const val = r.key || r.value || r.policy || r.title || r.name || "";
                const label = r.label || r.title || r.name || r.policy || val;
                return { val, label };
              }
              return { val: String(r), label: String(r) };
            });
            setRefundOptions(list);
          } else {
            setRefundOptions([]);
          }
        } catch (e) {
          console.warn("Failed to fetch refund policies from API:", e);
          setRefundOptions([]);
        }

        // 3. Existing Course Details (if editing)
        if (id) {
          const courseRes = await courseApi.getCourseDetails(id);
          if (courseRes?.data) {
            const c = courseRes.data;
            setMode(c.isDraft ? "draft" : "published");

            let lat = null;
            let lng = null;
            if (c.venueAddress?.type === "Point" && Array.isArray(c.venueAddress?.coordinates)) {
              lng = c.venueAddress.coordinates[0];
              lat = c.venueAddress.coordinates[1];
            } else if (c.venueAddress?.latitude && c.venueAddress?.longitude) {
              lat = Number(c.venueAddress.latitude);
              lng = Number(c.venueAddress.longitude);
            }

            setFormData({
              courseTitle: c.courseTitle || c.title || "",
              shortdesc: c.shortdesc || c.description || "",
              longdesc: c.longdesc || "",
              whatYouWillLearn: c.whatYouWillLearn || "",
              courseCategory: c.courseCategory?._id || c.courseCategory || "",
              posterImage: Array.isArray(c.posterImage) ? c.posterImage : c.coverImage ? [c.coverImage] : [],
              mediaLinks: Array.isArray(c.mediaLinks) ? c.mediaLinks : [],
              shortTeaserVideo: Array.isArray(c.shortTeaserVideo) ? c.shortTeaserVideo : [],
              venueName: c.venueName || "",
              venueAddress: {
                address: c.venueAddress?.address || "",
                city: c.venueAddress?.city || "",
                country: c.venueAddress?.country || "",
                district: c.venueAddress?.state || c.venueAddress?.district || "",
                latitude: lat,
                longitude: lng,
                state: c.venueAddress?.state || "",
                zipcode: c.venueAddress?.zipcode || "",
              },
              startDate: c.startDate ? String(c.startDate).split("T")[0] : "",
              endDate: c.endDate ? String(c.endDate).split("T")[0] : "",
              totalSessions: c.totalSessions ? String(c.totalSessions) : "",
              batches: Array.isArray(c.batches)
                ? c.batches.map((b) => ({
                  batchName: b.batchName || b.name || "",
                  days: Array.isArray(b.days) ? b.days : [],
                  startTime: b.startTime || "",
                  endTime: b.endTime || "",
                  seats: b.seats != null ? Number(b.seats) : "",
                }))
                : [],
              price: c.price != null ? String(c.price) : "",
              refundPolicy: c.refundPolicy || "",
              enrollmentType: "fixedStart",
              isDraft: Boolean(c.isDraft),
            });
          }
        }
      } catch (err) {
        console.error("Error loading course editor data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadConfigAndData();
  }, []);

  // Re-fetch dynamic refund policies from API when language changes
  useEffect(() => {
    async function refreshPolicies() {
      try {
        const refundRes = await eventApi.getRefundPolicies();
        const rawList = refundRes?.data?.data || refundRes?.data;
        if (Array.isArray(rawList)) {
          const list = rawList.map((r) => {
            if (typeof r === "object" && r !== null) {
              const val = r.key || r.value || r.policy || r.title || r.name || "";
              const label = r.label || r.title || r.name || r.policy || val;
              return { val, label };
            }
            return { val: String(r), label: String(r) };
          });
          setRefundOptions(list);
        }
      } catch (err) {
        console.warn("Failed to refresh refund policies on language change:", err);
      }
    }
    refreshPolicies();
  }, [language]);

  // Update Page Title
  useEffect(() => {
    document.title = isMn
      ? courseId
        ? "Сургалт засах - Bondy"
        : "Сургалт үүсгэх - Bondy"
      : courseId
        ? "Edit Course - Bondy"
        : "Create Course - Bondy";
  }, [isMn, courseId]);

  // ─── Validation Engine ─────────────────────────────────────────────────────
  const errors = useMemo(() => {
    const errs = {};

    // Step 1 Validation
    if (!formData.courseTitle.trim()) {
      errs.courseTitle = isMn ? "Сургалтын нэрээ оруулна уу." : "Course title is required.";
    }
    if (formData.shortdesc.trim().length < 20) {
      errs.shortdesc = isMn ? "Хамгийн багадаа 20 тэмдэгт бичнэ үү." : "Short description must be at least 20 characters.";
    }
    if (formData.longdesc.trim().length < 40) {
      errs.longdesc = isMn ? "Хамгийн багадаа 40 тэмдэгт бичнэ үү." : "Detailed description must be at least 40 characters.";
    }
    if (formData.whatYouWillLearn.trim().length < 20) {
      errs.whatYouWillLearn = isMn ? "Суралцах үр дүнгээ бичнэ үү (дор хаяж 20 тэмдэгт)." : "Learning outcomes required (min 20 chars).";
    }
    if (!formData.courseCategory) {
      errs.courseCategory = isMn ? "Ангиллаа сонгоно уу." : "Please select a category.";
    }
    if (!formData.posterImage || formData.posterImage.length === 0) {
      errs.posterImage = isMn ? "Постер зураг оруулна уу." : "Poster image is required.";
    }

    // Step 2 Validation
    if (!formData.venueName.trim()) {
      errs.venueName = isMn ? "Талбайн нэрээ оруулна уу." : "Venue name is required.";
    }
    if (!formData.venueAddress?.address?.trim()) {
      errs.address = isMn ? "Байршлын хаягаа оруулна уу." : "Address is required.";
    }
    if (!formData.startDate) {
      errs.startDate = isMn ? "Эхлэх огноогоо сонгоно уу." : "Start date is required.";
    }
    if (!formData.endDate) {
      errs.endDate = isMn ? "Дуусах огноогоо сонгоно уу." : "End date is required.";
    } else if (formData.startDate && formData.endDate <= formData.startDate) {
      errs.endDate = isMn ? "Дуусах огноо эхлэх огнооноос хойш байх ёстой." : "End date must be after start date.";
    }
    if (!Number(formData.totalSessions) || Number(formData.totalSessions) < 1) {
      errs.totalSessions = isMn ? "Нийт хичээлийн тоог оруулна уу." : "Total sessions required.";
    }
    if (!formData.batches || formData.batches.length === 0) {
      errs.batches = isMn ? "Дор хаяж нэг анги / хуваарь нэмнэ үү." : "At least one batch schedule is required.";
    }

    // Step 3 Validation
    if (formData.price === "" || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errs.price = isMn ? "Сургалтын үнийг зөв оруулна уу." : "Please enter a valid price.";
    }
    if (!formData.refundPolicy) {
      errs.refundPolicy = isMn ? "Буцаан олголтын нөхцөл сонгоно уу." : "Refund policy is required.";
    }

    return errs;
  }, [formData, isMn]);

  // Check if a specific step has errors
  const isStepInvalid = useCallback(
    (stepNum) => {
      if (stepNum === 1) {
        return Boolean(
          errors.courseTitle ||
          errors.shortdesc ||
          errors.longdesc ||
          errors.whatYouWillLearn ||
          errors.courseCategory ||
          errors.posterImage
        );
      }
      if (stepNum === 2) {
        return Boolean(
          errors.venueName ||
          errors.address ||
          errors.startDate ||
          errors.endDate ||
          errors.totalSessions ||
          errors.batches
        );
      }
      if (stepNum === 3) {
        return Boolean(errors.price || errors.refundPolicy);
      }
      return false;
    },
    [errors]
  );

  // ─── Step Navigation ───────────────────────────────────────────────────────
  const handleGoToStep = (targetStep) => {
    if (targetStep > step) {
      // Mark current step as touched
      setTouched((prev) => ({ ...prev, [step]: true }));
      if (isStepInvalid(step)) {
        flashToast(isMn ? "Шаардлагатай талбаруудыг гүйцэд бөглөнө үү." : "Please fill in all required fields.");
        return;
      }
    }
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    setTouched((prev) => ({ ...prev, [step]: true }));
    if (isStepInvalid(step)) {
      flashToast(isMn ? "Шаардлагатай талбаруудыг гүйцэд бөглөнө үү." : "Please fill in all required fields.");
      return;
    }
    if (step < 4) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleRequestLeave();
    }
  };

  const handleRequestLeave = () => {
    if (dirty) {
      setShowLeaveModal(true);
    } else {
      router.push("/CoursesManagement");
    }
  };

  // ─── Media Uploads (Poster, Gallery, Teaser) ──────────────────────────────
  const uploadPosterFile = async (file) => {
    if (!file) return;
    setUploadingPoster(true);
    try {
      const uploadData = new FormData();
      uploadData.append("files", file);

      const res = await authApi.uploadFile(uploadData);
      const uploadedPath = res?.data?.files?.[0] || res?.data?.data?.files?.[0];

      if (uploadedPath) {
        setFormData((prev) => ({
          ...prev,
          posterImage: [uploadedPath],
        }));
        setDirty(true);
        flashToast(isMn ? "Постер зураг амжилттай байршлаа" : "Poster image uploaded successfully");
      } else {
        // Fallback for preview
        const localPreview = URL.createObjectURL(file);
        setFormData((prev) => ({
          ...prev,
          posterImage: [localPreview],
        }));
        setDirty(true);
        flashToast(isMn ? "Постер зураг сонгогдлоо" : "Poster image selected");
      }
    } catch (err) {
      console.error("Poster upload failed:", err);
      // Fallback for preview during development
      try {
        const localPreview = URL.createObjectURL(file);
        setFormData((prev) => ({
          ...prev,
          posterImage: [localPreview],
        }));
        setDirty(true);
        flashToast(isMn ? "Постер зураг сонгогдлоо" : "Poster image selected");
      } catch (e) {
        flashToast(isMn ? "Зураг хуулахад алдаа гарлаа" : "Failed to upload poster image");
      }
    } finally {
      setUploadingPoster(false);
    }
  };

  const handlePosterUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadPosterFile(file);
  };

  const handlePosterDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadPosterFile(file);
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const uploadData = new FormData();
      files.forEach((f) => uploadData.append("files", f));
      const res = await authApi.uploadFile(uploadData);
      const uploadedPaths = res?.data?.files || res?.data?.data?.files || [];
      if (uploadedPaths.length > 0) {
        setFormData((prev) => ({
          ...prev,
          mediaLinks: [...(prev.mediaLinks || []), ...uploadedPaths],
        }));
        setDirty(true);
        flashToast(isMn ? "Зургийн цомог нэмэгдлээ" : "Gallery images added");
      }
    } catch (err) {
      console.error("Gallery upload error:", err);
      flashToast(isMn ? "Зураг хуулахад алдаа гарлаа" : "Failed to upload images");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleTeaserUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTeaser(true);
    try {
      const uploadData = new FormData();
      uploadData.append("files", file);
      const res = await authApi.uploadFile(uploadData);
      const uploadedPath = res?.data?.files?.[0] || res?.data?.data?.files?.[0];
      if (uploadedPath) {
        setFormData((prev) => ({
          ...prev,
          shortTeaserVideo: [uploadedPath],
        }));
        setDirty(true);
        flashToast(isMn ? "Видео амжилттай хуулагдлаа" : "Teaser video uploaded");
      }
    } catch (err) {
      console.error("Teaser upload error:", err);
      flashToast(isMn ? "Видео хуулахад алдаа гарлаа" : "Failed to upload video");
    } finally {
      setUploadingTeaser(false);
    }
  };

  // ─── Cohort / Batch Management ─────────────────────────────────────────────
  const handleOpenAddCohort = () => {
    setEditingCohortIndex(null);
    setCohortForm({
      name: "",
      days: [],
      startTime: "",
      endTime: "",
      seats: "",
    });
    setCohortError("");
    setShowCohortModal(true);
  };

  const handleOpenEditCohort = (index) => {
    const b = formData.batches[index];
    if (!b) return;
    setEditingCohortIndex(index);
    setCohortForm({
      name: b.batchName || "",
      days: Array.isArray(b.days) ? [...b.days] : [],
      startTime: b.startTime || "",
      endTime: b.endTime || "",
      seats: b.seats != null ? String(b.seats) : "",
    });
    setCohortError("");
    setShowCohortModal(true);
  };

  const handleSaveCohort = () => {
    if (!cohortForm.name.trim()) {
      setCohortError(isMn ? "Ангийн нэрийг оруулна уу." : "Batch name is required.");
      return;
    }
    if (!cohortForm.days || cohortForm.days.length === 0) {
      setCohortError(isMn ? "Дор хаяж нэг өдөр сонгоно уу." : "Select at least one day.");
      return;
    }
    if (!cohortForm.startTime || !cohortForm.endTime) {
      setCohortError(isMn ? "Эхлэх болон дуусах цагийг оруулна уу." : "Select start and end time.");
      return;
    }
    if (cohortForm.endTime <= cohortForm.startTime) {
      setCohortError(isMn ? "Дуусах цаг эхлэх цагаас хойш байх ёстой." : "End time must be after start time.");
      return;
    }
    if (!Number(cohortForm.seats) || Number(cohortForm.seats) < 1) {
      setCohortError(isMn ? "Суудлын тоог оруулна уу." : "Valid seats count required.");
      return;
    }

    const newBatch = {
      batchName: cohortForm.name.trim(),
      days: cohortForm.days,
      startTime: cohortForm.startTime,
      endTime: cohortForm.endTime,
      seats: Number(cohortForm.seats),
    };

    setFormData((prev) => {
      const list = [...prev.batches];
      if (editingCohortIndex !== null && editingCohortIndex >= 0) {
        list[editingCohortIndex] = newBatch;
      } else {
        list.push(newBatch);
      }
      return { ...prev, batches: list };
    });

    setDirty(true);
    setShowCohortModal(false);
    flashToast(
      editingCohortIndex !== null
        ? isMn ? "Анги шинэчлэгдлээ" : "Batch updated"
        : isMn ? "Анги нэмэгдлээ" : "Batch added"
    );
  };

  const handleDeleteCohort = (index) => {
    setFormData((prev) => ({
      ...prev,
      batches: prev.batches.filter((_, i) => i !== index),
    }));
    setDirty(true);
    flashToast(isMn ? "Анги хасагдлаа" : "Batch removed");
  };

  // ─── Calculated Summaries ──────────────────────────────────────────────────
  const totalCapacity = useMemo(() => {
    return (formData.batches || []).reduce((sum, b) => sum + (Number(b.seats) || 0), 0);
  }, [formData.batches]);

  const durationWeeks = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diff = new Date(formData.endDate) - new Date(formData.startDate);
    return Math.max(1, Math.round(diff / 604800000));
  }, [formData.startDate, formData.endDate]);

  const durationText = useMemo(() => {
    if (!durationWeeks) return isMn ? "Огноогоо сонгоно уу" : "Select dates";
    const weeksStr = isMn ? `${durationWeeks} долоо хоног` : `${durationWeeks} weeks`;
    const sessions = Number(formData.totalSessions) || 0;
    const sessionsStr = sessions > 0 ? isMn ? ` (${sessions} удаагийн хичээл)` : ` (${sessions} sessions)` : "";
    return `${weeksStr}${sessionsStr}`;
  }, [durationWeeks, formData.totalSessions, isMn]);

  const perSessionPriceText = useMemo(() => {
    const p = Number(formData.price) || 0;
    const s = Number(formData.totalSessions) || 0;
    if (p > 0 && s > 0) {
      return `₮${Math.round(p / s).toLocaleString("en-US")}`;
    }
    return isMn ? "Тооцоолоогүй" : "Not calculated";
  }, [formData.price, formData.totalSessions, isMn]);

  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => c._id === formData.courseCategory);
  }, [categories, formData.courseCategory]);

  // ─── Save Draft Handler ────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const payload = {
        courseTitle: formData.courseTitle.trim() || (isMn ? "Гарчиггүй сургалт" : "Untitled Course"),
        shortdesc: formData.shortdesc.trim(),
        longdesc: formData.longdesc.trim(),
        whatYouWillLearn: formData.whatYouWillLearn.trim(),
        courseCategory: formData.courseCategory || undefined,
        posterImage: formData.posterImage,
        coverImage: formData.posterImage?.[0] || "",
        venueName: formData.venueName.trim(),
        venueAddress: {
          ...formData.venueAddress,
          state: formData.venueAddress.district || formData.venueAddress.state || "",
        },
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        totalSessions: Number(formData.totalSessions) || 1,
        batches: (formData.batches || []).map((b) => ({
          batchName: b.batchName,
          days: b.days,
          startTime: b.startTime,
          endTime: b.endTime,
          seats: Number(b.seats),
        })),
        price: Number(formData.price) || 0,
        refundPolicy: formData.refundPolicy,
        enrollmentType: "fixedStart",
        isDraft: true,
      };

      let res;
      if (courseId) {
        res = await courseApi.updateCourse(courseId, payload);
      } else {
        res = await courseApi.createCourse(payload);
      }

      setDirty(false);
      setDoneModal({
        type: "draft",
        title: isMn ? "Ноорогт хадгалагдлаа" : "Draft Saved",
        msg: isMn ? "Таны бөглөсөн мэдээлэл ноорог хэлбэрээр хадгалагдлаа." : "Your progress has been saved as a draft.",
      });
    } catch (err) {
      console.error("Failed to save draft:", err);
      flashToast(isMn ? "Ноорог хадгалахад алдаа гарлаа" : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  // ─── Publish / Submit Handler ──────────────────────────────────────────────
  const handlePublish = async () => {
    // Validate all steps
    setTouched({ 1: true, 2: true, 3: true, 4: true });
    if (isStepInvalid(1) || isStepInvalid(2) || isStepInvalid(3)) {
      flashToast(isMn ? "Дутуу талбаруудаа гүйцэд бөглөнө үү!" : "Please complete all required fields before publishing.");
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        courseTitle: formData.courseTitle.trim(),
        shortdesc: formData.shortdesc.trim(),
        longdesc: formData.longdesc.trim(),
        whatYouWillLearn: formData.whatYouWillLearn.trim(),
        courseCategory: formData.courseCategory,
        posterImage: formData.posterImage,
        coverImage: formData.posterImage?.[0] || "",
        mediaLinks: formData.mediaLinks,
        shortTeaserVideo: formData.shortTeaserVideo,
        venueName: formData.venueName.trim(),
        venueAddress: {
          ...formData.venueAddress,
          state: formData.venueAddress.district || formData.venueAddress.state || "",
        },
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalSessions: Number(formData.totalSessions),
        batches: formData.batches.map((b) => ({
          batchName: b.batchName,
          days: b.days,
          startTime: b.startTime,
          endTime: b.endTime,
          seats: Number(b.seats),
        })),
        price: Number(formData.price),
        refundPolicy: formData.refundPolicy,
        enrollmentType: "fixedStart",
        isDraft: false,
      };

      let res;
      if (courseId) {
        res = await courseApi.updateCourse(courseId, payload);
      } else {
        res = await courseApi.createCourse(payload);
      }

      setDirty(false);
      setDoneModal({
        type: mode === "published" ? "updated" : "published",
        title: isMn
          ? mode === "published" ? "Сургалт шинэчлэгдлээ" : "Сургалт нийтлэгдлээ"
          : mode === "published" ? "Course Updated" : "Course Published",
        msg: isMn
          ? "Нийтийн сайт дээр амжилттай байршиж, бүртгэл нээгдлээ."
          : "Your course is now live and accepting enrollments.",
      });
    } catch (err) {
      console.error("Failed to publish course:", err);
      const msg = err.response?.data?.message || (isMn ? "Нийтлэхэд алдаа гарлаа. Дахин шалгана уу." : "Failed to publish course.");
      flashToast(msg);
    } finally {
      setPublishing(false);
    }
  };

  const posterPreviewUrl = formData.posterImage?.[0] ? getFullImageUrl(formData.posterImage[0]) : "";

  return (
    <main
      data-screen-label="Сургалт нэмэх"
      style={{
        flex: 1,
        padding: "clamp(20px, 2.4vw, 30px) clamp(18px, 2.4vw, 32px) clamp(96px, 8vw, 120px)",
      }}
    >
      {/* ─── Mobile Top Header ────────────────────────────────────────────── */}
      <div className="lw-mobbar">
        <button
          type="button"
          className="lw-mobback"
          onClick={handleRequestLeave}
          aria-label={isMn ? "Буцах" : "Back"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="lw-mobbarT">
          <b>{isMn ? (courseId ? "Сургалт засах" : "Сургалт үүсгэх") : (courseId ? "Edit Course" : "Create Course")}</b>
        </span>
        <button
          type="button"
          className="lw-mobdraft"
          disabled={savingDraft}
          onClick={handleSaveDraft}
        >
          {savingDraft ? (isMn ? "Хадгалж байна..." : "Saving...") : (isMn ? "Ноорог" : "Draft")}
        </button>
      </div>

      <div className="lw-page">
        {/* ─── Top Steps Navigation Bar ───────────────────────────────────── */}
        <div className="lw-steps bd-scroll" role="tablist">
          {STEP_TITLES.map((st, i) => {
            const stepNum = i + 1;
            const isSelected = step === stepNum;
            const isInvalid = Boolean(touched[stepNum] && isStepInvalid(stepNum));

            return (
              <button
                key={stepNum}
                type="button"
                className="lw-step"
                role="tab"
                aria-selected={isSelected}
                aria-invalid={isInvalid}
                onClick={() => handleGoToStep(stepNum)}
              >
                <span className="lw-num">{stepNum}</span>
                <span className="lw-lbl">{isMn ? st.mn : st.en}</span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="lw-bar">
          <span className="lw-fill" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        <p className="lw-of-acc">
          {isMn ? `Алхам ${step}/4 · ${STEP_TITLES[step - 1].mn}` : `Step ${step}/4 · ${STEP_TITLES[step - 1].en}`}
        </p>

        {/* Draft Notice Banner */}
        {mode === "draft" && (
          <div
            className="lw-note"
            style={{
              borderColor: "rgba(255, 138, 51, 0.5)",
              background: "rgba(255, 138, 51, 0.09)",
              color: "#FFD9BC",
            }}
          >
            {isMn
              ? "Ноорог хэвээр байна. Дутуу талбаруудыг бөглөж нийтэлнэ үү."
              : "This course is currently a draft. Complete all required fields to publish."}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1: Үндсэн мэдээлэл (Basic Info)
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="lw-grid2">
            {/* Left Card: Title, Short desc, Long desc */}
            <section className="lw-cardIn">
              <label className="lw-f">
                <span className="lw-lb">
                  {isMn ? "Сургалтын нэр" : "Course Title"} <i>*</i>
                </span>
                <input
                  type="text"
                  className="lw-in"
                  maxLength={80}
                  aria-invalid={Boolean(touched[1] && errors.courseTitle)}
                  placeholder={isMn ? "Сургалтын нэрээ оруулна уу" : "e.g. Masterclass Web Development"}
                  value={formData.courseTitle}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, courseTitle: e.target.value }));
                    setDirty(true);
                  }}
                />
                <span className="lw-count">{formData.courseTitle.length} / 80</span>
                {touched[1] && errors.courseTitle && <span className="lw-er">{errors.courseTitle}</span>}
              </label>

              <label className="lw-f">
                <span className="lw-lb">
                  {isMn ? "Товч танилцуулга" : "Short Description"} <i>*</i>
                </span>
                <textarea
                  className="lw-ta"
                  maxLength={150}
                  aria-invalid={Boolean(touched[1] && errors.shortdesc)}
                  placeholder={isMn ? "Сургалтаа товчхон танилцуулна уу (дор хаяж 20 тэмдэгт)" : "Brief summary (at least 20 chars)"}
                  value={formData.shortdesc}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, shortdesc: e.target.value }));
                    setDirty(true);
                  }}
                />
                <span className="lw-count">{formData.shortdesc.length} / 150</span>
                {touched[1] && errors.shortdesc && <span className="lw-er">{errors.shortdesc}</span>}
              </label>

              <label className="lw-f">
                <span className="lw-lb">
                  {isMn ? "Сургалтын дэлгэрэнгүй тайлбар" : "Detailed Description"} <i>*</i>
                </span>
                <textarea
                  className="lw-ta"
                  style={{ minHeight: "220px" }}
                  maxLength={800}
                  aria-invalid={Boolean(touched[1] && errors.longdesc)}
                  placeholder={isMn ? "Хөтөлбөр, агуулга, зохион байгуулалтыг дэлгэрэнгүй бичнэ үү (дор хаяж 40 тэмдэгт)" : "Detailed syllabus and requirements (at least 40 chars)"}
                  value={formData.longdesc}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, longdesc: e.target.value }));
                    setDirty(true);
                  }}
                />
                <span className="lw-count">{formData.longdesc.length} / 800</span>
                {touched[1] && errors.longdesc && <span className="lw-er">{errors.longdesc}</span>}
              </label>
            </section>

            {/* Right Card: Outcomes, Category, Poster */}
            <section className="lw-cardIn">
              <label className="lw-f">
                <span className="lw-lb">
                  {isMn ? "Суралцах үр дүн" : "Learning Outcomes"} <i>*</i>
                </span>
                <textarea
                  className="lw-ta"
                  style={{ minHeight: "150px" }}
                  maxLength={500}
                  aria-invalid={Boolean(touched[1] && errors.whatYouWillLearn)}
                  placeholder={isMn ? "Суралцагчид оролцсоноор юу сурахыг бичнэ үү (мөр бүрт нэг чадвар)" : "Key takeaways or skills acquired (one per line)"}
                  value={formData.whatYouWillLearn}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, whatYouWillLearn: e.target.value }));
                    setDirty(true);
                  }}
                />
                <span className="lw-count">{formData.whatYouWillLearn.length} / 500</span>
                {touched[1] && errors.whatYouWillLearn && <span className="lw-er">{errors.whatYouWillLearn}</span>}
              </label>

              <div className="lw-f">
                <span className="lw-lb">
                  {isMn ? "Сургалтын ангилал" : "Category"} <i>*</i>
                </span>
                <div className="lw-cats">
                  {categories.map((c) => {
                    const isSelected = formData.courseCategory === c._id;
                    return (
                      <button
                        key={c._id}
                        type="button"
                        className="lw-chip"
                        aria-selected={isSelected}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, courseCategory: c._id }));
                          setDirty(true);
                        }}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                {touched[1] && errors.courseCategory && <span className="lw-er">{errors.courseCategory}</span>}
              </div>

              <div className="lw-f">
                <span className="lw-lb">
                  {isMn ? "Постер зураг" : "Poster Image"} <i>*</i>
                </span>
                {posterPreviewUrl ? (
                  <div className="lw-up">
                    <span
                      className="lw-thumb"
                      style={{ backgroundImage: `url("${posterPreviewUrl}")` }}
                    />
                    <span className="lw-upT">
                      <b>{isMn ? "Постер зураг хавсаргагдсан" : "Poster Attached"}</b>
                      <span>{isMn ? "PNG, JPG, WEBP" : "PNG, JPG, WEBP"}</span>
                      {uploadingPoster && (
                        <span className="lw-pbar">
                          <span style={{ width: "80%" }} />
                        </span>
                      )}
                    </span>
                    <label className="lw-gh lw-sm" style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}>
                      {isMn ? "Зураг солих" : "Change Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterUpload}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      />
                    </label>
                  </div>
                ) : (
                  <label
                    className="lw-drop"
                    style={{ position: "relative", cursor: "pointer" }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handlePosterDrop}
                  >
                    <span className="lw-dropI">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </span>
                    <b className="lw-dropT">{isMn ? "Зураг оруулах" : "Upload Poster Image"}</b>
                    <span className="lw-dropS">{isMn ? "PNG, JPG, WEBP · 5 MB хүртэл" : "PNG, JPG, WEBP · up to 5MB"}</span>
                    <span className="lw-gh lw-sm" style={{ pointerEvents: "none", marginTop: "10px" }}>
                      {uploadingPoster ? (isMn ? "Хуулж байна..." : "Uploading...") : isMn ? "Файл сонгох" : "Browse File"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    />
                  </label>
                )}
                {touched[1] && errors.posterImage && <span className="lw-er">{errors.posterImage}</span>}
              </div>

              {/* Gallery & Teaser Video optional uploads */}
              <div className="lw-2">
                <div className="lw-f">
                  <span className="lw-lb">
                    {isMn ? "Зургийн цомог" : "Photo Gallery"} <span className="lw-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                  </span>
                  <div className="lw-drop" style={{ padding: "16px 12px" }}>
                    <span className="lw-dropT">
                      {formData.mediaLinks?.length
                        ? (isMn ? `${formData.mediaLinks.length} зураг нэмэгдсэн` : `${formData.mediaLinks.length} images added`)
                        : (isMn ? "Зураг нэмээгүй" : "No images yet")}
                    </span>
                    <span className="lw-dropS" style={{ fontSize: "11.5px" }}>
                      {isMn ? "Сургалтын орчин, үйл ажиллагаа" : "Activities & venue pictures"}
                    </span>
                    <label className="lw-gh lw-sm" style={{ position: "relative", overflow: "hidden", cursor: "pointer", marginTop: "8px" }}>
                      {uploadingGallery ? (isMn ? "Хуулж байна..." : "Uploading...") : isMn ? "Зураг нэмэх" : "Add Photos"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryUpload}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      />
                    </label>
                  </div>
                </div>

                <div className="lw-f">
                  <span className="lw-lb">
                    {isMn ? "Танилцуулга видео" : "Teaser Video"} <span className="lw-opt-b">({isMn ? "заавал биш" : "optional"})</span>
                  </span>
                  <div className="lw-drop" style={{ padding: "16px 12px" }}>
                    <span className="lw-dropT">
                      {formData.shortTeaserVideo?.length
                        ? (isMn ? "Видео хавсаргасан" : "Video attached")
                        : (isMn ? "Видео нэмээгүй" : "No video yet")}
                    </span>
                    <span className="lw-dropS" style={{ fontSize: "11.5px" }}>
                      {isMn ? "MP4, WEBM · 30 сек хүртэл" : "MP4, WEBM · up to 30s"}
                    </span>
                    <label className="lw-gh lw-sm" style={{ position: "relative", overflow: "hidden", cursor: "pointer", marginTop: "8px" }}>
                      {uploadingTeaser ? (isMn ? "Хуулж байна..." : "Uploading...") : isMn ? "Видео нэмэх" : "Add Video"}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleTeaserUpload}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2: Байршил ба хуваарь (Location & Schedule)
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <div className="lw-grid2">
              {/* Left Card: Venue & Address */}
              <section className="lw-cardIn">
                <h2 className="lw-h2">{isMn ? "Байршлын мэдээлэл" : "Venue Information"}</h2>

                <label className="lw-f">
                  <span className="lw-lb">
                    {isMn ? "Талбайн нэр" : "Venue Name"} <i>*</i>
                  </span>
                  <input
                    type="text"
                    className="lw-in"
                    placeholder={isMn ? "Жишээ нь: UB Sound Lab, Hub Innovation Center" : "e.g. UB Sound Lab, Hub Innovation Center"}
                    aria-invalid={Boolean(touched[2] && errors.venueName)}
                    value={formData.venueName}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, venueName: e.target.value }));
                      setDirty(true);
                    }}
                  />
                  {touched[2] && errors.venueName && <span className="lw-er">{errors.venueName}</span>}
                </label>

                <div className="lw-f">
                  <span className="lw-lb">
                    {isMn ? "Хаяг" : "Address"} <i>*</i>
                  </span>
                  <VenueAutocomplete
                    defaultValue={formData.venueAddress?.address}
                    onPlaceSelected={(venueData) => {
                      const lat = typeof venueData?.latitude === "number" ? venueData.latitude : Number(venueData?.latitude) || null;
                      const lng = typeof venueData?.longitude === "number" ? venueData.longitude : Number(venueData?.longitude) || null;
                      const matchedDistrict = DISTRICTS.find(
                        (d) =>
                          venueData?.address?.includes(d) ||
                          venueData?.state?.includes(d) ||
                          venueData?.sublocality?.includes(d) ||
                          venueData?.city?.includes(d)
                      );

                      setFormData((prev) => ({
                        ...prev,
                        venueAddress: {
                          ...prev.venueAddress,
                          ...venueData,
                          latitude: lat,
                          longitude: lng,
                          district: matchedDistrict || prev.venueAddress.district || "",
                          state: matchedDistrict || prev.venueAddress.state || "",
                        },
                      }));
                      setDirty(true);
                    }}
                    placeholder={isMn ? "Байршлын хаягаа хайж сонгоно уу..." : "Search venue address..."}
                  />
                  {touched[2] && errors.address && <span className="lw-er">{errors.address}</span>}
                </div>

                {/* Map Box */}
                <div className="lw-mapWrap">
                  <div
                    ref={mapContainerRef}
                    className="lw-map"
                    style={{ height: "200px", width: "100%", position: "relative" }}
                  >
                    {!googleMapsLoaded && (
                      <>
                        <span className="lw-pin">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--bd-gray-400)" }}>
                          {formData.venueAddress?.latitude
                            ? `${Number(formData.venueAddress.latitude).toFixed(4)}, ${Number(formData.venueAddress.longitude).toFixed(4)}`
                            : isMn
                              ? "Газрын зураг дээр дарж байршлаа заана уу"
                              : "Click on map to set pin"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="lw-mapBtn">
                    <button
                      type="button"
                      className="lw-gh lw-sm"
                      onClick={() => {
                        if (googleMapRef.current && formData.venueAddress?.latitude && formData.venueAddress?.longitude) {
                          const pos = {
                            lat: Number(formData.venueAddress.latitude),
                            lng: Number(formData.venueAddress.longitude),
                          };
                          googleMapRef.current.panTo(pos);
                          googleMapRef.current.setZoom(16);
                          if (markerRef.current) markerRef.current.setPosition(pos);
                        }
                        flashToast(isMn ? "Байршилд төвлөрлөө" : "Centered location");
                      }}
                    >
                      {isMn ? "Байршил шалгах" : "Check Pin"}
                    </button>
                  </div>
                </div>
              </section>

              {/* Right Card: Duration, Dates & Sessions */}
              <section className="lw-cardIn">
                <h2 className="lw-h2">{isMn ? "Сургалтын хугацаа" : "Course Duration"}</h2>

                <div className="lw-2">
                  <label className="lw-f">
                    <span className="lw-lb">
                      {isMn ? "Эхлэх огноо" : "Start Date"} <i>*</i>
                    </span>
                    <input
                      type="date"
                      className="lw-in"
                      aria-invalid={Boolean(touched[2] && errors.startDate)}
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }));
                        setDirty(true);
                      }}
                    />
                    {touched[2] && errors.startDate && <span className="lw-er">{errors.startDate}</span>}
                  </label>

                  <label className="lw-f">
                    <span className="lw-lb">
                      {isMn ? "Дуусах огноо" : "End Date"} <i>*</i>
                    </span>
                    <input
                      type="date"
                      className="lw-in"
                      min={formData.startDate || undefined}
                      aria-invalid={Boolean(touched[2] && errors.endDate)}
                      value={formData.endDate}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, endDate: e.target.value }));
                        setDirty(true);
                      }}
                    />
                    {touched[2] && errors.endDate && <span className="lw-er">{errors.endDate}</span>}
                  </label>
                </div>

                <label className="lw-f">
                  <span className="lw-lb">
                    {isMn ? "Нийт хичээлийн тоо" : "Total Sessions"} <i>*</i>
                  </span>
                  <input
                    type="number"
                    min={1}
                    className="lw-in"
                    placeholder={isMn ? "Жишээ нь: 16" : "e.g. 16"}
                    aria-invalid={Boolean(touched[2] && errors.totalSessions)}
                    value={formData.totalSessions}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, totalSessions: e.target.value }));
                      setDirty(true);
                    }}
                  />
                  <p className="lw-fh">
                    {isMn
                      ? "Сургалтын турш хуваарийн дагуу явагдах нийт хичээлийн тоо."
                      : "Total number of class sessions for the program."}
                  </p>
                  {touched[2] && errors.totalSessions && <span className="lw-er">{errors.totalSessions}</span>}
                </label>

                {/* Duration calculation strip */}
                <div className="lw-calc">
                  <span className="lw-calcI">i</span>
                  <span className="lw-calcT">
                    <b>{isMn ? "Үргэлжлэх хугацаа" : "Calculated Duration"}</b>
                    <span>{durationText}</span>
                  </span>
                </div>
              </section>
            </div>

            {/* Bottom Section: Batches / Cohorts */}
            <section className="lw-sec">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h3 className="lw-h2">{isMn ? "Хуваарь ба ангиуд" : "Schedules & Batches"}</h3>
                  <span style={{ fontSize: "13px", color: "var(--bd-gray-400)" }}>
                    {isMn ? "Сурагчид өөрт тохирох ангийг сонгон бүртгүүлнэ." : "Students choose their preferred cohort."}
                  </span>
                </div>
                <button
                  type="button"
                  className="lw-gh lw-sm"
                  onClick={handleOpenAddCohort}
                  style={{ borderRadius: "999px" }}
                >
                  + {isMn ? "Анги нэмэх" : "Add Batch"}
                </button>
              </div>

              {formData.batches.length === 0 ? (
                <div className="lw-empty">
                  {isMn ? "Анги хараахан нэмэгдээгүй байна. Дээрх 'Анги нэмэх' товчийг дарж хуваарь үүсгэнэ үү." : "No batches added yet. Click 'Add Batch' to create a schedule."}
                </div>
              ) : (
                <div className="lw-cohList">
                  <div className="lw-cohRow lw-cohHead">
                    <span>{isMn ? "Анги" : "Batch"}</span>
                    <span>{isMn ? "Өдрүүд" : "Days"}</span>
                    <span>{isMn ? "Цаг" : "Time"}</span>
                    <span>{isMn ? "Суудал" : "Seats"}</span>
                    <span />
                  </div>
                  {formData.batches.map((b, i) => {
                    const daysStr = (b.days || [])
                      .map((dKey) => {
                        const found = DAYS.find((item) => item.key === dKey || item.id === dKey.toLowerCase());
                        return found ? (isMn ? found.mn : found.en) : dKey;
                      })
                      .join(", ");

                    return (
                      <div key={i} className="lw-cohRow">
                        <b>{b.batchName || (isMn ? "Анги" : "Batch")}</b>
                        <span>{daysStr || "—"}</span>
                        <span>{b.startTime} – {b.endTime}</span>
                        <span>{b.seats} {isMn ? "суудал" : "seats"}</span>
                        <span className="lw-cohActs">
                          <button
                            type="button"
                            className="lw-gh lw-sm"
                            onClick={() => handleOpenEditCohort(i)}
                          >
                            {isMn ? "Засах" : "Edit"}
                          </button>
                          <button
                            type="button"
                            className="lw-gh lw-sm lw-del"
                            onClick={() => handleDeleteCohort(i)}
                          >
                            {isMn ? "Устгах" : "Delete"}
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {touched[2] && errors.batches && <span className="lw-er">{errors.batches}</span>}
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 3: Үнэ (Pricing & Capacity)
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="lw-grid2">
            {/* Left Card: Price (Fixed Course Only - No Passes) */}
            <section className="lw-cardIn">
              <h2 className="lw-h2">{isMn ? "Сургалтын төлбөр" : "Course Fee"}</h2>

              <label className="lw-f">
                <span className="lw-row1">
                  <span className="lw-lb" style={{ margin: 0 }}>
                    {isMn ? "Нийт үнэ" : "Full Price"} <i>*</i>
                  </span>
                  <span className="lw-inWrap lw-inWrap-sm">
                    <input
                      type="number"
                      min={0}
                      className="lw-in"
                      placeholder={isMn ? "Жишээ нь: 500000" : "e.g. 500000"}
                      aria-invalid={Boolean(touched[3] && errors.price)}
                      value={formData.price}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, price: e.target.value }));
                        setDirty(true);
                      }}
                    />
                    <span className="lw-inSuf">₮</span>
                  </span>
                </span>
                <p className="lw-fh">
                  {isMn
                    ? "Сургалтын үндсэн бүтэн төлбөр. Бүртгүүлэхэд бүтэн дүнгээр төлөгдөнө."
                    : "The full enrollment fee for the course. Paid upon registration."}
                </p>
                {touched[3] && errors.price && <span className="lw-er">{errors.price}</span>}
              </label>
            </section>

            {/* Right Card: Refund Policy (From Backend API Only) & Summaries */}
            <section className="lw-cardIn">
              <h2 className="lw-h2">{isMn ? "Буцаан олголтын нөхцөл" : "Refund Policy"}</h2>

              <label className="lw-f">
                <span className="lw-lb">
                  {isMn ? "Нөхцөл сонгох" : "Select Policy"} <i>*</i>
                </span>
                <select
                  className="lw-in"
                  aria-invalid={Boolean(touched[3] && errors.refundPolicy)}
                  value={formData.refundPolicy}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, refundPolicy: e.target.value }));
                    setDirty(true);
                  }}
                >
                  <option value="">
                    {isMn ? "Сонгоно уу..." : "Select policy..."}
                  </option>
                  {refundOptions.map((opt, i) => (
                    <option key={i} value={opt.val}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {touched[3] && errors.refundPolicy && <span className="lw-er">{errors.refundPolicy}</span>}
              </label>

              {/* Automatic calculations */}
              <div style={{ marginTop: "14px", borderTop: "1px solid var(--bd-border-soft)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--bd-gray-400)" }}>
                    {isMn ? "Нийт суудлын тоо (бүх ангиуд)" : "Total Seats Capacity"}
                  </span>
                  <b style={{ color: "var(--bd-white)", fontSize: "15px" }}>
                    {totalCapacity > 0 ? `${totalCapacity} ${isMn ? "суудал" : "seats"}` : "—"}
                  </b>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--bd-gray-400)" }}>
                    {isMn ? "Нэг удаагийн хичээлийн тооцоологдсон өртөг" : "Estimated Cost Per Session"}
                  </span>
                  <b style={{ color: "var(--acc-bright)", fontSize: "15px" }}>
                    {perSessionPriceText}
                  </b>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 4: Хянах (Review & Confirm)
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ marginTop: "18px" }}>
            <p className="lw-note2">
              <i className="lw-i">i</i>
              {isMn
                ? "Бүх мэдээллээ шалгаад баталгаажуулна уу. Нийтлэгдсэний дараа нийтийн сайт дээр шууд харагдана."
                : "Review all details before publishing. Once published, your course will immediately be visible to students."}
            </p>

            {/* Error Banner if incomplete */}
            {(isStepInvalid(1) || isStepInvalid(2) || isStepInvalid(3)) && (
              <div
                className="lw-note"
                style={{
                  marginTop: 0,
                  marginBottom: "16px",
                  borderColor: "rgba(255, 90, 90, 0.55)",
                  background: "rgba(255, 90, 90, 0.1)",
                  color: "#FFC9C9",
                }}
              >
                {isMn
                  ? "Зарим алхамд дутуу мэдээлэл байна. Нийтлэхээс өмнө шалгаж засна уу."
                  : "Some steps have incomplete fields. Please review and complete them before publishing."}
              </div>
            )}

            <div className="lw-r4">
              {/* Column 1: Basic Info & Pricing */}
              <div className="lw-rcol">
                {/* Basic Info Card */}
                <div className="lw-rcard">
                  <div className="lw-rcH">
                    <b>{isMn ? "Үндсэн мэдээлэл" : "Basic Info"}</b>
                    <button type="button" className="lw-edit" onClick={() => setStep(1)}>
                      {isMn ? "Засах" : "Edit"}
                    </button>
                  </div>
                  <div className="lw-topRow">
                    <span
                      className="lw-poster"
                      style={{ backgroundImage: `url("${posterPreviewUrl}")` }}
                    />
                    <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                      <span className="lw-kv2">
                        <span>{isMn ? "Сургалтын нэр" : "Title"}</span>
                        <span>{formData.courseTitle || "—"}</span>
                      </span>
                      <span className="lw-kv2">
                        <span>{isMn ? "Ангилал" : "Category"}</span>
                        <span>{selectedCategoryObj?.name || "—"}</span>
                      </span>
                      <span className="lw-kv2">
                        <span>{isMn ? "Товч тайлбар" : "Summary"}</span>
                        <span>{formData.shortdesc || "—"}</span>
                      </span>
                      <span className="lw-kv2">
                        <span>{isMn ? "Дэлгэрэнгүй" : "Details"}</span>
                        <span style={{ maxHeight: "60px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {formData.longdesc || "—"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {formData.whatYouWillLearn && (
                    <div className="lw-long">
                      <b>{isMn ? "Суралцах үр дүн" : "Learning Outcomes"}</b>
                      <div className="lw-pl">
                        {formData.whatYouWillLearn
                          .split("\n")
                          .filter((line) => line.trim())
                          .map((line, idx) => (
                            <span key={idx}>
                              <span className="lw-dot" />
                              <span>{line.replace(/^[-•*]\s*/, "")}</span>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="lw-media">
                    <b>{isMn ? "Медиа" : "Media"}</b>
                    <span className="lw-mrow">
                      <span>{isMn ? "Постер зураг" : "Poster image"}</span>
                      <b>{formData.posterImage?.length ? (isMn ? "Оруулсан" : "Uploaded") : (isMn ? "Оруулаагүй" : "Not uploaded")}</b>
                      <span className="lw-chk" style={{ color: formData.posterImage?.length ? "var(--acc-bright)" : "var(--bd-gray-600)" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                          <path d={formData.posterImage?.length ? "m8.5 12 2.4 2.4 4.6-4.8" : "M8.5 12h7"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
                    <span className="lw-mrow">
                      <span>{isMn ? "Зургийн цомог" : "Photo gallery"}</span>
                      <b>{formData.mediaLinks?.length ? (isMn ? `${formData.mediaLinks.length} зураг` : `${formData.mediaLinks.length} photos`) : (isMn ? "Оруулаагүй" : "None")}</b>
                      <span className="lw-chk" style={{ color: formData.mediaLinks?.length ? "var(--acc-bright)" : "var(--bd-gray-600)" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                          <path d={formData.mediaLinks?.length ? "m8.5 12 2.4 2.4 4.6-4.8" : "M8.5 12h7"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
                    <span className="lw-mrow">
                      <span>{isMn ? "Танилцуулга видео" : "Teaser video"}</span>
                      <b>{formData.shortTeaserVideo?.length ? (isMn ? "Оруулсан" : "Uploaded") : (isMn ? "Оруулаагүй" : "None")}</b>
                      <span className="lw-chk" style={{ color: formData.shortTeaserVideo?.length ? "var(--acc-bright)" : "var(--bd-gray-600)" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                          <path d={formData.shortTeaserVideo?.length ? "m8.5 12 2.4 2.4 4.6-4.8" : "M8.5 12h7"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
                  </div>
                </div>

                {/* Pricing & Policy Card */}
                <div className="lw-rcard">
                  <div className="lw-rcH">
                    <b>{isMn ? "Үнэ ба бодлого" : "Pricing & Policy"}</b>
                    <button type="button" className="lw-edit" onClick={() => setStep(3)}>
                      {isMn ? "Засах" : "Edit"}
                    </button>
                  </div>
                  <span className="lw-kv2">
                    <span>{isMn ? "Нийт үнэ" : "Full Price"}</span>
                    <span>{formData.price ? `₮${Number(formData.price).toLocaleString("en-US")}` : "—"}</span>
                  </span>
                  <span className="lw-kv2">
                    <span>{isMn ? "Нийт суудал" : "Total Seats"}</span>
                    <span>{totalCapacity > 0 ? `${totalCapacity} ${isMn ? "суудал" : "seats"}` : "—"}</span>
                  </span>
                  <span className="lw-kv2">
                    <span>{isMn ? "Нэг хичээлийн өртөг" : "Per Session"}</span>
                    <span>{perSessionPriceText}</span>
                  </span>
                  <span className="lw-kv2">
                    <span>{isMn ? "Буцаан олголт" : "Refund Policy"}</span>
                    <span>{formData.refundPolicy || "—"}</span>
                  </span>
                </div>
              </div>

              {/* Column 2: Schedule & Location */}
              <div className="lw-rcol">
                {/* Schedule Card */}
                <div className="lw-rcard">
                  <div className="lw-rcH">
                    <b>{isMn ? "Хуваарь" : "Schedule"}</b>
                    <button type="button" className="lw-edit" onClick={() => setStep(2)}>
                      {isMn ? "Засах" : "Edit"}
                    </button>
                  </div>
                  <span className="lw-kv2">
                    <span>{isMn ? "Эхлэх огноо" : "Start Date"}</span>
                    <span>{formData.startDate || "—"}</span>
                  </span>
                  <span className="lw-kv2">
                    <span>{isMn ? "Дуусах огноо" : "End Date"}</span>
                    <span>{formData.endDate || "—"}</span>
                  </span>
                  <span className="lw-kv2">
                    <span>{isMn ? "Хичээлийн тоо" : "Sessions"}</span>
                    <span>{formData.totalSessions ? `${formData.totalSessions} ${isMn ? "хичээл" : "sessions"}` : "—"}</span>
                  </span>

                  <div style={{ marginTop: "12px" }}>
                    <b style={{ display: "block", fontSize: "13px", color: "var(--bd-gray-400)", marginBottom: "8px" }}>
                      {isMn ? "Бүртгэлтэй ангиуд" : "Batches"}
                    </b>
                    {formData.batches.length === 0 ? (
                      <span style={{ fontSize: "12.5px", color: "var(--bd-gray-500)" }}>{isMn ? "Анги нэмээгүй" : "No batches added"}</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {formData.batches.map((b, i) => (
                          <div key={i} className="lw-cohRvRow">
                            <span className="lw-cohChip">{b.batchName}</span>
                            <span>{b.days?.join(", ")} · {b.startTime} - {b.endTime} · {b.seats} {isMn ? "суудал" : "seats"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Card */}
                <div className="lw-rcard">
                  <div className="lw-rcH">
                    <b>{isMn ? "Байршил" : "Location"}</b>
                    <button type="button" className="lw-edit" onClick={() => setStep(2)}>
                      {isMn ? "Засах" : "Edit"}
                    </button>
                  </div>
                  <div className="lw-topRow">
                    <span className="lw-mapS">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                      <span className="lw-kv2">
                        <span>{isMn ? "Талбайн нэр" : "Venue Name"}</span>
                        <span>{formData.venueName || "—"}</span>
                      </span>
                      <span className="lw-kv2">
                        <span>{isMn ? "Хаяг" : "Address"}</span>
                        <span>{formData.venueAddress?.address || "—"}</span>
                      </span>
                      {formData.venueAddress?.address && (
                        <a
                          className="lw-mlink"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            formData.venueAddress.address
                          )}`}
                        >
                          {isMn ? "Газрын зураг дээр харах ↗" : "View on Google Maps ↗"}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Bottom Actions Bar ─────────────────────────────────────────── */}
        <div className="lw-acts">
          {step > 1 && (
            <button type="button" className="lw-gh" onClick={handleBack}>
              {isMn ? "Буцах" : "Back"}
            </button>
          )}

          <span style={{ flex: "1 1 auto" }} />

          <button
            type="button"
            className="lw-gh"
            disabled={savingDraft}
            onClick={handleSaveDraft}
          >
            {savingDraft && <span className="lw-sp" />}
            {savingDraft ? (isMn ? "Хадгалж байна..." : "Saving...") : isMn ? "Ноорог хадгалах" : "Save Draft"}
          </button>

          {step < 4 ? (
            <button type="button" className="lw-go" onClick={handleNext}>
              {isMn ? "Үргэлжлүүлэх" : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              className="lw-go"
              disabled={publishing}
              onClick={handlePublish}
            >
              {publishing && <span className="lw-sp" />}
              {publishing
                ? isMn ? "Илгээж байна..." : "Publishing..."
                : isMn ? (mode === "published" ? "Шинэчлэх" : "Нийтлэх") : mode === "published" ? "Update Course" : "Publish Course"}
            </button>
          )}
        </div>
      </div>

      {/* ─── Add/Edit Batch Modal ─────────────────────────────────────────── */}
      {showCohortModal && (
        <div className="lw-scrim" onClick={() => setShowCohortModal(false)}>
          <div className="lw-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="lw-mHead">
              <div>
                <b style={{ fontSize: "19px", color: "var(--bd-white)" }}>
                  {editingCohortIndex !== null ? (isMn ? "Анги засах" : "Edit Batch") : (isMn ? "Анги нэмэх" : "Add Batch")}
                </b>
                <p>{isMn ? "Ангийн хуваарь, суудлын тоог оруулна уу." : "Set the schedule and seats for this batch."}</p>
              </div>
              <button
                type="button"
                className="lw-x"
                onClick={() => setShowCohortModal(false)}
              >
                ✕
              </button>
            </div>

            {cohortError && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 90, 90, 0.12)",
                  color: "#FF8A8A",
                  fontSize: "13px",
                }}
              >
                {cohortError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label className="lw-f">
                <span className="lw-lb">{isMn ? "Ангийн нэр" : "Batch Name"} <i>*</i></span>
                <input
                  type="text"
                  className="lw-in"
                  placeholder={isMn ? "Жишээ нь: Өдрийн анги, Оройн анги" : "e.g. Morning Batch, Weekend Batch"}
                  value={cohortForm.name}
                  onChange={(e) => setCohortForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </label>

              <div className="lw-f">
                <span className="lw-lb">{isMn ? "Хичээллэх өдрүүд" : "Days of Week"} <i>*</i></span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {DAYS.map((d) => {
                    const isSelected = cohortForm.days.includes(d.key);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className="lw-chip"
                        aria-selected={isSelected}
                        onClick={() => {
                          setCohortForm((prev) => {
                            const days = isSelected
                              ? prev.days.filter((k) => k !== d.key)
                              : [...prev.days, d.key];
                            return { ...prev, days };
                          });
                        }}
                      >
                        {isMn ? d.mn : d.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lw-2">
                <label className="lw-f">
                  <span className="lw-lb">{isMn ? "Эхлэх цаг" : "Start Time"} <i>*</i></span>
                  <input
                    type="time"
                    className="lw-in"
                    value={cohortForm.startTime}
                    onChange={(e) => setCohortForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  />
                </label>
                <label className="lw-f">
                  <span className="lw-lb">{isMn ? "Дуусах цаг" : "End Time"} <i>*</i></span>
                  <input
                    type="time"
                    className="lw-in"
                    value={cohortForm.endTime}
                    onChange={(e) => setCohortForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  />
                </label>
              </div>

              <div className="lw-f">
                <span className="lw-lb">{isMn ? "Суудлын тоо" : "Seats Capacity"} <i>*</i></span>
                <div className="lw-stepbox">
                  <button
                    type="button"
                    onClick={() =>
                      setCohortForm((prev) => ({
                        ...prev,
                        seats: prev.seats ? Math.max(1, Number(prev.seats) - 1) : "",
                      }))
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    placeholder={isMn ? "Жишээ нь: 15" : "e.g. 15"}
                    value={cohortForm.seats}
                    onChange={(e) =>
                      setCohortForm((prev) => ({ ...prev, seats: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCohortForm((prev) => ({
                        ...prev,
                        seats: (Number(prev.seats) || 0) + 1,
                      }))
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="lw-gh lw-sm"
                onClick={() => setShowCohortModal(false)}
              >
                {isMn ? "Болих" : "Cancel"}
              </button>
              <button
                type="button"
                className="lw-go lw-sm"
                onClick={handleSaveCohort}
              >
                {isMn ? "Хадгалах" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Unsaved Changes Leave Modal ──────────────────────────────────── */}
      {showLeaveModal && (
        <div className="lw-scrim" onClick={() => setShowLeaveModal(false)}>
          <div className="lw-sheet" onClick={(e) => e.stopPropagation()}>
            <b style={{ fontSize: "19px", color: "var(--bd-white)", display: "block", marginBottom: "8px" }}>
              {isMn ? "Хадгалаагүй өөрчлөлт байна" : "Unsaved Changes"}
            </b>
            <p style={{ fontSize: "14px", color: "var(--bd-gray-400)", lineHeight: 1.5, margin: "0 0 20px" }}>
              {isMn
                ? "Та гарвал бөглөсөн мэдээлэл хадгалагдахгүй. Ноорогт хадгалах уу?"
                : "You have unsaved changes. Would you like to save this as a draft before leaving?"}
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="lw-gh lw-sm"
                onClick={() => setShowLeaveModal(false)}
              >
                {isMn ? "Үргэлжлүүлэх" : "Stay"}
              </button>
              <button
                type="button"
                className="lw-gh lw-sm lw-del"
                onClick={() => {
                  setShowLeaveModal(false);
                  router.push("/CoursesManagement");
                }}
              >
                {isMn ? "Хаях" : "Discard"}
              </button>
              <button
                type="button"
                className="lw-go lw-sm"
                onClick={async () => {
                  setShowLeaveModal(false);
                  await handleSaveDraft();
                }}
              >
                {isMn ? "Ноорог хадгалах" : "Save Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Success Modal (Published / Draft saved) ──────────────────────── */}
      {doneModal && (
        <div className="lw-scrim">
          <div className="lw-sheet" style={{ textAlign: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "60px",
                height: "60px",
                borderRadius: "999px",
                background: "rgba(35, 173, 164, 0.14)",
                color: "var(--acc-bright)",
                margin: "0 auto 16px",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <b style={{ fontSize: "20px", color: "var(--bd-white)", display: "block", marginBottom: "8px" }}>
              {doneModal.title}
            </b>
            <p style={{ fontSize: "14px", color: "var(--bd-gray-400)", lineHeight: 1.5, margin: "0 0 24px" }}>
              {doneModal.msg}
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                className="lw-gh lw-sm"
                onClick={() => router.push("/CoursesManagement")}
              >
                {isMn ? "Миний сургалтууд" : "My Courses"}
              </button>
              <button
                type="button"
                className="lw-go lw-sm"
                onClick={() => {
                  if (courseId) {
                    router.push(`/CourseDetailOrganiser?courseId=${courseId}`);
                  } else {
                    router.push("/CoursesManagement");
                  }
                }}
              >
                {isMn ? "Сургалт харах" : "View Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Toast Notification ─────────────────────────────────── */}
      {toastMessage && <div className="lw-toast">{toastMessage}</div>}
    </main>
  );
}
