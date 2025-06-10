
// src/components/ThemeSwitcher.tsx
"use client";

import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Monitor, Sun, Moon, Palette } from "lucide-react";

const themeOptions: { value: Theme; label: string; icon?: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="mr-2 h-4 w-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="mr-2 h-4 w-4" /> },
  { value: "theme-pink", label: "Pink Bliss", icon: <Palette className="mr-2 h-4 w-4 text-pink-500" /> },
  { value: "theme-green", label: "Forest Dew", icon: <Palette className="mr-2 h-4 w-4 text-green-500" /> },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value: string) => {
    setTheme(value as Theme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          {themeOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <div className="flex items-center">
                {option.icon}
                {option.label}
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
