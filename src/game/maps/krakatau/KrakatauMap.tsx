import { memo } from "react";
import { Scenery } from "../../world/Scenery";
import { krakatauData as map } from "./krakatauData";
import {
  BoundaryMarkers,
  Landmark,
  WorldPaths,
  WorldTrees,
} from "../../world/WorldAssets";
export const KrakatauMap = memo(function KrakatauMap({
  preview,
  paused,
}: {
  preview: boolean;
  paused: boolean;
}) {
  return (
    <>
      <Scenery preview={preview} paused={paused} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.06, 0]}
        receiveShadow
      >
        <ringGeometry args={[27.7, map.radius, 64]} />
        <meshStandardMaterial color="#b5cf85" />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.11, 0]}
        receiveShadow
      >
        <ringGeometry args={[map.radius, map.radius + 2, 64]} />
        <meshStandardMaterial color="#ecdbb0" />
      </mesh>
      <mesh position={[-13, 1.5, -30]} receiveShadow>
        <coneGeometry args={[8, 3, 48]} />
        <meshStandardMaterial color="#a9c17f" />
      </mesh>
      <WorldPaths map={map} />
      <WorldTrees map={map} />
      <BoundaryMarkers map={map} />
      {map.landmarks.map((l) => (
        <Landmark key={l.id} data={l} map={map} />
      ))}
    </>
  );
});
