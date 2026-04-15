"use client";
import React, { useState, useEffect } from "react";
import { Apple, Play } from "lucide-react";
import globalSettingApi from "@/api/globalSettingApi";
import { useLanguage } from "@/context/LanguageContext";

export default function CTASection() {
  const { t } = useLanguage();
  const [socialLinks, setSocialLinks] = useState({
    apple_store: "#",
    google_play: "#",
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const response = await globalSettingApi.getSocialLinks();
        if (response?.data?.value) {
          setSocialLinks({
            apple_store: response.data.value.apple_store || "#",
            google_play: response.data.value.google_play || "#",
          });
        }
      } catch (error) {
        console.error("Error fetching social links:", error);
      }
    };
    fetchSocialLinks();
  }, []);

  return (
    <section className="cta-wrapper cTa_section">
      <div className="container">
        <div className="cta-card">
          <img src="/img/left_cta_img01.png" className="float-card pos-1" />
          <img src="/img/left_cta_img02.png" className="float-card pos-2" />
          <img src="/img/left_cta_img03.png" className="float-card pos-3" />
          <img src="/img/right_cta_img01.png" className="float-card pos-4" />
          <img src="/img/right_cta_img02.png" className="float-card pos-5" />
          <img src="/img/right_cta_img03.png" className="float-card pos-6" />

          <img src="/img/lineshap-ctn-2.svg" className="float-shapeTop pos-6" />
          <img src="/img/lineshap-ctn.svg" className="float-shapeBtoom pos-6" />

          <div className="cta-content">
            <h2>{t("readyToGetStarted")}</h2>
            <p>
              {t("ctaDescription")}
            </p>

            <div className="cta-buttons">
              <a href={socialLinks.apple_store} target="_blank" rel="noopener noreferrer" className="cta-btn outline">
                <img src="/img/apple_icon.svg" /> {t("appStore")}
              </a>
              <a href={socialLinks.google_play} target="_blank" rel="noopener noreferrer" className="cta-btn outline">
                <img src="/img/play_icon.svg" /> {t("googlePlay")}
              </a>
            </div>
          </div>

          <span className="bubble b1"></span>
          <span className="bubble b2"></span>
          <span className="bubble b3"></span>
        </div>
      </div>
    </section>
  );
}
