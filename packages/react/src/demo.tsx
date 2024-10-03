import './style.css';

import { SuperVizRoomProvider } from './contexts/room';

import * as Y from 'yjs';

import { useEffect, useMemo, useRef } from 'react';

import ReactQuill, { Quill } from 'react-quill-new';
import { QuillBinding } from 'y-quill';
import 'react-quill-new/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import { YjsProvider } from './components/yjs';
import { useYjsProvider } from './hooks/useYjsProvider';

Quill.register('modules/cursors', QuillCursors);

const providers: any[] = [];
export function Room() {
  const ydoc = useMemo(() => new Y.Doc(), []);
  const binded = useRef(false);

  const quillRef = useRef<ReactQuill | null>(null);
  const { provider } = useYjsProvider();

  // this effect manages the lifetime of the editor binding
  useEffect(() => {
    if (binded.current || !quillRef.current || !provider) return;
    binded.current = true;
    const binding = new QuillBinding(
      ydoc.getText('quill'),
      quillRef.current.getEditor(),
      provider.awareness,
    );

    return () => {
      // binding.destroy();
    };
  }, [ydoc, provider]);

  return (
    <div className="p-5 h-full bg-gray-200 flex flex-col gap-5">
      <div className="shadow-none h-[90%] overflow-auto rounded-sm">
        <YjsProvider doc={ydoc} />
        <div className="yRemoteSelectionHead"></div>
        <ReactQuill
          placeholder="// Connect to the room to start collaborating"
          ref={quillRef}
          theme="snow"
          modules={{
            cursors: true,
            toolbar: [
              [{ header: [1, 2, false] }],
              ['bold', 'italic', 'underline'],
              ['image', 'code-block'],
            ],
            history: {
              userOnly: true,
            },
          }}
        />{' '}
      </div>
    </div>
  );
}

export default function App() {
  const url = new URL(window.location.href);

  const key = import.meta.env.VITE_SUPERVIZ_DEVELOPER_TOKEN;
  const roomId = url.searchParams.get('roomId') || 'default-room-id';
  const random = Math.floor(Math.random() * 1000);

  return (
    <>
      <SuperVizRoomProvider
        developerKey={key}
        debug={true}
        group={{
          id: 'react-sdk-group',
          name: 'react sdk',
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
