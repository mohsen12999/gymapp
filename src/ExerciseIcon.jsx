export default function ExerciseIcon({ pose, className }) {
  const { head, body, gear = [] } = pose;
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={head[0]} cy={head[1]} r="5.5" className="stroke-main" strokeWidth="3" />
      {body.map((points, i) => (
        <polyline
          key={i}
          className="stroke-main"
          strokeWidth="3"
          points={points.map(([x, y]) => `${x},${y}`).join(" ")}
        />
      ))}
      {gear.map(([cx, cy, r], i) => (
        <circle key={i} className="fill-main" cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  );
}
