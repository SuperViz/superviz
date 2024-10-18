<p align="center">
  <a href="https://superviz.com/" target="blank"><img src="https://avatars.githubusercontent.com/u/56120553?s=200&v=4" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <img alt="Discord" src="https://img.shields.io/discord/1171797567223378002">
  <img alt="GitHub Release" src="https://img.shields.io/github/v/release/superviz/sdk">
  <img alt="GitHub issues" src="https://img.shields.io/github/issues-raw/superviz/sdk">
  <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/superviz/sdk">
  <img alt="License" src="https://img.shields.io/github/license/superviz/sdk">
  <img alt="npm type definitions" src="https://img.shields.io/npm/types/@superviz/sdk">
  <img alt="Downloads" src="https://img.shields.io/npm/dw/@superviz/sdk">
</p>

SuperViz provides powerful SDKs and APIs that enable developers to easily integrate real-time features into web applications. Our platform accelerates development across various industries with robust, scalable infrastructure and a low-code approach. SuperViz SDK enables you to use one of our components:

- Contextual Comments
  - [Contextual Comments for HTML](https://docs.superviz.com/sdk/comments/html-adapter)
  - [Contextual Comments for Canvas element](https://docs.superviz.com/sdk/comments/canvas-adapter)
  - [Contextual Comments for Autodesk](https://docs.superviz.com/sdk/comments/autodesk-adpater)
  - [Contextual Comments for Matterport](https://docs.superviz.com/sdk/comments/matterport-adapter)
  - [Contextual Comments for ThreeJS](https://docs.superviz.com/sdk/comments/threejs-adapter)
- Presence
  - [Real-time Mouse Pointers](https://docs.superviz.com/sdk/presence/mouse-pointers)
  - [Real-time Data Engine](https://docs.superviz.com/sdk/presence/real-time-data-engine)
  - [Who-is-Online](https://docs.superviz.com/sdk/presence/who-is-online)
  - [Presence in Autodesk](https://docs.superviz.com/sdk/presence/AutodeskPresence)
  - [Presence in Matterport](https://docs.superviz.com/sdk/presence/MatterportPresence)
  - [Presence in ThreeJS](https://docs.superviz.com/sdk/presence/ThreeJsPresence)
- [Video Conference](https://docs.superviz.com/sdk/video/video-conference)
- [YJS Provider](https://docs.superviz.com/collaboration/api-reference/yjs)

You can also combine components to create a custom solution for your application.

How to start coding with SuperViz? After installing this package, you’ll need to [create an account](https://dashboard.superviz.com/) to retrieve a SuperViz Token and start coding.

## Quickstart

### 1. Installation

Install SuperViz SDK in your Node.js powered apps with the npm package:

```bash
npm install --save @superviz/sdk
```

Or, with yarn:

```bash
yarn add @superviz/sdk
```

### 2. Import the SDK

Once installed, import the SDK to your code:

```jsx
import SuperVizSdk from '@superviz/sdk';
```

### 3. Initialize the SDK

After importing the SDK, you can initialize passing your `DEVELOPER_KEY` as a parameter and the options object. You can see details for the options object on the [SDK Initialization page](https://docs.superviz.com/init/initialization).

The SuperViz SDK is your primary gateway to access all SDK features, offering the essential methods to add its components.

```jsx
async function initializeSuperVizSdk() {
  const sdk = await SuperVizSdk(DEVELOPER_KEY, {
    roomId: '<ROOM-ID>',
    group: {
      id: '<GROUP-ID>',
      name: '<GROUP-NAME>',
    },
    participant: {
      id: '<USER-ID>',
      name: '<USER-NAME>',
    },
  });

  return sdk;
}
```

If you are implementing the SuperViz SDK in a React application, check our [React SDK package](https://docs.superviz.com/react-sdk/initialization), which provides a set of hooks and components to make it easier to integrate SuperViz SDK into your React application.

## Documentation

You can find the complete documentation for every component and how to initialize them on the [SuperViz SDK Documentation page](https://docs.superviz.com/).

You can also find the complete changelog on the [Release Notes page](https://docs.superviz.com/releases).

## Contributing

If you are interested in contributing to SuperViz SDK, the best place to get involved with the community is through the [Discord server](https://discord.gg/weZ3Bfv6WZ), there you can find the latest news, ask questions, and share your experiences with SuperViz SDK.

## License

SuperViz SDK is licensed under the [BSD 2-Clause License](LICENSE).
