"use client";
import React, { useState, useRef, useEffect } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: OTP, 2: Password Reset, 3: Success

    // OTP State
    const [otp, setOtp] = useState(["", "", "", "", ""]);
    const inputRefs = useRef([]);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Password State
    const [resetToken, setResetToken] = useState("");
    const [show, setShow] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        const storedEmail = localStorage.getItem("resetEmail");
        if (!storedEmail) {
            toast.error("Please start from the forgot password page");
            router.push("/forgot-password");
            return;
        }
        setEmail(storedEmail);
    }, [router]);

    // Countdown timer for resend OTP
    useEffect(() => {
        if (resendTimer > 0 && step === 1) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
    }, [resendTimer, step]);

    // OTP Handlers
    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        if (element.value !== "" && index < 4) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpValue = otp.join("");

        if (otpValue.length < 5) {
            toast.error("Please enter complete OTP");
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.verifyForgotPasswordOtp({
                email,
                otp: otpValue,
            });

            if (response.status) {
                setResetToken(response.data.token);
                setStep(2);
                toast.success("OTP verified! Now set your new password");
            }
        } catch (error) {
            // Error handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async (e) => {
        e.preventDefault();
        if (!canResend) return;

        try {
            const response = await authApi.resendUniversalOtp({
                email,
                type: "FORGOT_PASSWORD",
            });

            if (response.status) {
                toast.success("OTP resent successfully");
                setResendTimer(60);
                setCanResend(false);
                setOtp(["", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            // Error handled by interceptor
        }
    };

    // Password handlers
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (formData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.resetPassword({
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword,
                resetToken: resetToken,
            });

            if (response.status) {
                setStep(3);
                toast.success("Password reset successful!");

                // Clear stored email
                localStorage.removeItem("resetEmail");

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            }
        } catch (error) {
            // Error handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login_sec otp_sec">
            <Container fluid>
                <Row className="justify-content-between align-items-center gy-4 m-0">
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
                        <Row className="justify-content-center">
                            <Col xl={7} lg={9} md={10}>
                                <div className="common_field">
                                    {step === 1 && (
                                        <>
                                            <div className="fz_32">
                                                <h2>Enter Verification Code</h2>
                                                <p>
                                                    We sent a verification code to your email
                                                    <br />
                                                    <span>{email}</span>
                                                </p>
                                            </div>

                                            <Form onSubmit={handleVerifyOtp}>
                                                <div className="otp-container">
                                                    {otp.map((data, index) => (
                                                        <input
                                                            key={index}
                                                            type="text"
                                                            maxLength="1"
                                                            placeholder="—"
                                                            ref={(el) => (inputRefs.current[index] = el)}
                                                            value={data}
                                                            onChange={(e) => handleOtpChange(e.target, index)}
                                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                                            className="otp-input"
                                                        />
                                                    ))}
                                                </div>

                                                <div className="other_signup mb-4">
                                                    <span>
                                                        Didn't receive the code?{" "}
                                                        {canResend ? (
                                                            <Link href="#" onClick={handleResendOtp}>
                                                                Resend
                                                            </Link>
                                                        ) : (
                                                            <span style={{ color: "#999" }}>
                                                                Resend in {resendTimer}s
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>

                                                <button
                                                    type="submit"
                                                    className="common_btn w-100 border-0"
                                                    disabled={loading}
                                                >
                                                    {loading ? "Verifying..." : "Verify & Continue"}
                                                </button>
                                            </Form>
                                        </>
                                    )}

                                    {step === 2 && (
                                        <>
                                            <div className="fz_32">
                                                <h2>Set New Password</h2>
                                                <p>
                                                    Create a strong password to secure your account
                                                </p>
                                            </div>

                                            <Form className="login_field" onSubmit={handleResetPassword}>
                                                <Form.Group className="mb-3" controlId="newPassword">
                                                    <div className="d-flex gap-2 position-relative">
                                                        <Form.Control
                                                            type={show ? "text" : "password"}
                                                            name="newPassword"
                                                            placeholder="New Password"
                                                            value={formData.newPassword}
                                                            onChange={handlePasswordChange}
                                                            required
                                                            minLength={6}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShow(!show)}
                                                            className="password-eye-btn"
                                                        >
                                                            <img
                                                                src={show ? "/img/lock.svg" : "/img/unlock.svg"}
                                                                alt="toggle password"
                                                            />
                                                        </button>
                                                    </div>
                                                    <small className="text-muted">
                                                        Minimum 6 characters
                                                    </small>
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="confirmPassword">
                                                    <div className="d-flex gap-2 position-relative">
                                                        <Form.Control
                                                            type={showConfirm ? "text" : "password"}
                                                            name="confirmPassword"
                                                            placeholder="Confirm New Password"
                                                            value={formData.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirm(!showConfirm)}
                                                            className="password-eye-btn"
                                                        >
                                                            <img
                                                                src={
                                                                    showConfirm ? "/img/lock.svg" : "/img/unlock.svg"
                                                                }
                                                                alt="toggle password"
                                                            />
                                                        </button>
                                                    </div>
                                                </Form.Group>

                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="common_btn w-100 d-block text-center text-decoration-none border-0"
                                                >
                                                    {loading ? "Resetting..." : "Reset Password"}
                                                </button>
                                            </Form>
                                        </>
                                    )}

                                    {step === 3 && (
                                        <>
                                            <div className="fz_32 text-center">
                                                <div className="mb-4">
                                                    <svg
                                                        width="80"
                                                        height="80"
                                                        viewBox="0 0 80 80"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="mx-auto"
                                                    >
                                                        <circle cx="40" cy="40" r="40" fill="#10B981" />
                                                        <path
                                                            d="M25 40L35 50L55 30"
                                                            stroke="white"
                                                            strokeWidth="4"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </div>
                                                <h2>Password Reset Successful!</h2>
                                                <p>
                                                    Your password has been reset successfully.
                                                    <br />
                                                    Redirecting to login page...
                                                </p>
                                            </div>

                                            <div className="other_signup mt-4">
                                                <span>
                                                    <Link href="/login">Go to Login Now</Link>
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
