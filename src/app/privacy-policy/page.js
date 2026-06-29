"use client";

import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import globalSettingApi from "@/api/globalSettingApi";
import { Container } from "react-bootstrap";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPolicy() {
    const { t, language } = useLanguage();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolicy = async () => {
            setLoading(true);
            try {
                let response;
                if (language === "mn") {
                    try {
                        response = await globalSettingApi.getPrivacyPolicyMn();
                    } catch (e) {
                        response = await globalSettingApi.getPrivacyPolicy();
                    }
                } else {
                    response = await globalSettingApi.getPrivacyPolicy();
                }

                if (response?.status && response?.data?.value) {
                    setContent(response.data.value.replace(/&nbsp;/g, " "));
                } else {
                    // Fallback to English if Mongolian is empty
                    const fallbackRes = await globalSettingApi.getPrivacyPolicy();
                    if (fallbackRes?.status) {
                        setContent(fallbackRes?.data?.value.replace(/&nbsp;/g, " "));
                    }
                }
            } catch (error) {
                console.error("Error fetching privacy policy:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicy();
        document.title = "Privacy Policy | Bondy";
    }, [language]);

    return (
        <>
            <div className="listing_page">
                <div className="breadcrumb_text text-center">
                    <h1>{t("privacyPolicy")}</h1>
                </div>
                <Header />
            </div>

            <Container className="py-5">
                <div className="policy-container" style={{ color: "white", minHeight: "60vh" }}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-teal" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="policy-content"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    )}
                </div>
            </Container>

            <Footer />
        </>
    );
}
