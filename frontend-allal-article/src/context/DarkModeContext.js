import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

const DarkModeContext = createContext({ darkMode: false, toggleDarkMode: () => {} });
DarkModeContext.displayName = "DarkModeContext";

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("darkMode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("darkMode", darkMode);
    } catch {
      // ignore
    }
    if (darkMode) {
      document.documentElement.setAttribute("data-dark", "");
    } else {
      document.documentElement.removeAttribute("data-dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

DarkModeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useDarkMode() {
  return useContext(DarkModeContext);
}
