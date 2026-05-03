"use client"
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts"
import type { HealthLog } from "@/lib/types"

interface TrendChartProps {
  logs: HealthLog[]
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
  } catch {
    return dateStr
  }
}

export default function TrendChart({ logs }: TrendChartProps) {
  if (!logs.length) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2"
        style={{ height: 160 }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <span className="data-mono text-[10px] font-bold" style={{ color: "var(--gold)" }}>—</span>
        </div>
        <p className="text-[11px] font-medium" style={{ color: "rgba(250,250,250,0.3)" }}>
          Pas encore de données
        </p>
      </div>
    )
  }

  const data = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map((log) => ({
      date: formatDate(log.date),
      "FC": log.heart_rate_avg ?? null,
      "Sommeil": log.sleep_hours != null ? +(log.sleep_hours * 10).toFixed(1) : null,
    }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "rgba(250,250,250,0.3)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(250,250,250,0.3)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(5,5,5,0.95)",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 12,
            fontSize: 11,
            fontFamily: "JetBrains Mono, monospace",
            color: "rgba(250,250,250,0.85)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
          labelStyle={{ color: "rgba(212,175,55,0.7)", marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}
          cursor={{ stroke: "rgba(255,255,255,0.06)" }}
        />
        <Line
          type="monotone" dataKey="FC" stroke="#EF4444" strokeWidth={2}
          dot={{ r: 3, fill: "#EF4444", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#EF4444", strokeWidth: 0 }}
          connectNulls
        />
        <Line
          type="monotone" dataKey="Sommeil" stroke="#3B82F6" strokeWidth={2}
          dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#3B82F6", strokeWidth: 0 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
