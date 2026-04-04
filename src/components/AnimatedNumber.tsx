import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  formatter: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, formatter, className = "" }: AnimatedNumberProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const [display, setDisplay] = useState(formatter(value));

  useEffect(() => {
    spring.set(value);
    const unsub = spring.on("change", v => {
      setDisplay(formatter(v));
    });
    return unsub;
  }, [value, formatter, spring]);

  return <span className={className}>{display}</span>;
}
