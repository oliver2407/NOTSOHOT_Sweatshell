import { useEffect, useRef, useState } from "react";
import { demoClock } from "../demo.js";

/*
 * The hour, as a thing a visitor can move.
 *
 * Auto is a thermostat: it does nothing at all until the air outside crosses a
 * number. On a live roof that happens around eleven in the morning, which is no use
 * to someone opening a link at midnight — they press Auto, nothing moves, and they
 * conclude the feature is decorative. Giving them the hour gives them the weather,
 * because outside air in the demo model is a function of the clock, and the roll-out
 * they then watch is the firmware's own rule running, not an animation.
 *
 * It ships only in the demo build. There is no honest version of this control on a
 * real roof, and a slider that moved the clock on live hardware would be a way to
 * make the record lie.
 */

function label(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function DemoClock({ home, onMoved }) {
  // Held locally while dragging so the slider tracks the thumb rather than the poll.
  const [mins, setMins] = useState(() => demoClock.minutes());
  const [dragging, setDragging] = useState(false);
  const timer = useRef(null);

  // Between drags the model's own clock is the truth — it keeps running.
  useEffect(() => {
    if (dragging) return;
    const t = setInterval(() => setMins(demoClock.minutes()), 3000);
    return () => clearInterval(t);
  }, [dragging]);

  useEffect(() => () => clearTimeout(timer.current), []);

  /*
   * Moving the clock rebuilds twelve hours of history, so it is debounced: a drag
   * across the afternoon fires on the pause at the end of it, not sixty times on the
   * way. The readout above still follows the thumb, so the lag is invisible.
   */
  function commit(v) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      demoClock.setMinutes(v);
      setDragging(false);
      onMoved?.();
    }, 180);
  }

  const settings = home?.device?.settings;
  const auto = home?.device?.mode === "auto";
  const out = demoClock.outside();

  // What the roof unit's own rule says about this air, in the words the rest of the
  // screen uses. Dashes elsewhere are honest; a wrong sentence here is not.
  let verdict = null;
  if (settings && auto) {
    if (out > settings.hot) verdict = `above ${settings.hot}° — Auto rolls the sheet out`;
    else if (out < settings.cool) verdict = `below ${settings.cool}° — Auto rolls it up`;
    else verdict = `between ${settings.cool}° and ${settings.hot}° — Auto leaves it as it is`;
  } else if (settings) {
    verdict = `Switch to Auto to watch it decide at ${settings.hot}°`;
  }

  return (
    <div className="democlock">
      <div className="democlock-read">
        <span className="democlock-time">{label(mins)}</span>
        <span className="democlock-out">{out.toFixed(1)}° outside</span>
      </div>

      <input
        className="democlock-slider"
        type="range"
        min="0"
        max="1439"
        step="5"
        value={mins}
        aria-label="Time of day"
        onChange={(e) => {
          const v = Number(e.target.value);
          setDragging(true);
          setMins(v);
          commit(v);
        }}
      />

      <div className="democlock-note">
        {verdict ?? "Move the hour to change the air outside."}
      </div>
    </div>
  );
}
