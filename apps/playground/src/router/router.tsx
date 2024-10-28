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
import { VideoMeetingPage } from "../pages/video-meeting.tsx";

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
        path: "video-meeting",
        element: <VideoMeetingPage />,
      },
      {
        path: "matterport",
        element: <Matterport />,
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
    ],
  },
];

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter(routeList);
