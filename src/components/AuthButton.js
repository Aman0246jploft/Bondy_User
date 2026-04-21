"use client";
import React, { useContext } from "react";
import { useAuthGuard } from "@/context/AuthGuardContext";
import { AuthGuardContext } from "@/context/AuthGuardContext";

/**
 * Drop-in replacement for any <button> or <a> that needs auth.
 *
 * Add  requiresAuth  prop — that's it.
 * If the user is not logged in, clicking opens the "Account Required" modal.
 * If logged in, the normal onClick fires as usual.
 *
 * Examples:
 *   <AuthButton requiresAuth onClick={handleBook} className="common_btn">Book Tickets</AuthButton>
 *   <AuthButton requiresAuth onClick={handleComment}>Comment</AuthButton>
 *   <AuthButton onClick={handleShare}>Share</AuthButton>   ← no auth guard, works like normal button
 */
export default function AuthButton({ requiresAuth, onClick, children, ...rest }) {
  const ctx = useContext(AuthGuardContext);
  
  // Only call the hook if context exists (safe for pre-rendering)
  const { checkAuth } = ctx ? useAuthGuard() : { checkAuth: undefined };

  const handleClick = (e) => {
    if (requiresAuth && checkAuth) {
      checkAuth(onClick ? () => onClick(e) : undefined);
    } else if (!requiresAuth) {
      if (onClick) onClick(e);
    }
  };

  return (
    <button onClick={handleClick} {...rest}>
      {children}
    </button>
  );
}
