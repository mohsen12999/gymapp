import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { EXERCISES } from "./exercises.js";
import ExerciseIcon from "./ExerciseIcon.jsx";
import { install, installState, onInstallChange } from "./install.js";
import { formatDayLabel, readPlans, shiftDay, todayKey, writePlans } from "./db.js";

const MUSCLES = ["All", ...new Set(EXERCISES.map((ex) => ex.muscle))];

const REPO_URL = "https://github.com/mohsen12999/gymapp";

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
        <span>
          {APP_NAME} &middot; v{APP_VERSION}
        </span>
        <a className="repo" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 16 16" className="repo-icon" aria-hidden="true" focusable="false">
            <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
          </svg>
          <span>GitHub</span>
        </a>
      </footer>
    </div>
  );
}
