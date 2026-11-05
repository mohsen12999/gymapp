import { useEffect, useMemo, useState } from "react";
import { EXERCISES } from "./exercises.js";
import ExerciseIcon from "./ExerciseIcon.jsx";

const STORAGE_KEY = "gym.active-exercises";
const DEFAULT_ACTIVE = ["squat", "bench-press", "bicep-curl"];

function loadActive() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return new Set(DEFAULT_ACTIVE);
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set(DEFAULT_ACTIVE);
  }
}

export default function App() {
  const [active, setActive] = useState(loadActive);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...active]));
  }, [active]);

  const toggle = (id) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const summary = useMemo(() => {
    const on = EXERCISES.filter((e) => active.has(e.id)).length;
    return { on, total: EXERCISES.length };
  }, [active]);

  return (
    <div className="app">
      <header className="header">
        <h1>Gym exercises</h1>
        <p className="sub">
          {summary.on} of {summary.total} active &middot; tap to toggle
        </p>
      </header>

      <ul className="list">
        {EXERCISES.map((ex) => {
          const isActive = active.has(ex.id);
          return (
            <li key={ex.id}>
              <button
                type="button"
                className={`item${isActive ? " item--on" : ""}`}
                aria-pressed={isActive}
                onClick={() => toggle(ex.id)}
              >
                <span className={`thumb${isActive ? " thumb--on" : ""}`}>
                  <ExerciseIcon pose={ex.pose} className="thumb-svg" />
                </span>
                <span className="meta">
                  <span className="name">{ex.name}</span>
                  <span className="muscle">{ex.muscle}</span>
                  <span className="desc">{ex.description}</span>
                </span>
                <span className={`state${isActive ? " state--on" : ""}`}>
                  {isActive ? "Active" : "Inactive"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
