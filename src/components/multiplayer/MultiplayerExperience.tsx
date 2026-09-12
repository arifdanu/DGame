import { useState } from "react";
import { useMultiplayerRoom } from "../../multiplayer/useMultiplayerRoom";
import type { RoomRequest, SessionOptions } from "../../multiplayer/types";
import { MultiplayerMenu } from "./MultiplayerMenu";
import { RoomLobby } from "./RoomLobby";
import { MultiplayerGame } from "./MultiplayerGame";
import "./multiplayer.css";
export default function MultiplayerExperience({
  defaults,
  solo,
}: {
  defaults: SessionOptions;
  solo: () => void;
}) {
  const { state, service } = useMultiplayerRoom(),
    [playing, setPlaying] = useState(false);
  const leave = () => {
    void service.leave();
    setPlaying(false);
    solo();
  };
  const submit = (request: RoomRequest) => {
    setPlaying(false);
    void service.begin(request);
  };
  const retry = () => {
    setPlaying(false);
    service.retry();
  };
  return state.room && state.self ? (
    playing ? (
      <MultiplayerGame
        key={state.room.roomId}
        state={state}
        service={service}
        leave={leave}
        retry={retry}
      />
    ) : (
      <RoomLobby
        state={state}
        start={() => setPlaying(true)}
        leave={leave}
        retry={retry}
      />
    )
  ) : (
    <MultiplayerMenu
      state={state}
      defaults={defaults}
      submit={submit}
      retry={retry}
      solo={leave}
    />
  );
}
