import "../styles/react-yjs.css";

import {
  SuperVizRoomProvider,
  VideoConference,
} from "@superviz/react-sdk";
import { ParticipantType } from "@superviz/sdk";
import { useSearchParams } from "react-router-dom";


function Room() {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("userType") as ParticipantType) || ParticipantType.HOST;

  return (
    <div className="p-5 h-full bg-gray-200 flex flex-col gap-5">
      <div className="shadow-none h-[90%] overflow-auto rounded-sm">\
        test
        <VideoConference participantType={type} onHostChange={(host) => { console.log(host) }} /> 
      </div>
    </div>
  );
}

export function VideoWithReact() {
  const url = new URL(window.location.href);

  const key = import.meta.env.VITE_SUPERVIZ_DEVELOPER_TOKEN;
  const roomId = url.searchParams.get("roomId") || "default-room-id";
  const random = Math.floor(Math.random() * 1000);

  return (
    <>
      <SuperVizRoomProvider
        developerKey={key}
        debug={true}
        group={{
          id: "react-sdk-group",
          name: "react sdk",
        }}
        participant={{
          id: random.toString(),
          name: random.toString(),
        }}
        environment="dev"
        roomId={roomId}
      >
        <Room />
      </SuperVizRoomProvider>
    </>
  );
}
