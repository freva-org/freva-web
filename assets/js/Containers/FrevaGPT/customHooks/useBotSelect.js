import { useEffect } from "react";

export default function useBotSelect(
  showModelList,
  visibilitySetter,
  visibilityValue
) {
  useEffect(() => {
    function keyDownHandler(e) {
      e.preventDefault();
      if (e.ctrlKey && e.code === "Escape") {
        visibilitySetter(!visibilityValue);
      }
    }

    document.addEventListener("keydown", keyDownHandler);
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [showModelList]);
}
