"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import authApi from "@/api/authApi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter your email address");
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.forgotPasswordInit({ email });

            if (response.status) {
                // Store email for the reset password page
                localStorage.setItem("resetEmail", email);
                toast.success("OTP sent to your email");
                router.push("/reset-password");
            }
        } catch (error) {
            // Error handled by apiClient interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login_sec">
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
                            <Col xxl={7} xl={9} lg={10} md={12}>
                                <div className="common_field">
                                    <div className="fz_32">
                                        <h2>Forgot Password?</h2>
                                        <p>
                                            No worries! Enter your email address and we'll send you a
                                            verification code to reset your password.
                                        </p>
                                    </div>

                                    <Form className="login_field" onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3" controlId="email">
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </Form.Group>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="common_btn w-100 d-block text-center text-decoration-none border-0"
                                        >
                                            {loading ? "Sending..." : "Send Verification Code"}
                                        </button>
                                    </Form>

                                    <div className="other_signup mt-4">
                                        <span>
                                            Remember your password?{" "}
                                            <Link href="/login">Back to Login</Link>
                                        </span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
