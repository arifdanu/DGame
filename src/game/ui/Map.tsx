import { OBJECTS, ZONES } from "../data/world";
import type { Point } from "../data/types";
export function IslandMap({
  position,
  target,
  large = false,
}: {
  position: Point;
  target: string;
  large?: boolean;
}) {
  const objective = OBJECTS.find((o) => o.id === target)!;
  return (
    <svg
      viewBox="-34 -39 68 77"
      className={`island-map ${large ? "large" : ""}`}
      role="img"
      aria-label="Peta pulau. Titik gelap adalah posisimu, lingkaran kuning tujuan misi."
    >
      <rect x="-34" y="-39" width="68" height="77" rx="12" fill="#b4dedd" />
      <path d="M-9-35 0-43 8-35Z" fill="#759b88" />
      <text x="0" y="-29" textAnchor="middle" fontSize="3.5" fill="#385c50">
        U
      </text>
      <circle r="29" fill="#eddaaa" />
      <ellipse cx="-2" cy="-2" rx="24" ry="25" fill="#a6c88a" />
      <path
        d="M0 12V-8M0 6H-12M0 6 19 12M0-6-14-9M0-6 12-6M0 12-11 13"
        fill="none"
        stroke="#f4eacb"
        strokeWidth="2"
      />
      {ZONES.map((zone, i) => (
        <g key={zone.name}>
          <rect
            x={zone.position[0] - 2}
            y={zone.position[1] - 2}
            width="4"
            height="4"
            rx="1"
            fill={zone.color}
          />
          {large && (
            <text
              x={zone.position[0]}
              y={zone.position[1] + 5}
              textAnchor="middle"
              fontSize="3"
              fontWeight="700"
              fill="#284d40"
            >
              {i + 1}
            </text>
          )}
        </g>
      ))}
      <circle
        cx={objective.position[0]}
        cy={objective.position[1]}
        r="3"
        fill="#ffe280"
        stroke="#967235"
        strokeWidth=".6"
      />
      <circle
        cx={position[0]}
        cy={position[1]}
        r="2"
        fill="#224d43"
        stroke="white"
        strokeWidth=".9"
      />
    </svg>
  );
}
