import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

function ProtectedRoute({ roles, children }) {
  const token = localStorage.getItem("token");
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    if (user.role === "SURVEYOR") return <Navigate to="/surveyor" replace />;
    if (user.role === "OFFICER") return <Navigate to="/officer" replace />;
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
