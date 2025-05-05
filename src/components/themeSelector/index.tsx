import "./index.css";

import { GithubPicker } from "react-color";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

const themeBgColors: Record<"modern" | "dark" | "light" | "blue", string> = {
  modern: "#f55d3e",
  dark: "#1a1a1a",
  light: "#e0f9e2",
  blue: "#1e40af",
};

const ThemeSelector = () => {
  const { setTheme } = useTheme();
  const [showPalette, setShowPalette] = useState(false);

  const swatchColors = Object.values(themeBgColors);

  // When a swatch is picked, find the theme by color and set it
  const handleSwatchChange = (color: { hex: string }) => {
    const foundTheme = (
      Object.entries(themeBgColors) as [string, string][]
    ).find(([, value]) => value.toLowerCase() === color.hex.toLowerCase());
    if (foundTheme) {
      setTheme(foundTheme[0] as "modern" | "dark" | "light" | "blue");
    }
    setShowPalette(false);
  };

  return (
    <div className="w-fit p-4 h-16">
      <button
        className="mb-2 cursor-pointer group"
        onClick={() => setShowPalette(!showPalette)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className=""
        >
          <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
          <circle
            cx="13.5"
            cy="6.5"
            r=".5"
            fill="currentColor"
            className="group-hover:stroke-[red] group-focus:stroke-[red] group-active:stroke-[red]"
          />
          <circle
            cx="17.5"
            cy="10.5"
            r=".5"
            fill="currentColor"
            className="group-hover:stroke-[blue] group-focus:stroke-[blue] group-active:stroke-[blue]"
          />
          <circle
            cx="6.5"
            cy="12.5"
            r=".5"
            fill="currentColor"
            className="group-hover:stroke-[teal] group-focus:stroke-[teal] group-active:stroke-[teal]"
          />
          <circle
            cx="8.5"
            cy="7.5"
            r=".5"
            fill="currentColor"
            className="group-hover:stroke-[blueviolet] group-focus:stroke-[blueviolet] group-active:stroke-[blueviolet]"
          />
        </svg>
      </button>
      {showPalette && (
        <div onBlur={() => setShowPalette(false)}>
          <GithubPicker
            onChange={handleSwatchChange}
            colors={swatchColors}
            width="100%"
          />
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
