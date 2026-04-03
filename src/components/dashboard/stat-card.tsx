"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { CountUp } from "./count-up";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glass-card p-8 group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500">
        <Icon className="w-24 h-24" />
      </div>
      
      <div className="flex flex-row items-center justify-between pb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9CA3AF] group-hover:text-primary transition-all">
          {label}
        </span>
        <Icon className="h-4 w-4 text-primary opacity-50 group-hover:opacity-100 transition-all" />
      </div>
      
      <div className="flex items-baseline gap-4">
        <div className="text-5xl font-heading tracking-tighter text-foreground">
          <CountUp value={value} />
        </div>
        {trend && (
          <div className={`text-[10px] font-bold ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'} flex items-center gap-1`}>
            {trend.isUp ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      
      <div className="mt-4 h-1 w-full bg-primary/5 overflow-hidden">
        <motion.div 
          className="h-full bg-primary/40"
          initial={{ width: 0 }}
          animate={{ width: "60%" }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
