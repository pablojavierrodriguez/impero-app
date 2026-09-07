import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  formatter: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, formatter, className = "" }: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 120, damping: 25 });
  const [display, setDisplay] = useState(() => formatter(value));

  useEffect(() => {
    // Si el valor cambia drásticamente (ej: cambio de divisa de 100000 a 83.33),
    // jump directo para evitar un deslizamiento que confunda al usuario
    spring.jump(value);
    setDisplay(formatter(value));

    const unsub = spring.on("change", (v) => {
      setDisplay(formatter(v));
    });
    return unsub;
  }, [value, formatter, spring]);

  return <span className={className}>{display}</span>;
}
