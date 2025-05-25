import React from "react";
import { getEndpointUrl } from "@/shared/api/config";

export default function DiscordLoginButton() {
  const handleDiscordLogin = () => {
    const discordLoginUrl = `${getEndpointUrl()}/users/discord`;
    window.location.href = discordLoginUrl;
  };

  return (
    <button
      onClick={handleDiscordLogin}
      className="w-10 h-10 rounded-full bg-[#7289DA] text-white font-bold text-lg flex items-center justify-center"
      title="Login with Discord"
      aria-label="Login with Discord"
    >
      G
    </button>
  );
}
