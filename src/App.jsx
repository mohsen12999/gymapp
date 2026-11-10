import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { EXERCISES } from "./exercises.js";
import ExerciseIcon from "./ExerciseIcon.jsx";
import { install, installState, onInstallChange } from "./install.js";
import { formatDayLabel, readPlans, shiftDay, todayKey, writePlans } from "./db.js";

const MUSCLES = ["All", ...new Set(EXERCISES.map((ex) => ex.muscle))];

export default function App() {
  const [plans, setPlans] = useState(readPlans);
  const [day, setDay] = useState(todayKey);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [showTools, setShowTools] = useState(false);
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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return EXERCISES.filter((ex) => {
      if (muscle !== "All" && ex.muscle !== muscle) return false;
      if (needle === "") return true;
      return `${ex.name} ${ex.muscle} ${ex.description}`.toLowerCase().includes(needle);
    });
  }, [query, muscle]);

  const isFiltered = query.trim() !== "" || muscle !== "All";

  const clearFilters = () => {
    setQuery("");
    setMuscle("All");
  };

  const filterSummary = [
    query.trim() ? `"${query.trim()}"` : null,
    muscle !== "All" ? muscle : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
          <p className="brand">Gym App</p>
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

      <div className="sectionbar">
        <h2 className="section">All exercises</h2>
        <button
          type="button"
          className="toggle"
          aria-expanded={showTools}
          aria-controls="exercise-tools"
          onClick={() => setShowTools((prev) => !prev)}
        >
          {showTools ? "Hide" : "Search"}
        </button>
      </div>

      {showTools ? (
        <div className="tools" id="exercise-tools">
          <input
            className="search"
            type="search"
            placeholder="Search name, muscle or how to do it"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search exercises"
          />
          <div className="filters">
            {MUSCLES.map((name) => (
              <button
                key={name}
                type="button"
                className={`filter${name === muscle ? " filter--on" : ""}`}
                aria-pressed={name === muscle}
                onClick={() => setMuscle(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <p className="count">
            <span>
              {visible.length} of {EXERCISES.length} shown
            </span>
            {isFiltered && (
              <button type="button" className="clear" onClick={clearFilters}>
                Clear
              </button>
            )}
          </p>
        </div>
      ) : (
        isFiltered && (
          <p className="count count--narrow" id="exercise-tools">
            <span>
              {visible.length} of {EXERCISES.length} shown · {filterSummary}
            </span>
            <button type="button" className="clear" onClick={clearFilters}>
              Clear
            </button>
          </p>
        )
      )}

      {showTools && visible.length === 0 && (
        <p className="empty">Nothing matches. Try fewer letters or another muscle.</p>
      )}
      <ul className="list">
        {visible.map((ex) => {
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

      <footer className="footer">
        {APP_NAME} &middot; v{APP_VERSION}
      </footer>
    </div>
  );
}
