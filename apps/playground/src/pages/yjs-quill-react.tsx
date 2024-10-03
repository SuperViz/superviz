import "../styles/react-yjs.css";

import {
  SuperVizRoomProvider,
  useYjsProvider,
  YjsProvider,
} from "@superviz/react-sdk";

import * as Y from "yjs";

import { useEffect, useMemo, useRef } from "react";

import ReactQuill, { Quill } from "react-quill-new";
import { QuillBinding } from "y-quill";
import QuillCursors from "quill-cursors";

Quill.register("modules/cursors", QuillCursors);

function Room() {
  const ydoc = useMemo(() => new Y.Doc(), []);

  const quillRef = useRef<ReactQuill | null>(null);
  const { provider } = useYjsProvider();

  // this effect manages the lifetime of the editor binding
  useEffect(() => {
    if (!quillRef.current || !provider) return;

    const binding = new QuillBinding(
      ydoc.getText("quill"),
      quillRef.current.getEditor(),
      provider.awareness
    );

    return () => {
      binding.destroy();
    };
  }, [ydoc, provider]);

  return (
    <div className="p-5 h-full bg-gray-200 flex flex-col gap-5">
      <div className="shadow-none h-[90%] overflow-auto rounded-sm">
        <YjsProvider doc={ydoc} onMessage={() => console.log("message")} />
        <ReactQuill
          placeholder="// Connect to the room to start collaborating"
          ref={quillRef}
          theme="snow"
          modules={{
            cursors: true,
            toolbar: [
              [{ header: [1, 2, false] }],
              ["bold", "italic", "underline"],
              ["image", "code-block"],
            ],
            history: {
              userOnly: true,
            },
          }}
        />{" "}
      </div>
    </div>
  );
}

export function YjsQuillReact() {
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
