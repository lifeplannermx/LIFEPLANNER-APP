import React from "react";

type GluestackUIProviderProps = {
  children: React.ReactNode;
  mode?: "light" | "dark";
};

export function GluestackUIProvider({
  children,
  mode = "light",
}: GluestackUIProviderProps) {
  return <>{children}</>;
}
