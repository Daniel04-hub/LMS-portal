import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function getHomePathByRole(role) {
  var normalizedRole = String(role || "");

  normalizedRole = normalizedRole.trim();
  normalizedRole = normalizedRole.toLowerCase();

  if (normalizedRole === "admin") {
    return "/admin";
  }

  if (normalizedRole === "trainer") {
    return "/trainer";
  }

  if (normalizedRole === "student") {
    return "/student";
  }

  return "/login";
}

export default function ProtectedRoute(props) {
  var auth = useAuth();
  var user = auth.user;

  var requiredRole = "";

  if (props.role) {
    requiredRole = String(props.role);
    requiredRole = requiredRole.trim();
    requiredRole = requiredRole.toLowerCase();
  } else {
    if (props.allowedRole) {
      requiredRole = String(props.allowedRole);
      requiredRole = requiredRole.trim();
      requiredRole = requiredRole.toLowerCase();
    }
  }

  var userRole = "";

  if (user) {
    if (user.role) {
      userRole = String(user.role);
      userRole = userRole.trim();
      userRole = userRole.toLowerCase();
    }
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (requiredRole !== "") {
    if (userRole !== requiredRole) {
      return (
        <Navigate
          to={getHomePathByRole(userRole)}
          replace
        />
      );
    }
  }

  return props.children;
}