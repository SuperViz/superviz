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
import { YjsWithMonaco } from "../pages/yjs-monaco-wio.tsx";

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
        element: <YjsWithMonaco />,
      },
    ],
  },
];

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter(routeList);
