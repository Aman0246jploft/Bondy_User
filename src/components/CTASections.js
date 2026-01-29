"use client";
import React from "react";
import { Apple, Play } from "lucide-react";

export default function CTASection() {
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
            <h2>Ready to get started?</h2>
            <p>
              Risus habitant leo egestas mauris diam eget morbi tempus
              vulputate.
            </p>

            <div className="cta-buttons">
              <a href="#" className="cta-btn outline">
                <img src="/img/apple_icon.svg" /> App Store
              </a>
              <a href="#" className="cta-btn outline">
                <img src="/img/play_icon.svg" /> Google Play
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
