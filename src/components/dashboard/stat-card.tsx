"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { CountUp } from "./count-up";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export function StatCard({ label, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      className="card-premium p-6 group relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              <CountUp value={value} />
            </h2>
            {trend && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                trend.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              )}>
                {trend.isUp ? "+" : "-"}{trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-accent/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {/* Decorative Shimmer on Hover */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] transition-transform" />
    </motion.div>
  );
}
