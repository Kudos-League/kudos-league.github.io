import React, { useEffect } from "react";
import io from "socket.io-client";
import { REACT_APP_BACKEND_URI } from "@env";

export default function PaymentStatusListener({ onStatusUpdate }) {
  useEffect(() => {
    const socket = io(`${REACT_APP_BACKEND_URI}/stripe-events`, {
      transports: ["websocket"],
    });

    socket.on("payment_failed", (data) => {
      onStatusUpdate(`Payment failed: ${data.message || "An error occurred."}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [onStatusUpdate]);

  return null;
}
