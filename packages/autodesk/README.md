<p align="center">
  <a href="https://superviz.com/" target="blank"><img src="https://avatars.githubusercontent.com/u/56120553?s=200&v=4" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
<img alt="npm type definitions" src="https://img.shields.io/npm/types/@superviz/autodesk-viewer-plugin">
<img alt="npm" src="https://img.shields.io/npm/dw/@superviz/autodesk-viewer-plugin">
</p>

# SuperViz Autodesk viewer SDK plugin

SuperViz provides a suite of programmable low-code Collaboration and Communication components, all synchronized with an advanced Real-time Data Engine, enabling real-time and asynchronous collaboration and communication within any JavaScript based application.

The SuperViz Autodesk Plugin, when integrated, connects a Autodesk scene to the SuperViz SDK, [allowing avatars](https://docs.superviz.com/init/initialization#avatar), [pinned comments](https://docs.superviz.com/components/contextual-comments/contextual-comments-for-autodesk), and other [collaborative features](https://docs.superviz.com/components/presence/presence3d/AutodeskPresence) within the 3D environment for a shared participant experience.

Note: to use this package, you must also have the following minimum versions:

- SuperViz SDK, minimum version 5.0.0
- Autodesk Viewer, minimum version 7.0.0

## Getting started

### 1. Installing SuperViz Autodesk extension

The Presence3D component is not available from the `@superviz/sdk` package, instead, to use Presence 3D you must use the `@superviz/autodesk-plugin` package.

To install the `@superviz/autodesk-viewer-plugin` package with npm, run the following command:

```bash
npm install --save @superviz/autodesk-viewer-plugin
```

Or with Yarn:

```bash
yarn add @superviz/autodesk-viewer-plugin
```

### 2. Adding Autodesk to SuperViz SDK

To add an Autodesk Presence3D component, you can use the following code:

```jsx
import { Presence3D } from '@superviz/autodesk-viewer-plugin';

Autodesk.Viewing.Initializer(options, async () => {
  const viewerDiv = document.getElementById('forge-viewer');
  const viewer = new Autodesk.Viewing.GuiViewer3D(viewerDiv);

  await viewer.start();

  const autodeskPresence = new Presence3D(viewer, {
    isAvatarsEnabled: true,
    isLaserEnabled: true,
    isNameEnabled: true,
    avatarConfig: {
      height: 0,
      scale: 1,
      laserOrigin: { x: 0, y: 0, z: 0 },
    },
  });

  sdk.addComponent(autodeskPresence);
});
```

Please check the documentation for more information about the [Presence3D component](https://docs.superviz.com/components/presence/presence3d/AutodeskPresence).

## Contributing

### Issues

To report a new bug, request a new feature, or if you need any help, you can [file an issue on GitHub](https://github.com/SuperViz/sdk/issues/new/choose). We have a few templates to help you out.

## License

SuperViz SDK is licensed under the [BSD 2-Clause License](https://github.com/SuperViz/sdk/blob/main/LICENSE).
