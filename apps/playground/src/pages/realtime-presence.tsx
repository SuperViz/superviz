import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";
import {
  Channel,
  PresenceEvent,
  PresenceEvents,
  Realtime,
} from "../lib/realtime";

import "../styles/realtime-presence.css";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");

const names = [
  "John Doe",
  "Keith Smith",
  "Ryan Brandon",
  "Emily Johnson",
  "Sophia Brown",
  "Liam Davis",
  "Olivia Wilson",
  "Noah Taylor",
  "Isabella Martinez",
  "Mason Anderson",
  "Ava Thompson",
  "Lucas White",
  "Mia Harris",
  "Ethan Clark",
  "Amelia Lewis",
  "James Walker",
  "Charlotte Robinson",
  "Alexander Young",
  "Harper King",
  "Benjamin Wright",
  "Evelyn Scott",
  "Henry Green",
  "Abigail Adams",
  "Elijah Baker",
  "Emily Perez",
  "Daniel Hall",
  "Aria Gonzalez",
  "Sebastian Nelson",
  "Lily Carter",
  "Matthew Mitchell",
  "Zoe Lee",
  "Joseph Perez",
  "Grace Collins",
  "David Campbell",
  "Victoria Parker",
  "Samuel Sanchez",
  "Aubrey Evans",
  "Logan Edwards",
  "Hannah Brooks",
  "Christopher Flores",
  "Ella Morris",
  "Gabriel Rivera",
  "Scarlett Foster",
  "Jackson Cook",
  "Penelope Richardson",
  "Carter Powell",
  "Chloe Hughes",
  "Luke Long",
  "Avery Howard",
  "Wyatt Ward",
  "Madison Rogers",
  "Dylan Brooks",
  "Layla Scott",
  "Nathan Reed",
  "Lillian Butler",
  "Caleb Morgan",
  "Stella Bailey",
  "Jacob Bell",
  "Nora Cooper",
  "Owen Barnes",
  "Paisley Sanders",
  "Isaac Lee",
  "Ellie Kelly",
  "Hunter Gray",
  "Hazel Richardson",
  "Andrew Torres",
  "Riley Price",
  "Eli Bennett",
  "Violet Coleman",
  "Connor Russell",
  "Aubree Ross",
  "Dominic Henderson",
  "Aurora Jenkins",
  "Aaron Perry",
  "Addison Peterson",
  "Julian Simmons",
  "Elliana Myers",
  "Levi Foster",
  "Lucy Cook",
  "Christian Kelly",
  "Mila Brooks",
  "Jeremiah Stewart",
  "Savannah Bennett",
  "Hudson Fisher",
  "Sadie Ellis",
  "Robert Howard",
  "Alexa Graham",
  "Easton Young",
  "Bella Baker",
  "Nolan Adams",
  "Peyton Barnes",
  "Ian Foster",
  "Clara Allen",
  "Jonathan Murphy",
  "Eliana Butler",
  "Adrian Cox",
  "Madelyn Diaz",
  "Jordan Perez",
  "Eva Long",
  "Thomas Hughes",
  "Lydia Garcia",
  "Jaxon Carter",
  "Elise Gray",
  "Blake Reed",
  "Luna Howard",
  "Adam Griffin",
  "Aurora Turner",
];

export function RealtimePresence() {
  const loaded = useRef<boolean>(false);
  const realtime = useRef<Realtime>();
  const channel = useRef<Channel>();
  const hated = useRef<HTMLInputElement>(null);
  const favorite = useRef<HTMLInputElement>(null);

  const initializeSuperViz = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;

    const name = names[Math.floor(Math.random() * names.length)];

    realtime.current = new Realtime(SUPERVIZ_KEY, {
      participant: {
        id: name.replace(" ", "-").toLowerCase(),
        name: name,
      },
      environment: "dev",
      debug: true,
    });

    channel.current = await realtime.current.connect("new-channel");
  }, []);

  useEffect(() => {
    initializeSuperViz();

    return () => {
      channel.current?.disconnect();
      realtime.current?.destroy();
    };
  }, [initializeSuperViz]);

  const callback = useCallback((event: PresenceEvent) => {
    console.log("presence.update:", event);
  }, []);

  const subscribeToPresenceUpdate = () => {
    channel.current!.participant.subscribe(PresenceEvents.UPDATE, callback);
  };

  const publishEvent = () => {
    channel.current!.participant.update({
      mostHatedCandy: hated.current!.value,
      favoriteCandy: favorite.current!.value,
    });
  };

  const unsubscribeFromEvent = () => {
    channel.current!.participant.unsubscribe("presence.update");
  };

  const getAllPresences = async () => {
    console.log(await channel.current!.participant.getAll());
  };

  const publishTest = () => {
    channel.current?.publish("test", { message: "Hello, world!" });
  };

  const subscribeToTest = () => {
    channel.current?.subscribe("test", (event) => {
      console.log("test:", event);
    });
  };

  const subscribeToJoin = () => {
    channel.current?.subscribe("join", (event) => {
      console.log("join:", event);
    });
  };

  const subscribeToLeave = () => {
    channel.current?.subscribe("d", (event) => {
      console.log("leave:", event);
    });
  };

  return (
    <section className="realtime-presence">
      <div className="events-info">
        <div className="container">
          <h2>Subscription Manager</h2>
          <button onClick={subscribeToPresenceUpdate}>
            Subscribe to presence.update
          </button>
        </div>
      </div>

      <hr />

      <div className="container">
        <h2>Publishing events</h2>
        <div className="subscribe-options">
          <input placeholder="Most hated candy" ref={hated} />
          <input placeholder="Favorite candy" ref={favorite} />
          <button onClick={publishEvent}>Publish to presence.update</button>
        </div>
      </div>

      <div className="container">
        <h2>Unsubscribe from</h2>
        <div className="subscribe-options">
          <button onClick={unsubscribeFromEvent}>
            Unsubscribe from presence.update
          </button>
        </div>
      </div>

      <div className="container">
        <h2>Get all presences</h2>
        <button onClick={getAllPresences}>Get all presences in channel</button>
      </div>

      <div className="container">
        <h2>Publish 'test' event to room</h2>
        <button onClick={publishTest}>Publish</button>
      </div>

      <div className="container">
        <h2>Subscribe to 'test' event</h2>
        <button onClick={subscribeToTest}>Subscribe</button>
      </div>

      <div className="container">
        <h2>Subscribe to 'join' event</h2>
        <button onClick={subscribeToJoin}>Subscribe</button>
      </div>

      <div className="container">
        <h2>Subscribe to 'leave' event</h2>
        <button onClick={subscribeToLeave}>Subscribe</button>
      </div>
    </section>
  );
}
