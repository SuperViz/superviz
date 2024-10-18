<p align="center">
  <a href="https://superviz.com/" target="blank"><img src="https://avatars.githubusercontent.com/u/56120553?s=200&v=4" width="120" alt="SuperViz Logo" /></a>
</p>

<p align="center">
	<img alt="Discord" src="https://img.shields.io/discord/1171797567223378002">
	<img alt="GitHub issues" src="https://img.shields.io/github/issues-raw/superviz/sdk">
	<img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/superviz/sdk">
	<img alt="npm type definitions" src="https://img.shields.io/npm/types/@superviz/react-sdk">
	<img alt="Downloads" src="https://img.shields.io/npm/dw/@superviz/react-sdk">
</p>

SuperViz provides powerful SDKs and APIs that enable developers to easily integrate real-time features into web applications. Our platform accelerates development across various industries with robust, scalable infrastructure and a low-code approach. SuperViz SDK enables you to use one of our components:

- Contextual Comments
  - [Contextual Comments for HTML](https://docs.superviz.com/react-sdk/contextual-comments/HTML)
  - [Contextual Comments for Canvas element](https://docs.superviz.com/react-sdk/contextual-comments/canvas)
  - [Contextual Comments for Autodesk](https://docs.superviz.com/react-sdk/contextual-comments/autodesk)
  - [Contextual Comments for Matterport](https://docs.superviz.com/react-sdk/contextual-comments/matterport)
- Presence
  - [Real-time Mouse Pointers](https://docs.superviz.com/react-sdk/presence/mouse-pointers)
  - [Real-time Data Engine](https://docs.superviz.com/react-sdk/presence/real-time-data-engine)
  - [Who-is-Online](https://docs.superviz.com/react-sdk/presence/who-is-online)
  - [Presence in Autodesk](https://docs.superviz.com/react-sdk/presence/AutodeskPresence)
  - [Presence in Matterport](https://docs.superviz.com/react-sdk/presence/MatterportPresence)
  - [Presence in ThreeJS](https://docs.superviz.com/react-sdk/presence/ThreeJsPresence)
- [Video Conference](https://docs.superviz.com/react-sdk/video/video-conference)
- [YJS Provider](https://docs.superviz.com/collaboration/api-reference/superviz-sdk-react/yjs)

You can also combine components to create a custom solution for your application.

How to start coding with SuperViz? After installing this package, you’ll need to [create an account](https://dashboard.superviz.com/) to retrieve a SuperViz Token and start coding.

## Quickstart

### 1. Installation

Install SuperViz SDK in your React app with the npm package:

```bash
npm install --save @superviz/react-sdk
```

Or, with yarn:

```bash
yarn add @superviz/react-sdk
```

### 2. Import the SDK

Once installed, import the SDK to your code:

```jsx
import { SuperVizRoomProvider } from "@superviz/react-sdk";
```

### 3. Initialize the SDK

After importing the SDK, you can initialize our provider by passing your `DEVELOPER_KEY` and important information about the participant. You can see details for the options object on the [React Initialization page](https://docs.superviz.com/react-sdk/initialization).

The SuperVizRoomProvider is your primary gateway to access all SDK features, offering the essential methods to add its components.

```jsx
<SuperVizRoomProvider
  developerKey="DEVELOPER_KEY"
  group={{
    id: "<group-id>",
    name: "<group-name>",
  }}
  participant={{
    id: "<user-id>",
    name: "<user-name>",
  }}
  roomId="<room-id>"
>
  <h1>This is a room</h1>
</SuperVizRoomProvider>
```

## Documentation

You can find the complete documentation for every component and how to initialize them on the [SuperViz SDK Documentation page](https://docs.superviz.com/react-sdk/initialization).

You can also find the complete changelog on the [Release Notes page](https://docs.superviz.com/releases).

## Contributing

If you are interested in contributing to SuperViz SDK, the best place to get involved with the community is through the [Discord server](https://discord.gg/weZ3Bfv6WZ), there you can find the latest news, ask questions, and share your experiences with SuperViz SDK.

## License

SuperViz SDK is licensed under the [BSD 2-Clause License](LICENSE).