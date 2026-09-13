import { MAPS } from "../maps/mapRegistry";
import type { Point, MapId } from "../data/types";
export function IslandMap({
  position,
  target,
  large = false,
  mapId = "krakatau",
}: {
  position: Point;
  target: string;
  large?: boolean;
  mapId?: MapId;
}) {
  const map = MAPS[mapId],
    objective = map.objects.find((o) => o.id === target);
  return (
    <svg
      viewBox={`${-map.radius - 6} ${-map.radius - 9} ${2 * map.radius + 12} ${2 * map.radius + 15}`}
      className={`island-map ${large ? "large" : ""}`}
      role="img"
      aria-label={`Peta ${map.name}. Titik gelap adalah posisimu, lingkaran kuning tujuan misi, segitiga guru.`}
    >
      <rect
        x={-map.radius - 6}
        y={-map.radius - 9}
        width={2 * map.radius + 12}
        height={2 * map.radius + 15}
        rx="12"
        fill={mapId === "krakatau" ? "#b4dedd" : "#92d4da"}
      />
      <text
        x="0"
        y={-map.radius - 3}
        textAnchor="middle"
        fontSize="4"
        fill="#385c50"
      >
        U ↑
      </text>
      <circle
        r={map.radius}
        fill={mapId === "krakatau" ? "#bad090" : "#b6e0d9"}
        stroke="#f2dca9"
        strokeWidth="2"
      />
      {map.areas.map((a, i) => (
        <g key={a.id}>
          {mapId === "raja-ampat" && a.id !== "ra-reef" && (
            <ellipse
              cx={a.position[0]}
              cy={a.position[1]}
              rx={a.radius}
              ry={a.radius * 0.8}
              fill="#c2d497"
              stroke="#eddeb5"
              strokeWidth="1.5"
            />
          )}
          {large && (
            <text
              x={a.position[0]}
              y={a.position[1] + 4}
              textAnchor="middle"
              fontSize="3.6"
              fontWeight="800"
              fill="#345c51"
            >
              {i + 1}
            </text>
          )}
        </g>
      ))}
      {map.paths.map((p, i) => (
        <path
          key={i}
          d={`M${p.a.join(" ")} L${p.b.join(" ")}`}
          stroke={p.kind === "glass" ? "#dcf8f2" : "#f2e4c4"}
          strokeWidth="1.8"
          fill="none"
        />
      ))}
      {map.landmarks.map((l) => (
        <rect
          key={l.id}
          x={l.position[0] - 1.5}
          y={l.position[1] - 1.5}
          width="3"
          height="3"
          fill="#778d86"
        />
      ))}
      {map.objects
        .filter(
          (o) => o.kind === "npc" || o.kind === "teacher" || o.kind === "guide",
        )
        .map((n) => (
          <path
            key={n.id}
            d={`M${n.position[0]} ${n.position[1] - 2}l-1.8 3h3.6Z`}
            fill="#9c799e"
            stroke="#fff"
            strokeWidth=".35"
          />
        ))}
      {objective && (
        <circle
          cx={objective.position[0]}
          cy={objective.position[1]}
          r="2.7"
          fill="#ffe280"
          stroke="#967235"
          strokeWidth=".6"
        />
      )}
      <circle
        cx={position[0]}
        cy={position[1]}
        r="1.9"
        fill="#224d43"
        stroke="white"
        strokeWidth=".8"
      />
    </svg>
  );
}
