# SuperViz Yjs Provider

SuperViz provides powerful SDKs and APIs that enable developers to easily integrate real-time features into web applications. Our platform accelerates development across various industries with robust, scalable infrastructure and a low-code approach.

The SuperVizYjsProvider component enables real-time collaboration and synchronization using Yjs, a library for building collaborative applications. It supports offline editing, real-time updates, and awareness for all participants within a shared room.

## Overview

The `SuperVizYjsProvider` component is a powerful tool for enabling real-time collaboration within shared rooms using Yjs, a state-of-the-art Conflict-free Replicated Data Type (CRDT) implementation. Yjs is a robust library designed for building collaborative applications that can handle concurrent edits seamlessly.

By leveraging Yjs's CRDT technology, the `SuperVizYjsProvider` ensures that all participants in a room can edit shared content simultaneously without conflicts. This component facilitates:

1. Offline editing: Users can make changes even when disconnected, with automatic synchronization upon reconnection.
2. Real-time updates: All participants see changes instantly as they occur.
3. Conflict resolution: The CRDT algorithm automatically merges concurrent edits without data loss.
4. Awareness: Participants can see each other's presence and actions within the shared document.

This integration brings the power of Yjs's distributed data structures to SuperViz, enabling highly responsive and reliable collaborative experiences across various types of content, from text documents to complex data structures.

## Quickstart

To add the SuperVizYjsProvider component to your application, follow these steps:

### JavaScript

1. **Before we start**: Initialize a room with a defined name and ID for the participant and the group.

2. **Install the package**:
   ```bash
   npm install --save @superviz/yjs yjs
   ```

3. **Import the necessary components**:
   ```javascript
   import { SuperVizYjsProvider } from "@superviz/yjs";
   import * as Y from "yjs";
   ```

4. **Initialize Yjs document**:
   ```javascript
   const doc = new Y.Doc();
   ```

5. **Add the SuperVizYjsProvider**:
   ```javascript
   const provider = new SuperVizYjsProvider(doc);
   room.addComponent(provider);
   ```

6. **Configure SuperVizYjsProvider (Optional)**:
   ```javascript
   const provider = new SuperVizYjsProvider(doc, { awareness: false });
   room.addComponent(provider);
   ```

### React

1. **Before we start**: Initialize a room and an editor such as Monaco or Quill.

2. **Install the package**:
   ```bash
   npm install --save @superviz/react-sdk yjs
   ```

3. **Import and add the YjsProvider component**:
   ```jsx
   import { YjsProvider } from "@superviz/react-sdk";
   import * as Y from "yjs";
   import { useEffect, useState } from "react";

   function CollaborativeEditor() {
     const [doc, setDoc] = useState(null);

     useEffect(() => {
       const yDoc = new Y.Doc();
       setDoc(yDoc);
     }, []);

     if (!doc) return null;

     return (
       <YjsProvider doc={doc}>
         {/* Your collaborative editor component */}
       </YjsProvider>
     );
   }

   export default CollaborativeEditor;
   ```

4. **Configure YjsProvider (Optional)**:
   ```jsx
   <YjsProvider doc={doc} awareness={false}>
     {/* Your collaborative editor component */}
   </YjsProvider>
   ```

5. **Using the useYjsProvider Hook**:
   ```jsx
   import { useYjsProvider } from "@superviz/react-sdk";

   function CollaborativeComponent() {
     const { 
       setLocalState, 
       setLocalStateField, 
       getStates, 
       getLocalState, 
       provider 
     } = useYjsProvider();

     // Use these methods as needed
   }
   ```

6. **Handling Events**:
   ```jsx
   <YjsProvider
     doc={doc}
     onMount={() => console.log("Component mounted")}
     onUnmount={() => console.log("Component unmounted")}
     onConnect={() => console.log("Connected to room")}
     onDisconnect={() => console.log("Disconnected from room")}
     onMessage={({ message, data }) => console.log("Received message", message, data)}
     onOutgoingMessage={({ message, data }) => console.log("Sending message", message, data)}
     onSync={() => console.log("Synced with latest updates")}
     onDestroy={() => console.log("Component destroyed")}
     onStateChange={(state) => console.log("Provider state changed", state)}
   >
     {/* Your collaborative editor component */}
   </YjsProvider>
   ```

For more information, please refer to the [Yjs Provider API Reference](https://docs.superviz.com/collaboration/api-reference/yjs).

## Contributing

To report a new bug, request a new feature, or if you need any help, you can [file an issue on GitHub](https://github.com/SuperViz/superviz/issues/new/choose). We have a few templates to help you out.

## License

SuperViz Yjs Provider is licensed under the [BSD 2-Clause License](LICENSE).