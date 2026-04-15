"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GuestRoute = ({ children }) => {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // User is logged in, redirect to home
            router.replace("/");
        } else {
            setIsChecking(false);
        }
    }, [router]);

    // Show nothing while checking auth status
    if (isChecking) {
        return null;
    }

    return <>{children}</>;
};

export default GuestRoute;
