// components/theme-toggle.jsx
"use client";

import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme } = useTheme();

  return (
    <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
      <Moon className="h-4 w-4" />
      <span className="sr-only">Dark mode enabled</span>
    </Button>
  );
}