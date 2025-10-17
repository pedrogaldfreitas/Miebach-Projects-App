import React from "react";
import { Navigate } from "react-router-dom";

//This serves as a wrapper in App.jsx, only allowing access to certain modules depending on authenticated user.
export default function RequireRole({ role, children }) {
  const authRole = sessionStorage.getItem("auth_role");
  const authUserId = sessionStorage.getItem("auth_user_id"); // in case child needs it

  if (!authRole || !authUserId) return <Navigate to="/" replace />;
  if (role && authRole !== role) return <Navigate to="/" replace />;

  return children;
}
