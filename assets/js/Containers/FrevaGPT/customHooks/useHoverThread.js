import { useEffect } from "react";

export default function useHoverThread({ hovered, setHovered, ref }) {
  useEffect(() => {
    if (!hovered) {
      return;
    }

    let animationFrameId;
    const validateHover = () => {
      if (!ref.current?.matches(":hover")) {
        setHovered(false);
      } else {
        animationFrameId = requestAnimationFrame(validateHover);
      }
    };

    animationFrameId = requestAnimationFrame(validateHover);

    () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ref, hovered, setHovered]);
}
