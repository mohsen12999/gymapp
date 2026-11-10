import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { EXERCISES } from "./exercises.js";
import ExerciseIcon from "./ExerciseIcon.jsx";
import { install, installState, onInstallChange } from "./install.js";
import { formatDayLabel, readPlans, shiftDay, todayKey, writePlans } from "./db.js";

export default function App() {
  const [plans, setPlans] = useState(readPlans);
  const [day, setDay] = useState(todayKey);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const installStatus = useSyncExternalStore(onInstallChange, installState);

  useEffect(() => {
    writePlans(plans);
  }, [plans]);

  const installControl =
    installStatus === "installed" ? (
      <p className="badge">Installed</p>
    ) : (
      <button
        type="button"
        className="install"
        onClick={() => {
          if (installStatus === "available") {
            install();
          } else {
            setShowInstallHint(true);
          }
        }}
      >
        Install
      </button>
    );

  const chosen = useMemo(
    () => new Set(Array.isArray(plans[day]) ? plans[day] : []),
    [plans, day],
  );

  const plan = useMemo(() => EXERCISES.filter((ex) => chosen.has(ex.id)), [chosen]);

  const writeDay = (ids) => setPlans((prev) => ({ ...prev, [day]: ids }));

  const toggle = (id) => {
    const next = [...chosen];
    if (chosen.has(id)) {
      next.splice(next.indexOf(id), 1);
    } else {
      next.push(id);
    }
    writeDay(next);
  };

  const isToday = day === todayKey();

  return (
    <div className="app">
      <header className="header">
        <div className="topbar">
          <p className="brand">gymapp</p>
          {installControl}
        </div>
        {showInstallHint && installStatus !== "installed" && (
          <p className="hint">
            Your browser has not offered an install prompt yet. Use its menu and
            choose "Add to Home screen" / "Install app".
          </p>
        )}
        <div className="daybar">
          <button
            type="button"
            className="daynav"
            onClick={() => setDay((prev) => shiftDay(prev, -1))}
            aria-label="Previous day"
          >
            &lsaquo;
          </button>
          <p className="day">{formatDayLabel(day)}</p>
          <button
            type="button"
            className="daynav"
            onClick={() => setDay((prev) => shiftDay(prev, 1))}
            aria-label="Next day"
          >
            &rsaquo;
          </button>
        </div>
        <p className="sub">
          {plan.length === 0
            ? "No exercises saved for this day yet"
            : `${plan.length} saved for this day · tap to change`}
        </p>
      </header>

      <section className="plan">
        <h2>Saved list</h2>
        {plan.length === 0 ? (
          <p className="empty">
            This day is empty. Pick exercises below and they are stored under{" "}
            <strong>{formatDayLabel(day)}</strong>.
          </p>
        ) : (
          <ul className="chips">
            {plan.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  className="chip"
                  onClick={() => toggle(ex.id)}
                  aria-label={`Remove ${ex.name} from this day`}
                >
                  <ExerciseIcon pose={ex.pose} className="chip-svg" />
                  {ex.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!isToday && (
          <button type="button" className="today" onClick={() => setDay(todayKey())}>
            Back to today
          </button>
        )}
      </section>

      <h2 className="section">All exercises</h2>
      <ul className="list">
        {EXERCISES.map((ex) => {
          const isChosen = chosen.has(ex.id);
          return (
            <li key={ex.id}>
              <button
                type="button"
                className={`item${isChosen ? " item--on" : ""}`}
                aria-pressed={isChosen}
                onClick={() => toggle(ex.id)}
              >
                <span className={`thumb${isChosen ? " thumb--on" : ""}`}>
                  <ExerciseIcon pose={ex.pose} className="thumb-svg" />
                </span>
                <span className="meta">
                  <span className="name">{ex.name}</span>
                  <span className="muscle">{ex.muscle}</span>
                  <span className="desc">{ex.description}</span>
                </span>
                <span className={`state${isChosen ? " state--on" : ""}`}>
                  {isChosen ? "Saved" : "Add"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
