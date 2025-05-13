import "./index.css";

import { GithubPicker } from "react-color";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

const themeBgColors: Record<
  "modern" | "dark" | "light" | "blue" | "rainbow",
  string
> = {
  dark: "#1a1a1a",
  modern: "#f55d3e",
  light: "#e0f9e2",
  blue: "#1e40af",
  rainbow: "#ff1493",
};

const themes = [
  { name: "Dark", value: "dark" },
  { name: "Modern", value: "modern" },
  { name: "Light", value: "light" },
  { name: "Blue", value: "blue" },
  { name: "Rainbow", value: "rainbow" },
];

const ThemeSelector = () => {
  const { setTheme } = useTheme();
  const [showPalette, setShowPalette] = useState(false);

  const swatchColors = Object.values(themeBgColors);

  const handleSwatchChange = (color: { hex: string }) => {
    console.log("Selected color:", color.hex);
    if (color.hex.toLowerCase() === "#ff1493") {
      setTheme("rainbow");
      setShowPalette(false);
      return;
    }

    const foundTheme = (
      Object.entries(themeBgColors) as [string, string][]
    ).find(([, value]) => value.toLowerCase() === color.hex.toLowerCase());
    if (foundTheme) {
      console.log("Setting theme to:", foundTheme[0]);
      setTheme(
        foundTheme[0] as "modern" | "dark" | "light" | "blue" | "rainbow"
      );
    }
    setShowPalette(false);
  };

  return (
    <div className="w-fit p-4 h-16">
      <button
        className="mb-2 cursor-pointer group focus:outline-none"
        onClick={() => setShowPalette(!showPalette)}
        onBlur={(e) => {
          // Only hide if clicking outside both the button and the color picker
          const relatedTarget = e.relatedTarget as Node;
          const button = e.currentTarget;
          const colorPicker = document.querySelector(".github-picker");

          if (
            !button.contains(relatedTarget) &&
            !colorPicker?.contains(relatedTarget)
          ) {
            setShowPalette(false);
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
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
        <div
          className="absolute fit-content z-10"
          onBlur={() => setShowPalette(false)}
        >
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
