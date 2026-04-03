"use client";
import React, { useState, useEffect } from 'react';
import { Apple, Play, Facebook, Linkedin, Instagram, Youtube, Container } from 'lucide-react';
import Link from 'next/link';
import globalSettingApi from '../api/globalSettingApi';
import stayUpdatedApi from '../api/stayUpdatedApi';
import toast from 'react-hot-toast';

export default function Footer() {
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
        if (response.data?.status && response.data?.data?.value) {
          const links = response.data.data.value;
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
      toast.error("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await stayUpdatedApi.signup({ email });
      if (response.status) {
        setEmail("");
        // Toast is already handled by the apiClient interceptor
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

              <p>Rapidly myocardinate scalable manufactured products rather than cross functional.</p>

              <div className="footer-links">
                <div>
                  {/* <Link href="#">Agenda</Link> */}
                  {/* <Link href="#">Speakers</Link> */}
                  <Link href="/register">Register</Link>
                  {/* <Link href="#">Venue</Link> */}
                  {/* <Link href="#">FAQ</Link> */}
                </div>
                <div>
                  <Link href="/terms">Terms & Conditions</Link>
                  <Link href="/privacy-policy">Privacy Policy</Link>
                  {/* <Link href="#">Cookie Policy</Link> */}
                </div>
              </div>
              <div className="copyright">© 2026 Bondy. All rights reserved.</div>
            </div>

            <div className="footer-right">
              <h2>Stay updated</h2>
              <p>Sign up for event updates & exclusive content from our website.</p>
              <div className="input-box">
                <input
                  type="email"
                  placeholder="Email"
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
                {loading ? "Sending..." : "Stay updated"}
              </button>

              <div className="social-links">
                <h4>Follow us</h4>
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
