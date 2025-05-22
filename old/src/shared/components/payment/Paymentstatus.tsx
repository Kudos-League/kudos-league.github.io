import React, { useEffect } from "react";
import { getEndpointUrl } from "shared/api/config";
import io from "socket.io-client";

export default function PaymentStatusListener({ onStatusUpdate }) {
  useEffect(() => {
    const socket = io(`${getEndpointUrl()}/stripe-events`, {
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
