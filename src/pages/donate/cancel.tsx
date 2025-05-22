import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import PaymentStatusListener from "@/components/payment/PaymentStatus";

export default function CancelPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialErrorMessage = params.get("error") || "Payment was canceled.";

  const [errorMessage, setErrorMessage] = useState(initialErrorMessage);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-2xl font-semibold mb-2">Payment Canceled</h1>
      <p className="text-gray-600">{errorMessage}</p>
      <PaymentStatusListener onStatusUpdate={setErrorMessage} />
    </div>
  );
}
