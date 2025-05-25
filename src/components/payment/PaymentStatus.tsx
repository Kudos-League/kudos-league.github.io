import { useEffect } from "react";
import io from "socket.io-client";
import { getEndpointUrl } from "shared/api/config";

type Props = {
  onStatusUpdate: (message: string) => void;
};

export default function PaymentStatusListener({ onStatusUpdate }: Props) {
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
