import React, { ReactNode } from "react";
import { TailwindProvider, Utilities } from "tailwind-rn";

interface TailwindWrapperProps {
  children: ReactNode;
  utilities: Utilities;
}

// Wrap TailwindProvider to allow children explicitly
export const TailwindWrapper: React.FC<TailwindWrapperProps> = ({
  children,
  utilities,
}) => {
  return (
    <TailwindProvider utilities={utilities as any}>{children}</TailwindProvider>
  );
};
