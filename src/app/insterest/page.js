"use client";
import InterestSelector from "@/components/InterestSelector";
import React, { useState, useEffect } from "react";
import { Col, Container, Row, Button } from "react-bootstrap";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function InterestPage() {
  return (
    <ProtectedRoute>
      <InterestPageContent />
    </ProtectedRoute>
  );
}

function InterestPageContent() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, profileRes] = await Promise.all([
          authApi.getCategoryList(),
          authApi.getSelfProfile(),
        ]);

        if (catRes.status) {
          setCategories(catRes.data.categories);
        }

        if (profileRes.status) {
          const profile = profileRes.data.profile;
          setProfile(profile);
          // Ensure we only store IDs
          const existingInterests = (profile.categories || []).map(cat => cat._id || cat);
          setSelectedIds(existingInterests);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.updateProfile({
        ...profile,
        categories: selectedIds,
        location: profile?.location || null
      });
      if (response.status) {
        toast.success("Interests updated successfully");
        router.push("/"); // Redirect to home or dashboard
      }
    } catch (error) {
      console.error("Failed to update interests:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login_sec compplete_profile_sec">
      <Container fluid>
        <Row className="justify-content-between align-items-center gy-4">
          <Col xl={5} lg={7}>
            <div className="login_img">
              <img src="/img/login_side_img.png" alt="login side" />
              <div className="content_img_box">
                <h4>Explore Events Effortlessly</h4>
                <p>
                  Discover, book, and track events seamlessly with calendar
                  integration and personalized event curation
                </p>
              </div>
            </div>
          </Col>
          <Col xl={6} lg={5}>
            <Row className="justify-content-center align-items-center">
              <Col xl={7} lg={9} md={12}>
                <div className="fz_32">
                  <h2 className="">Interest Categories</h2>
                  <p>
                    Tell us what you’re interested in. We’ll customize things
                    just for you.
                  </p>
                </div>
                <main>
                  <InterestSelector
                    categories={categories}
                    selectedIds={selectedIds}
                    onToggle={handleToggle}
                  />
                  <Button
                    onClick={handleContinue}
                    className="common_btn w-100 mt-4 border-0"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Continue"}
                  </Button>
                </main>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
