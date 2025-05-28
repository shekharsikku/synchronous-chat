import { useEffect, useState } from "react";
import { type Theme, ThemeContext } from "@/lib/context";

type ThemeProps = {
  children: React.ReactNode;
  storageKey?: string;
  defaultTheme?: Theme;
};

const ThemeProvider = ({
  children,
  storageKey = "synchronous-theme",
  defaultTheme = "system",
  ...props
}: ThemeProps) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const rootElement = window.document.documentElement;

    rootElement.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      rootElement.classList.add(systemTheme);
      return;
    }

    rootElement.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
