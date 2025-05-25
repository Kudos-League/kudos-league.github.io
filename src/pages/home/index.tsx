import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Routes, Route, Navigate } from "react-router-dom";

import Feed from "@/pages/feed";
import About from "@/pages/about";
import SignIn from "@/pages/login";
import SignUp from "@/pages/signup";
import Profile from "@/pages/user";
import DMChat from "@/components/messages/DMChat";
import PublicChat from "@/components/messages/PublicChat";

export default function HomeRouter() {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      {isLoggedIn ? (
        <>
          <Route path="/" element={<Feed />} />
          <Route path="/chat" element={<DMChat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<About />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}
