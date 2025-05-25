import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Main Components
import Home from "@/pages/home";

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
import Layout from "../Layout";
import DMChat from "../messages/DMChat";

function AppNavigator() {
  return (
    <Routes>
      <Route path ="" element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />

        <Route path="/post/:id" element={<Post />} />
        <Route path="/user/:username" element={<Profile />} />
        <Route path="/event/:eventId" element={<EventDetails />} />
        <Route path ="/chat" element={<DMChat />} />

        <Route path="/login" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default AppNavigator;
