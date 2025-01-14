import { createBrowserRouter, RouteObject } from "react-router-dom";
import { Matterport } from "../pages/matterport.tsx";
import { MatterportWithVideoAndWio } from "../pages/matterport-with-video-and-wio.tsx";
import { MatterportWithVideo } from "../pages/matterport-with-video.tsx";
import App from "../App.tsx";
import { Blank } from "../pages/blank.tsx";
import { FormElementsCases } from "../pages/form-elements.tsx";
import { ThreeWithVideo } from "../pages/three-with-video.tsx";
import { AutodeskWithVideo } from "../pages/autodesk-with-video.tsx";
import { CommentsHtmlCases } from "../pages/comments-html-cases.tsx";
import { RealtimePresence } from "../pages/realtime-presence.tsx";
import { MatterportWithWio } from "../pages/matterport-with-wio.tsx";
import { MatterportWithWioAndComments } from "../pages/matterport-with-wio-and-comments.tsx";
import { MatterportWithWioCommentsAndVideo } from "../pages/matterport-with-wio-comments-and-video.tsx";
import { Video } from "../pages/video.tsx";
import { Three } from "../pages/three.tsx";
import { PointersCanvas } from "../pages/pointers-canvas.tsx";
import { YjsMonacoWio } from "../pages/yjs-monaco-wio.tsx";
import { YjsQuillWio } from "../pages/yjs-quill-wio.tsx";
import { YjsQuillReact } from "../pages/yjs-quill-react.tsx";
import { ReactFlowWithReactSDK } from "../pages/react-flow-with-react-sdk.tsx";
import { VideoWithReact } from "../pages/video-with-react.tsx";
import { MatterportEmbed } from "../pages/matterport-embed.tsx";
import { SuperVizRoom } from "../pages/superviz-room.tsx";
import { MatterportWithNewRoom } from "../pages/matterport-with-new-superviz-room.tsx";
import { ThreeWithNewRoom } from "../pages/three-with-new-room.jsx";
import { AutodeskWithNewRoom } from "../pages/autodesk-with-new-room.tsx";
import { WhoIsOnlineWithNewRoom } from "../pages/who-is-online-with-new-room.tsx";
import { FormElementsWithNewRoom } from "../pages/form-elements-with-new-room.tsx";
import { YjsQuillWioWithNewRoom } from "../pages/yjs-quill-wio-with-new-room.tsx";
import { MousePointersWithNewRoom } from "../pages/mouse-pointers-with-new-room.tsx";
import { MousePointersWithNewRoomHTML } from "../pages/mouse-pointers-with-new-room-html.tsx";
import { CommentsHtmlCasesWithNewRoom } from "../pages/comments-html-cases-with-new-room.tsx";

export const routeList: RouteObject[] = [
  {
    element: <App />,
    children: [
      {
        path: "/",
        element: <Blank />,
      },
      {
        path: "video",
        element: <Video />,
      },
      {
        path: 'video-with-react', 
        element: <VideoWithReact />
      },
      {
        path: "matterport",
        element: <Matterport />,
      },
      {
        path: "matterport-embed",
        element: <MatterportEmbed />,
      },
      {
        path: "matterport-with-video",
        element: <MatterportWithVideo />,
      },
      {
        path: "matterport-with-wio",
        element: <MatterportWithWio />,
      },
      {
        path: "matterport-with-video-and-wio",
        element: <MatterportWithVideoAndWio />,
      },
      {
        path: "matterport-with-wio-and-comments",
        element: <MatterportWithWioAndComments />,
      },
      {
        path: "matterport-with-wio-comments-and-video",
        element: <MatterportWithWioCommentsAndVideo />,
      },
      {
        path: "three",
        element: <Three />,
      },
      {
        path: "three-with-video",
        element: <ThreeWithVideo />,
      },
      {
        path: "autodesk-with-video",
        element: <AutodeskWithVideo />,
      },
      {
        path: "form-elements-cases",
        element: <FormElementsCases />,
      },
      {
        path: "comments-html-cases",
        element: <CommentsHtmlCases />,
      },
      {
        path: "realtime-presence",
        element: <RealtimePresence />,
      },
      {
        path: "pointers-canvas",
        element: <PointersCanvas />,
      },
      {
        path: "yjs-with-monaco",
        element: <YjsMonacoWio />,
      },
      {
        path: "yjs-with-quill",
        element: <YjsQuillWio />,
      },
      {
        path: "yjs-with-react",
        element: <YjsQuillReact />,
      },
      {
        path: "react-flow-with-react-sdk",
        element: <ReactFlowWithReactSDK />,
      },
      { 
        path: 'room', 
        element: <SuperVizRoom />
      },
      { 
        path: 'matterport-with-superviz-room', 
        element: <MatterportWithNewRoom />
      }, 
      {
        path: 'three-with-new-room',
        element: <ThreeWithNewRoom />
      }, 
      {
        path: 'autodesk-with-new-room',
        element: <AutodeskWithNewRoom />
      },
      {
        path: 'who-is-online-with-new-room',
        element: <WhoIsOnlineWithNewRoom />
      }, 
      { 
        path: 'form-elements-with-new-room',
        element: <FormElementsWithNewRoom /> 
      }, 
      { 
        path: 'yjs-with-quill-with-new-room',
        element: <YjsQuillWioWithNewRoom />
      }, 
      { 
        path: 'mouse-pointers-with-new-room',
        element: <MousePointersWithNewRoom  />
      }, 
      {
        path: 'mouse-pointers-with-new-room-html',
        element: <MousePointersWithNewRoomHTML />
      }, 
      {
        path: 'comments-html-cases-with-new-room', 
        element: <CommentsHtmlCasesWithNewRoom />
      }
    ],
  },
];

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter(routeList);
