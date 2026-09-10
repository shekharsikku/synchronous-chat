import { useEffect, type PropsWithChildren } from "react";
import { ThemeContext } from "@/lib/context";
import { useAppStore } from "@/lib/zustand";

const ThemeProvider = ({ children, ...props }: PropsWithChildren) => {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    const rootElement = window.document.documentElement;

    rootElement.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      rootElement.classList.add(systemTheme);
      return;
    }

    rootElement.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider {...props} value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
