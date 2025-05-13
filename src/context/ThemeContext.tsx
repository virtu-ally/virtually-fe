import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "modern" | "dark" | "light" | "blue" | "rainbow";

const themeBgColors: Record<Theme, string> = {
  dark: "#1a1a1a",
  modern: "#f55d3e",
  light: "#e0f9e2",
  blue: "#1e40af",
  rainbow:
    "linear-gradient(315deg, rgba(101, 0, 94, 1) 3%, rgb(33, 76, 119) 38%, rgb(19, 99, 93) 68%, rgb(166, 20, 20) 98%)",
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    return (stored as Theme) || "dark";
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
