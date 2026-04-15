"use client";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { Row, Col } from "react-bootstrap";
import ProtectedRoute from "@/components/ProtectedRoute";
import {useEffect} from "react";

function page() {

  const { t } = useLanguage();

   useEffect(() => {
    document.title = "Customer Admin - Bondy";
  }, []);
  
  return (
    <div>
      <div className="cards payment-cards">
        <img src="/img/card-img.svg" alt="Credit Card" />
        <h5>{t("noCardAdded")}</h5>
        <p>{t("addCardText")}</p>
        <Link href="/AddNewCard" className="custom-btn">
          {t("addNewCard")}
        </Link>
      </div>
    </div>
  );
}

export default page;
