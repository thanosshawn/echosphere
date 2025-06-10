
// src/components/ThemeSwitcher.tsx
"use client";

import { useTheme, type Theme } from "@/contexts/ThemeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Monitor, Sun, Moon, Palette } from "lucide-react"; // Palette for more options

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
    <div className="space-y-2">
      <Label htmlFor="theme-select" className="text-lg font-medium">Select Theme</Label>
      <Select value={theme} onValueChange={handleThemeChange}>
        <SelectTrigger id="theme-select" className="w-full md:w-[280px]">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent>
          {themeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center">
                {option.icon}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Choose how EchoSphere looks to you. Your preference will be saved.
      </p>
    </div>
  );
}
