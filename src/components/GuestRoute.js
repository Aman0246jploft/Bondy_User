"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GuestRoute = ({ children }) => {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const profileStr = localStorage.getItem("userProfile");
            if (profileStr) {
                try {
                    const profile = JSON.parse(profileStr);
                    if (profile.roleId === 5 || profile.userRole === "STAFF") {
                        router.replace("/StaffHome");
                        return;
                    }
                } catch (e) {
                    // ignore
                }
            }
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
