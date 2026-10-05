"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import InterestSelector from "@/components/InterestSelector";
import { Sparkles, Check } from "lucide-react";
import {
  fetchCurrentLocation,
  formatLocationForApi,
} from "@/utils/locationHelper";

export default function InterestPage() {
  return (
    <ProtectedRoute>
      <InterestPageContent />
    </ProtectedRoute>
  );
}

function InterestPageContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    document.title = "Interest Categories - Bondy";

    const fetchData = async () => {
      try {
        const [catRes, profileRes] = await Promise.all([
          authApi.getCategoryList(),
          authApi.getSelfProfile(),
        ]);

        if (catRes?.status) {
          setCategories(catRes.data.categories || []);
        }

        if (profileRes?.status) {
          const profileData = profileRes?.data?.user;
          setProfile(profileData);

          // If user already has categories saved, skip this page
          if (profileData?.categories && profileData.categories.length > 0) {
            return router.push("/");
          }

          const existingInterests = (profileData?.categories || []).map(
            (cat) => cat?._id || cat,
          );
          setSelectedIds(existingInterests);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsChecking(false);
      }
    };
    fetchData();
  }, [router]);

  // Auto-fetch location if missing
  useEffect(() => {
    if (profile && !profile.location) {
      fetchCurrentLocation()
        .then((locationData) => {
          setProfile((prev) => ({
            ...prev,
            location: locationData,
          }));
        })
        .catch((error) => {
          console.error("Error auto-fetching location:", error);
        });
    }
  }, [profile]);

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const allSelected =
    categories.length > 0 &&
    categories.every((cat) => selectedIds.includes(cat._id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(categories.map((cat) => cat._id));
    }
  };

  const handleContinue = async () => {
    if (selectedIds.length === 0) {
      toast.error(t("pleaseSelectAtLeastOneInterest") || "Please select at least one interest");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        categories: selectedIds,
        location: formatLocationForApi(profile?.location),
      };
      if (profile?.profileImage) payload.profileImage = profile.profileImage;
      if (profile?.bio) payload.bio = profile.bio;
      if (profile?.dob) payload.dob = profile.dob;
      if (profile?.gender) payload.gender = profile.gender;
      if (profile?.countryCode) payload.countryCode = profile.countryCode;
      if (profile?.contactNumber) payload.contactNumber = profile.contactNumber;
      if (profile?.email) payload.email = profile.email;
      if (profile?.firstName) payload.firstName = profile.firstName;
      if (profile?.lastName) payload.lastName = profile.lastName;

      const response = await authApi.updateProfile(payload);

      if (response?.status) {
        toast.success(t("interestsUpdatedSuccessfully") || "Interests updated successfully!");
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to update interests:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <>
        <Header />
        <div className="lg-shell">
          <div className="lg-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
            <span className="lg-spin" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="lg-shell" style={{ padding: "36px 20px" }}>
        <section className="lg-panel" style={{ maxWidth: 540 }}>
          {/* Icon Mark */}
          <span
            className="lg-otp-mark"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "999px",
              background: "rgba(35,173,164,.14)",
              color: "var(--acc-bright)",
              marginBottom: 16,
            }}
          >
            <Sparkles size={26} />
          </span>

          {/* Title & Subtitle */}
          <h1 className="lg-h1">
            {t("interestCategories") && t("interestCategories") !== "interestCategories"
              ? t("interestCategories")
              : "Interest Categories"}
          </h1>
          <p className="lg-sub" style={{ marginBottom: 18 }}>
            {t("interestSubtitle") && t("interestSubtitle") !== "interestSubtitle"
              ? t("interestSubtitle")
              : "Tell us what you're interested in. We'll customize things just for you."}
          </p>

          {/* Quick Action Toolbar: Counter & Select All */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--bd-border-strong, #222)",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 13, color: "var(--bd-gray-500, #9ca3af)", fontWeight: 500 }}>
              <span style={{ color: "var(--acc-bright, #23ada4)", fontWeight: 700 }}>
                {selectedIds.length}
              </span>{" "}
              of {categories.length} selected
            </span>

            {categories.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--acc-bright, #23ada4)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          {/* Interest Chips Area */}
          <div
            className="interest-scroll-area"
            style={{
              maxHeight: 300,
              overflowY: "auto",
              paddingRight: 6,
              margin: "4px 0 20px",
            }}
          >
            <InterestSelector
              categories={categories}
              selectedIds={selectedIds}
              onToggle={handleToggle}
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleContinue}
            className="lg-submit"
            disabled={loading || selectedIds.length === 0}
          >
            {loading && <span className="lg-spin" />}
            {loading ? "Saving..." : "Continue"}
          </button>
        </section>
      </main>
    </>
  );
}
