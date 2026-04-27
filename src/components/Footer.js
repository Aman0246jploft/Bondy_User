"use client";
import React, { useState, useEffect } from 'react';
import { Apple, Play, Facebook, Linkedin, Instagram, Youtube, Container } from 'lucide-react';
import Link from 'next/link';
import globalSettingApi from '../api/globalSettingApi';
import stayUpdatedApi from '../api/stayUpdatedApi';
import toast from 'react-hot-toast';
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    facebook: "#",
    linkedin: "#",
    instagram: "#",
    youtube: "#"
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const response = await globalSettingApi.getSocialLinks();
        if (response?.status && response?.data?.value) {
          const links = response.data.value;
          setSocialLinks({
            facebook: links.facebook || "#",
            linkedin: links.linkedin || "#",
            instagram: links.instagram || "#",
            youtube: links.youtube || "#"
          });
        }
      } catch (error) {
        console.error("Error fetching social links:", error);
      }
    };
    fetchSocialLinks();
  }, []);

  const handleSignup = async () => {
    if (!email) {
      toast.error(t("pleaseEnterEmail"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("pleaseEnterValidEmail"));
      return;
    }

    setLoading(true);
    try {
      const response = await stayUpdatedApi.signup({ email });
      if (response?.status === true) {
        setEmail("");
        toast.success(t("thanksForSigningUp"));
      }
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>


      {/* FOOTER SECTION */}
      <footer className="">
        <div className='container' >
          <div className='footer-container'>
            <div className="footer-left">
              <div className="footer_logo">
                <img src='/img/footer_logo.svg' />
              </div>

              <p>{t("footerDescription")}</p>

              <div className="footer-links">
                <div>
                  {/* <Link href="#">Agenda</Link> */}
                  {/* <Link href="#">Speakers</Link> */}
                  <Link href="/register">{t("register")}</Link>
                  {/* <Link href="#">Venue</Link> */}
                  {/* <Link href="#">FAQ</Link> */}
                </div>
                <div>
                  <Link href="/terms">{t("termsConditions")}</Link>
                  <Link href="/privacy-policy">{t("privacyPolicy")}</Link>
                  {/* <Link href="#">Cookie Policy</Link> */}
                </div>
              </div>
              <div className="copyright">© 2026 Bondy. {t("allRightsReserved")}</div>
            </div>

            <div className="footer-right">
              <h2>{t("stayUpdated")}</h2>
              <p>{t("stayUpdatedDesc")}</p>
              <div className="input-box">
                <input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                className="stay-btn"
                onClick={handleSignup}
                disabled={loading}
              >
                {loading ? t("sending") : t("stayUpdated")}
              </button>

              <div className="social-links">
                <h4>{t("followUs")}</h4>
                <div className='social_icon'>
                  <Link href={socialLinks.facebook} target="_blank">  <img src='/img/facebook.svg' /></Link>
                  <Link href={socialLinks.linkedin} target="_blank"><img src='/img/linkdein.svg' /></Link>
                  <Link href={socialLinks.instagram} target="_blank"> <img src='/img/instagram.svg' /></Link>
                  <Link href={socialLinks.youtube} target="_blank"><img src='/img/youtube.svg' /></Link>

                </div>
              </div>
            </div>
          </div>
        </div >

      </footer>
    </div>
  );
}
