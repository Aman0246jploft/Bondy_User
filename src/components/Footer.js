"use client";
import React from 'react';
import { Apple, Play, Facebook, Linkedin, Instagram, Youtube, Container } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
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
                  <Link href="#">Terms & Conditions</Link>
                  <Link href="#">Privacy Policy</Link>
                  {/* <Link href="#">Cookie Policy</Link> */}
                </div>
              </div>
              <div className="copyright">© 2026 Bondy. All rights reserved.</div>
            </div>

            <div className="footer-right">
              <h2>Stay updated</h2>
              <p>Subscribe for event updates & exclusive content.</p>
              <div className="input-box">
                <input type="email" placeholder="Email" />
              </div>
              <button className="stay-btn">Stay updated</button>

              <div className="social-links">
                <h4>Follow us</h4>
                <div className='social_icon'>
                  <Link href="#">  <img src='/img/facebook.svg' /></Link>
                  <Link href="#"><img src='/img/linkdein.svg' /></Link>
                  <Link href="#"> <img src='/img/instagram.svg' /></Link>
                  <Link href="#"><img src='/img/youtube.svg' /></Link>

                </div>
              </div>
            </div>
          </div>
        </div >

      </footer>
    </div>
  );
}