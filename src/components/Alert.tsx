import React from "react";

interface AlertProps {
  type: "success" | "danger" | "warning" | "info";
  message: string;
}

const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const baseStyle = "p-4 rounded-md mb-4 text-base font-medium";

  const typeClasses: Record<AlertProps["type"], string> = {
    success: "bg-green-500 text-white",
    danger: "bg-red-500 text-white",
    warning: "bg-yellow-400 text-black",
    info: "bg-blue-500 text-white",
  };

  return (
    <div className={`${baseStyle} ${typeClasses[type]}`}>
      {message}
    </div>
  );
};

export default Alert;
