/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Y from "yjs";
import { SuperVizYjsProvider } from "@superviz/yjs";

import { MonacoBinding } from "y-monaco";
import "../styles/yjs.css";
import Room, { LauncherFacade, WhoIsOnline } from "@superviz/sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

const id = Math.floor(Math.random() * 1000000);
export function YjsWithMonaco() {
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState<any>(null);

  const provider = useRef<SuperVizYjsProvider>(new SuperVizYjsProvider(ydoc));
  const wio = useRef<WhoIsOnline>(new WhoIsOnline());

  const loaded = useRef(false);
  const [room, setRoom] = useState<LauncherFacade | null>(null);

  const [joinedRoom, setJoinedRoom] = useState(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    (async () => {
      if (room) return;

      setRoom(
        await Room("90xbxrp4tra3hrkbw5y1sq7sw5cj9v", {
          group: {
            id: "yjs-monaco",
            name: "Yjs Monaco",
          },
          participant: {
            id: `ian-yjs-${id}`,
            name: `Ian Yjs ${id}`,
          },
          roomId: "yjs-monaco",
          environment: "dev",
          debug: true,
        })
      );
    })();

    return () => {
      room?.destroy();
    };
  }, [room]);

  const joinRoom = useCallback(() => {
    if (joinedRoom || !room) return;
    setJoinedRoom(true);

    room.addComponent(provider.current);
    room.addComponent(wio.current);
  }, [room, joinedRoom]);

  const leaveRoom = useCallback(() => {
    if (!joinedRoom || !room) return;
    setJoinedRoom(false);

    room.removeComponent(wio.current);
    room.removeComponent(provider.current);
  }, [room, joinedRoom]);

  // this effect manages the lifetime of the editor binding
  useEffect(() => {
    if (!provider || editor == null) {
      return;
    }

    const binding = new MonacoBinding(
      ydoc.getText("monaco"),
      editor.getModel()!,
      new Set([editor]),
      provider.current.awareness
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
      <div className="bg-[#1e1e1e] shadow-none pt-8 h-[90%] overflow-auto rounded-sm">
        <Editor
          defaultValue="// some comment"
          defaultLanguage="typescript"
          onMount={(editor) => {
            setEditor(editor);
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}
