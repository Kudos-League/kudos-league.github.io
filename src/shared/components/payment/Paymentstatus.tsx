import React, { useEffect } from "react";
import io from "socket.io-client";

export default function PaymentStatusListener({ onStatusUpdate }) {
  useEffect(() => {
    const socket = io(`${process.env.BACKEND_URI}/stripe-events`, {
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
