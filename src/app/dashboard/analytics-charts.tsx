"use client"

import React from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend
} from 'recharts'

interface AnalyticsChartsProps {
  data: {
    productivity: { name: string; notes: number; summaries: number }[]
    career: { name: string; applications: number; resumes: number }[]
  }
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-12 lg:grid-cols-2 pt-8">
      {/* Productivity Flow - Area Chart */}
      <div className="glass-card p-1 group relative overflow-hidden">
        <div className="p-10 space-y-10">
          <div className="flex items-center justify-between border-b border-border/5 pb-8">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold tracking-[0.5em] uppercase text-primary/60">Productivity Flow</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted/40 italic">Synthesis velocity over time</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-primary" />
                 <span className="text-[8px] uppercase tracking-widest opacity-40">Notes</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-indigo-400" />
                 <span className="text-[8px] uppercase tracking-widest opacity-40">Insights</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.productivity}>
                <defs>
                  <linearGradient id="colorNotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInsights" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0px', fontSize: '10px', fontFamily: 'serif' }}
                  itemStyle={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area type="monotone" dataKey="notes" stroke="var(--primary)" fillOpacity={1} fill="url(#colorNotes)" strokeWidth={2} />
                <Area type="monotone" dataKey="summaries" stroke="#818cf8" fillOpacity={1} fill="url(#colorInsights)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Career Velocity - Bar Chart */}
      <div className="glass-card p-1 group relative overflow-hidden">
        <div className="p-10 space-y-10">
          <div className="flex items-center justify-between border-b border-border/5 pb-8">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold tracking-[0.5em] uppercase text-primary/60">Career Velocity</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted/40 italic">Global opportunity engagement</p>
            </div>
            <div className="h-8 w-[1px] bg-border/5" />
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.career}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0px', fontSize: '10px', fontFamily: 'serif' }}
                  cursor={{ fill: 'rgba(255,215,0,0.05)' }}
                />
                <Bar dataKey="applications" fill="var(--primary)" radius={[2, 2, 0, 0]} barSize={20} />
                <Bar dataKey="resumes" fill="#818cf8" radius={[2, 2, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
