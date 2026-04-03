"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function CountUp({ value }: { value: number }) {
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
  });
  
  const displayValue = useTransform(springValue, (latest) => Math.floor(latest));

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  return <motion.span>{displayValue}</motion.span>;
}
