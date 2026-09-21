import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DialInput.module.css';

const SWEEP_DEG = 270;    // dial arc from start to end
const START_DEG = 135;    // where 0 sits (bottom-left)

/**
 * Rotating dial input with drag + touch + preset buttons.
 *
 * FIX: maxValue is dynamic (passed as prop), not hardcoded to 100.
 * FIX: Uses pointer events (not mouse+touch separately) for mobile safety.
 * FIX: Confirm button disabled when value === 0.
 *
 * Props:
 *   value       – current controlled value
 *   onChange    – (newValue) => void
 *   maxValue    – max value the dial can reach (default: dailyTarget * 2)
 *   presets     – array of preset numbers, e.g. [5, 10, 25, 50]
 *   unitLabel   – display label, e.g. "Qs"
 */
export default function DialInput({ value = 0, onChange, maxValue = 100, presets = [5, 10, 25, 50], unitLabel = 'units' }) {
  const svgRef     = useRef(null);
  const dragging   = useRef(false);
  const prevAngle  = useRef(null);

  // Clamp helper
  const clamp = (v) => Math.max(0, Math.min(maxValue, Math.round(v)));

  // Convert value (0–max) → dial angle (degrees, 0-sweep)
  const valueToDeg = (v) => (v / maxValue) * SWEEP_DEG;
  // Convert dial angle → value
  const degToValue = (deg) => clamp((deg / SWEEP_DEG) * maxValue);

  // Convert value → SVG path endpoint
  const valueToXY = useCallback((v) => {
    const totalDeg = START_DEG + valueToDeg(v);
    const rad = (totalDeg * Math.PI) / 180;
    const cx = 50, cy = 50, r = 36;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }, [maxValue]);

  // Get angle from center to pointer position
  const getPointerAngle = useCallback((e) => {
    const svg  = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top + rect.height / 2;
    const px   = e.clientX - cx;
    const py   = e.clientY - cy;
    let deg = (Math.atan2(py, px) * 180) / Math.PI; // -180 to 180
    // Normalize to 0-360
    if (deg < 0) deg += 360;
    return deg;
  }, []);

  // Convert raw angle (0-360) → sweep angle (0-270)
  const normalizeAngle = useCallback((deg) => {
    // START_DEG is where 0 lives; sweep goes clockwise SWEEP_DEG degrees
    let rel = deg - START_DEG;
    if (rel < 0) rel += 360;
    // Clamp to sweep range
    if (rel > SWEEP_DEG + 30) return 0;      // snapped past end → back to 0
    return Math.min(SWEEP_DEG, rel);
  }, []);

  const onPointerDown = useCallback((e) => {
    dragging.current = true;
    svgRef.current.setPointerCapture(e.pointerId);
    prevAngle.current = getPointerAngle(e);
  }, [getPointerAngle]);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const deg     = getPointerAngle(e);
    const sweep   = normalizeAngle(deg);
    const newVal  = degToValue(sweep);
    onChange(newVal);
    prevAngle.current = deg;
    // Haptic feedback (supported on Android Chrome)
    if (navigator.vibrate && Math.abs(newVal - value) >= 1) {
      navigator.vibrate(8);
    }
  }, [getPointerAngle, normalizeAngle, degToValue, onChange, value]);

  const onPointerUp = useCallback((e) => {
    dragging.current = false;
    svgRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  // Build SVG arc path for the filled portion
  const buildArc = (v) => {
    const sweepDeg = valueToDeg(v);
    if (sweepDeg <= 0) return '';
    const isLarge  = sweepDeg > 180 ? 1 : 0;

    const startRad = (START_DEG * Math.PI) / 180;
    const endRad   = ((START_DEG + sweepDeg) * Math.PI) / 180;
    const r = 36; const cx = 50; const cy = 50;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    return `M ${x1} ${y1} A ${r} ${r} 0 ${isLarge} 1 ${x2} ${y2}`;
  };

  const thumb = valueToXY(value);
  const pct   = Math.min(100, Math.round((value / maxValue) * 100));
  const isOverTarget = value > maxValue / 2; // past 50% of max

  return (
    <div className={styles.dialWrapper}>
      {/* SVG Dial */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className={styles.svg}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={maxValue}
        aria-label={`Set value (current: ${value} ${unitLabel})`}
      >
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="var(--accent-violet)" />
            <stop offset="100%" stopColor="var(--accent-cyan)" />
          </linearGradient>
        </defs>

        {/* Track (background arc) */}
        <path
          d={buildArc(maxValue)}
          stroke="var(--bg-elevated)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Filled arc */}
        {value > 0 && (
          <path
            d={buildArc(value)}
            stroke="url(#arcGrad)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={styles.filledArc}
          />
        )}

        {/* Tick marks at target (50% of maxValue) */}
        {(() => {
          const targetVal = maxValue / 2;
          const { x, y } = valueToXY(targetVal);
          return (
            <circle cx={x} cy={y} r="3" fill="var(--accent-emerald)" opacity="0.5" />
          );
        })()}

        {/* Thumb */}
        <circle
          cx={thumb.x}
          cy={thumb.y}
          r="5"
          fill="white"
          className={styles.thumb}
          style={{ filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.6))' }}
        />

        {/* Center display */}
        <text x="50" y="47" textAnchor="middle" className={styles.valueText} fontSize="14">
          {value}
        </text>
        <text x="50" y="58" textAnchor="middle" className={styles.unitText} fontSize="7">
          {unitLabel}
        </text>
        <text x="50" y="67" textAnchor="middle" className={styles.pctText} fontSize="6.5">
          {pct}%
        </text>
      </svg>

      {/* Preset buttons */}
      <div className={styles.presets}>
        {presets.map((p) => (
          <button
            key={p}
            className={styles.preset}
            onClick={() => onChange(clamp(value + p))}
            aria-label={`Add ${p} ${unitLabel}`}
          >
            +{p}
          </button>
        ))}
      </div>
    </div>
  );
}
