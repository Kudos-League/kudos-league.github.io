import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Main Components
import DrawerNavigator from "./DrawerNavigator";

// Donation Flow Pages
import Success from "@/pages/donate/sucess";
import Cancel from "@/pages/donate/cancel";

// Entity Pages
import Post from "@/pages/post";
import Profile from "@/pages/user";

// Authentication Pages
import SignIn from "@/pages/login";
import SignUp from "@/pages/signup";

import EventDetails from "@/pages/event";

function AppNavigator() {
  return (
    <Routes>
      {/* Main Entry Point */}
      <Route path="/" element={<DrawerNavigator />} />

      {/* Donation Flow */}
      <Route path="/success" element={<Success />} />
      <Route path="/cancel" element={<Cancel />} />

      {/* Entity Details Screens */}
      <Route path="/post/:id" element={<Post />} />
      <Route path="/user/:username" element={<Profile />} />
      <Route path="/event/:eventId" element={<EventDetails />} />

      {/* Auth Screens */}
      <Route path="/login" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />

      {/* Fallback: redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppNavigator;
