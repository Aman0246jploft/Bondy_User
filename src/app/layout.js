import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Toaster } from "react-hot-toast";
import LocationManager from "@/components/LocationManager";
import { SocketProvider } from "@/context/SocketContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthGuardProvider } from "@/context/AuthGuardContext";
import AuthRequiredModal from "@/components/Modal/AuthRequiredModal";
import GoogleProvider from "@/components/GoogleProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Toaster position="top-right" reverseOrder={false} />
        <LocationManager />
        <LanguageProvider>
          <SocketProvider>
            <AuthGuardProvider>
              {children}
              <AuthRequiredModal />
            </AuthGuardProvider>
          </SocketProvider>
        </LanguageProvider>
        <GoogleProvider>
          <LanguageProvider>
            <SocketProvider>{children}</SocketProvider>
          </LanguageProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
