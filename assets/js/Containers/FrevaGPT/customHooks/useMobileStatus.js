import React, { useEffect } from "react";

export default function useMobileStatus() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const minWidth = 768; // Minimum width for desktop devices
    setIsMobile(window.innerWidth < minWidth || screen.width < minWidth);
  }, []);

  return isMobile;
}
