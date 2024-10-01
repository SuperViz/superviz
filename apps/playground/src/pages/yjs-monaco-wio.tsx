/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as generateId } from "uuid";

import { getConfig } from "../config";

import * as Y from "yjs";
import { SuperVizYjsProvider } from "@superviz/yjs";

import { MonacoBinding } from "y-monaco";
import "../styles/yjs.css";
import {
  Room,
  type LauncherFacade,
  type Participant,
  WhoIsOnline,
} from "../lib/sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "yjs-monaco-wio";

function setStyles(
  states: Map<number, Record<string, any>>,
  ids: Set<number>
): number[] {
  const stylesheet = document.getElementById("sv-yjs-monaco");
  let styles = "";

  const idsList = [];
  for (const [id, state] of states) {
    if (ids.has(id) || !state.participant) continue;
    idsList.push(id);

    styles += `
      .yRemoteSelection-${id},
      .yRemoteSelectionHead-${id}  {
        --presence-color: ${state.participant.slot.color};
        }
        
        .yRemoteSelectionHead-${id}:after {
          content: "${state.participant.name}";
          --sv-text-color: ${state.participant.slot.textColor};
      }
    `;
  }

  stylesheet!.innerText = styles;

  return idsList;
}

export function YjsMonacoWio() {
  const ydoc = useMemo(() => new Y.Doc(), []);

  const [editor, setEditor] = useState<any>(null);
  const [localParticipant, setLocalParticipant] =
    useState<Partial<Participant>>();
  const [ids, setIds] = useState(new Set<number>());
  const [joinedRoom, setJoinedRoom] = useState(false);

  const room = useRef<LauncherFacade>();
  const provider = useMemo<SuperVizYjsProvider>(
    () => new SuperVizYjsProvider(ydoc),
    [ydoc]
  );
  const wio = useRef<WhoIsOnline>();
  const loaded = useRef(false);

  const initializeSuperViz = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;

    const uuid = generateId();

    room.current = await Room(SUPERVIZ_KEY, {
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
      participant: {
        name: "Participant",
        id: uuid,
      },
      group: {
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      environment: "dev",
      debug: true,
    });

    wio.current = new WhoIsOnline();

    room.current.subscribe("participant.updated", (data) => {
      if (!data.slot?.index) return;

      provider.awareness?.setLocalStateField("participant", {
        id: data.id,
        slot: data.slot,
        name: data.name,
      });

      setLocalParticipant({
        id: data.id,
        slot: data.slot,
        name: data.name,
      });
    });

    const style = document.createElement("style");
    style.id = "sv-yjs-monaco";
    document.head.appendChild(style);
  }, [provider.awareness]);

  useEffect(() => {
    initializeSuperViz();

    return () => {
      room.current?.removeComponent(wio.current);
      room.current?.removeComponent(provider);
      room.current?.destroy();
    };
  }, [initializeSuperViz, provider]);

  const joinRoom = useCallback(() => {
    if (joinedRoom || !room.current) return;
    setJoinedRoom(true);

    if (localParticipant) {
      provider.awareness?.setLocalStateField("participant", localParticipant);
    }

    const updateStyles = () => {
      const states = provider.awareness?.getStates();
      const idsList = setStyles(states, ids);

      setIds(new Set(idsList));
    };

    provider.on("connect", updateStyles);
    provider.awareness?.on("update", updateStyles);

    room.current.addComponent(provider);
    room.current.addComponent(wio.current);
  }, [room, joinedRoom, setIds, ids, localParticipant, provider]);

  const leaveRoom = useCallback(() => {
    if (!joinedRoom || !room.current) return;
    setJoinedRoom(false);

    setIds(new Set());
    room.current.removeComponent(wio.current);
    room.current.removeComponent(provider);
  }, [room, joinedRoom, provider]);

  useEffect(() => {
    if (!provider || editor == null) return;

    const binding = new MonacoBinding(
      ydoc.getText("monaco"),
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    return () => {
      binding.destroy();
    };
  }, [ydoc, provider, editor]);

  return (
    <div className="p-5 h-full bg-gray-200 flex flex-col gap-5">
      <div className="flex items-center w-full justify-center gap-10">
        <button
          onClick={joinRoom}
          disabled={joinedRoom || !room}
          className="bg-sv-purple text-white h-10 px-4 rounded-md hover:bg-sv-primary-900 transition-all duration-300 disabled:bg-sv-primary-200 disabled:cursor-not-allowed"
        >
          Join room
        </button>
        <button
          onClick={leaveRoom}
          disabled={!joinedRoom || !room}
          className="text-sv-gray-400 border-sv-gray-400 border h-10 px-4 rounded-md hover:bg-sv-gray-400 hover:text-white transition-all duration-300 cursor-pointer disabled:bg-sv-gray-100 disabled:cursor-not-allowed disabled:text-sv-gray-400"
        >
          Leave room
        </button>
      </div>
      <div className="bg-[#1e1e1e] shadow-none h-[90%] overflow-auto rounded-sm">
        <div className="yRemoteSelectionHead"></div>
        <Editor
          defaultValue="// Connect to the room to start collaborating"
          defaultLanguage="typescript"
          onMount={(editor) => {
            setEditor(editor);
          }}
          options={{
            padding: {
              top: 32,
            },
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}
