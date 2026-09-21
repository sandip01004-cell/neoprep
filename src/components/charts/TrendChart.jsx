import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { formatDate } from '../../utils/date';

/**
 * Test score trend chart.
 * Shows overall % trend across last 20 tests.
 * This component is lazy-loaded by TestVault.jsx.
 */
export default function TrendChart({ tests = [], maxMarksDefault = 720 }) {
  if (!tests.length) {
    return (
      <div style={{
        textAlign: 'center',
        color: 'var(--text-muted)',
        padding: '40px 0',
        fontSize: '0.9rem',
      }}>
        No test data yet. Add a test to see your trend.
      </div>
    );
  }

  const data = [...tests]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20)
    .map((t, i) => ({
      name: `T${i + 1}`,
      date: t.date,
      pct:  Math.round((t.total / (t.maxMarks || maxMarksDefault)) * 100),
      score: t.total,
      maxMarks: t.maxMarks || maxMarksDefault,
    }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
          }}
          formatter={(val, name, props) => [
            `${val}%  (${props.payload?.score}/${props.payload?.maxMarks})`,
            'Score',
          ]}
          labelFormatter={(label, payload) => {
            const item = payload?.[0]?.payload;
            return item ? `${label} · ${formatDate(item.date)}` : label;
          }}
        />
        <Line
          type="monotone"
          dataKey="pct"
          stroke="var(--accent-violet-light)"
          strokeWidth={2.5}
          dot={{ fill: 'var(--accent-violet-light)', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'var(--accent-cyan)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
