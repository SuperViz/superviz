<p align="center">
  <a href="https://superviz.com/" target="blank"><img src="https://avatars.githubusercontent.com/u/56120553?s=200&v=4" width="120" alt="SuperViz Logo" /></a>
</p>

<p align="center">
  <img alt="Discord" src="https://img.shields.io/discord/1171797567223378002">
  <img alt="GitHub issues" src="https://img.shields.io/github/issues-raw/superviz/superviz">
  <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/superviz/superviz">
</p>

# SuperViz Real-time

SuperViz Real-time is a powerful package that enables real-time communication and collaboration in JavaScript-based applications. It provides a simple yet flexible API for creating channels, publishing events, and subscribing to real-time updates.

## Features

- Easy integration with JavaScript and Node.js projects
- Real-time communication between participants
- Flexible event publishing and subscription system
- Support for both package manager and CDN installation methods

## Installation

### Using a package manager


```bash
npm install --save @superviz/realtime
```

### Using CDN

Add the following script tag to your HTML file:

```html
<script type="module" src="https://unpkg.com/@superviz/realtime@latest/dist/browser/index.js"></script>
```



## Quick Start

### JavaScript


```javascript
import { Realtime } from '@superviz/realtime';

// Initialize Real-time
const realtime = new Realtime('DEVELOPER_KEY', {
  participant: {
    id: 'PARTICIPANT_ID',
  },
});

// Connect to a channel
const channel = await realtime.connect("my-channel");

// Publish an event
channel.publish("test", { message: "Hello, world!" });

// Subscribe to events
channel.subscribe("test", (event) => {
  console.log("Received test event:", event);
});
```

### Node.js

```javascript
import { Realtime } from '@superviz/realtime';

// Initialize Real-time
const realtime = new Realtime(
  {
    clientId: 'YOUR_CLIENT_ID',
    secret: 'YOUR_SECRET',
  },
  {
    participant: {
      id: 'PARTICIPANT_ID',
    },
  }
);

// Connect to a channel
const channel = await realtime.connect("my-channel");

// Publish an event
channel.publish("test", { message: "Hello, world!" });

// Subscribe to events
channel.subscribe("test", (event) => {
  console.log("Received test event:", event);
});
```


## Documentation

For more detailed information on how to use SuperViz Real-time, please refer to our [official documentation](https://docs.superviz.com/).

## Getting Started

To start using SuperViz Real-time, you'll need to [create an account](https://dashboard.superviz.com/) to retrieve your Developer Key or Client ID and Secret.

## Support

If you have any questions or need assistance, please join our [Discord community](https://discord.gg/weZ3Bfv6WZ) or open an issue on our [GitHub repository](https://github.com/superviz/superviz).

## License

SuperViz Real-Time is licensed under the [BSD 2-Clause License](LICENSE).