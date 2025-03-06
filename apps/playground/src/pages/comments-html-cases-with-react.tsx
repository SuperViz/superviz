import { Comments, HTMLPin } from "@superviz/collaboration";
import { v4 as generateId } from "uuid";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";
import ElementExample from "../components/ElementExample";

import "../styles/comments-html-cases.css";
import { RoomProvider, useRoom } from "@superviz/react";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "comments-html-cases-with-new-room";

interface Element {
  element: JSX.Element;
  name: string;
  props: any;
}

const liStyling = {
  margin: "8px 0",
  color: "#fff",
};

function Children() {
  const loaded = useRef<boolean>(false);
  const pin = useRef<HTMLPin>();
  const { joinRoom, leaveRoom, addComponent } = useRoom();

  const initializeSuperViz = useCallback(async () => {
    if (loaded.current) return;

    loaded.current = true;

    const uuid = generateId();

    await joinRoom({
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
      participant: {
        name: "Participant",
        id: uuid,
      },
      group: {
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      environment: "dev",
      debug: true,
    });

    pin.current = new HTMLPin("container", {
      dataAttributeName: "data-superviz-id",
    });

    const comments = new Comments(pin.current);

    addComponent(comments);
  }, []);

  useEffect(() => {
    initializeSuperViz();

    return () => {
      leaveRoom();
    };
  }, []);

  const elements: Element[] = [
    {
      element: <div />,
      name: "div",
      props: {
        style: {
          backgroundColor: "#7328c4",
          height: "100%",
          width: "80%",
          textAlign: "center",
          margin: "20px",
          color: "#fff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        children: "This is a div",
      },
    },
    {
      element: <svg />,
      name: "svg",
      props: {
        width: "100",
        height: "100",
        viewBox: "0 0 100 100",
        children: (
          <>
            <ellipse
              cx="120"
              cy="50"
              rx="80"
              ry="30"
              style={{ fill: "yellow" }}
              data-superviz-id="ciirjeifS"
              id="ellipse"
            />
            {/* <rect
              x="0"
              y="0"
              width="70"
              height="60"
              style={{ fill: 'blue' }}
              id="ellipse"
            /> */}
          </>
        ),
      },
    },
    {
      element: <a />,
      name: "a",
      props: {
        href: "https://www.superviz.com",
        target: "_blank",
        children:
          "This is an unecessarily long link to to https://superviz.com just for the sake of demonstration",
        style: {
          fontSize: "20px",
          textAlign: "center",
          backgroundColor: "#d25445",
          width: "80%",
          padding: "20px 10px",
          borderRadius: "5px",
          color: "#fff",
        },
      },
    },
    {
      element: <article />,
      name: "article",
      props: {
        style: {
          backgroundColor: "#7328c4",
          height: "100%",
          width: "80%",
          textAlign: "center",
          margin: "20px",
          color: "#fff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        },
      },
    },
    {
      element: <aside />,
      name: "aside",
      props: {
        style: {
          backgroundColor: "#7328c4",
          height: "100%",
          width: "80%",
          textAlign: "center",
          margin: "20px",
          color: "#fff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        role: "complementary",
        children: "This is a sidebar",
      },
    },
    {
      element: <blockquote />,
      name: "blockquote",
      props: {
        cite: "https://www.example.com",
        children:
          '"In the ethereal dance of destiny, where the stars themselves compose the cosmic symphony, we find the essence of our existence. Embrace the unknown, for in the labyrinth of uncertainty, we discover the mosaic of our own resilience. As the chapters of time unfold, let the pen of your heart script a narrative filled with courage, love, and the unwavering belief that every sunrise heralds a new chapter in the epic tale of our extraordinary existence."',
        style: {
          backgroundColor: "#34a986",
          padding: "20px",
          borderRadius: "5px",
          width: "80%",
          textAlign: "center",
          color: "#fff",
        },
      },
    },
    {
      element: <button />,
      name: "button",
      props: {
        onClick: () => alert("Button clicked!"),
        children: "Click me, I am a very big button",
        style: {
          all: "unset",
          padding: "20px",
          fontSize: "24px",
          cursor: "pointer",
          backgroundColor: "#eee",
          border: "1px solid #000",
          width: "60%",
        },
      },
    },
    {
      element: <canvas />,
      name: "canvas",
      props: {
        style: {
          border: "1px solid #000",
          backgroundColor: "#d99898",
        },
      },
    },
    {
      element: <dialog />,
      name: "dialog",
      props: {
        open: true,
        children: "This is a dialog",
        style: {
          backgroundColor: "#7328c4",
          padding: "20px",
          borderRadius: "5px",
          color: "#fff",
          top: "70%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        },
      },
    },
    {
      element: <embed />,
      name: "embed",
      props: {
        src: "src/assets/cat.jpg",
        type: "image/jpg",
        style: {
          width: "min(90%, 400px)",
          height: "auto",
        },
      },
    },
    {
      element: <footer />,
      name: "footer",
      props: {
        style: {
          backgroundColor: "#7328c4",
          height: "100%",
          width: "80%",
          textAlign: "center",
          margin: "20px",
          color: "#fff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        children: "This is the footer",
      },
    },
    {
      element: <form />,
      name: "form",
      props: {
        onSubmit: (e: React.FormEvent) => {
          e.preventDefault();
          alert("Form submitted!");
        },
        children: "Form content goes here",
        style: {
          backgroundColor: "#7328c4",
          height: "100%",
          width: "80%",
          textAlign: "center",
          margin: "20px",
          color: "#fff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    },
    {
      element: <h1 />,
      name: "h1",
      props: {
        style: {
          color: "blue",
          textAlign: "center",
        },
        children: "Big Heading 1",
      },
    },
    {
      element: <h2 />,
      name: "h2",
      props: {
        style: {
          color: "blue",
          textAlign: "center",
        },
        children: "Less big Heading 2",
      },
    },
    {
      element: <h3 />,
      name: "h3",
      props: {
        style: {
          color: "blue",
          textAlign: "center",
        },
        children: "Even less big Heading 3",
      },
    },
    {
      element: <h4 />,
      name: "h4",
      props: {
        style: {
          color: "blue",
          textAlign: "center",
        },
        children: "Somehow, even less big Heading 4",
      },
    },
    {
      element: <h5 />,
      name: "h5",
      props: {
        style: {
          color: "blue",
          textAlign: "center",
        },
        children:
          "How much less big can this be? And we are still at Heading 5",
      },
    },
    {
      element: <h6 />,
      name: "h6",
      props: {
        style: {
          color: "blue",
          textAlign: "center",
        },
        children:
          "Thats it. Heading 6 is the less big of them all, I guess. But it is still a heading, so its power shouldnt be underestimated.",
      },
    },
    {
      element: <iframe />,
      name: "iframe",
      props: {
        src: "https://www.youtube.com/embed/Y0buGn5iLuw",
        width: "300px",
        height: "300px",
        title: "The SuperViz SDK",
        frameBorder: "0",
        allow:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowFullScreen: true,
      },
    },
    {
      element: <img />,
      name: "img",
      props: {
        src: "https://t4.ftcdn.net/jpg/00/97/58/97/360_F_97589769_t45CqXyzjz0KXwoBZT9PRaWGHRk5hQqQ.jpg",
        alt: "Sample Image",
        style: {
          width: "min(80%, 350px)",
          height: "auto",
        },
      },
    },
    {
      element: <input />,
      name: "input",
      props: {
        type: "text",
        placeholder: "Enter text",
        style: {
          padding: "8px",
          fontSize: "14px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          outline: "none",
          margin: "8px 0",
        },
      },
    },
    {
      element: <main />,
      name: "main",
      props: {
        children: "Main content goes here",
        style: {
          backgroundColor: "#7328c4",
          height: "100%",
          width: "80%",
          textAlign: "center",
          margin: "20px",
          color: "#fff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    },
    {
      element: <meter />,
      name: "meter",
      props: {
        min: 0,
        max: 100,
        value: 50,
      },
    },
    {
      element: <nav />,
      name: "nav",
      props: {
        children: "Navigation links go here",
        style: {
          backgroundColor: "#7328c4",
          height: "100%",
          width: "80%",
          textAlign: "center",
          margin: "20px",
          color: "#fff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    },
    {
      element: <object />,
      name: "object",
      props: {
        data: "https://www.africau.edu/images/default/sample.pdf",
        type: "application/pdf",
        width: "90%",
        height: "300px",
      },
    },
    {
      element: <ol />,
      name: "ol",
      props: {
        children: [
          <li style={liStyling} key="1">
            Item 1
          </li>,
          <li style={liStyling} key="2">
            Item 2
          </li>,
          <li style={liStyling} key="3">
            Item 3
          </li>,
        ],
        style: {
          backgroundColor: "#34a986",
          padding: "20px",
          borderRadius: "5px",
          listStylePosition: "inside",
        },
      },
    },
    {
      element: <p />,
      name: "p",
      props: {
        style: {
          fontSize: "14px",
          fontWeight: "bold",
          textAlign: "justify",
          padding: "20px",
          backgroundColor: "#34a986",
          color: "#fff",
        },
        children:
          "Amidst the symphony of twilight, where shadows waltz with the last light of day, we find the poetry of resilience. In the garden of dreams, our aspirations bloom like stars, each one a wish waiting to be granted by the benevolent hand of time. Embrace the whispers of the wind, for they carry the secrets of forgotten tales and the promise of untold adventures. Life, an eloquent storyteller, weaves narratives of triumph and tribulation, inviting us to dance with the rhythm of our own existence. With every heartbeat, we author the saga of our journey, an epic tapestry painted with the hues of passion, purpose, and the indomitable spirit to chase the horizon of infinite possibilities.",
      },
    },
    {
      element: <section />,
      name: "section",
      props: {
        children: "Section content goes here",
        style: {
          backgroundColor: "#7328c4",
          height: "100%",
          width: "80%",
          textAlign: "center",
          margin: "20px",
          color: "#fff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    },
    {
      element: <select />,
      name: "select",
      props: {
        children: [
          <option key="option1" value="option1">
            Option 1
          </option>,
          <option key="option2" value="option2">
            Option 2
          </option>,
          <option key="option3" value="option3">
            Option 3
          </option>,
        ],
        style: {
          padding: "8px",
          fontSize: "14px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          outline: "none",
          margin: "8px 0",
        },
      },
    },
    {
      element: <span />,
      name: "span",
      props: {
        style: {
          backgroundColor: "#7328c4",
          height: "100%",
          width: "80%",
          textAlign: "center",
          margin: "20px",
          color: "#fff",
          fontSize: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        children: "This is a span element",
      },
    },
    {
      element: <table />,
      name: "table",
      props: {
        children: [
          <thead key="thead">
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
            </tr>
          </thead>,
          <tbody key="tbody">
            <tr>
              <td>Row 1, Cell 1</td>
              <td>Row 1, Cell 2</td>
            </tr>
            <tr>
              <td>Row 2, Cell 1</td>
              <td>Row 2, Cell 2</td>
            </tr>
          </tbody>,
        ],
        style: {
          backgroundColor: "#34a986",
          padding: "20px",
          borderRadius: "5px",
        },
      },
    },
    {
      element: <textarea />,
      name: "textarea",
      props: {
        value: "",
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
          console.log(e.target.value),
        placeholder: "Enter text",
        rows: 4,
        cols: 50,
      },
    },
    {
      element: <ul />,
      name: "ul",
      props: {
        children: [
          <li style={liStyling} key="1">
            Item 1
          </li>,
          <li style={liStyling} key="2">
            Item 2
          </li>,
          <li style={liStyling} key="3">
            Item 3
          </li>,
        ],
        style: {
          backgroundColor: "#34a986",
          padding: "20px",
          borderRadius: "5px",
          listStylePosition: "inside",
        },
      },
    },
    {
      element: <video />,
      name: "video",
      props: {
        controls: true,
        width: "100%",
        height: "80%",
        src: "src/assets/cat.mp4",
      },
    },
  ];

  return (
    <div className="examples" id="container">
      {elements.map((element, index) => (
        <ElementExample key={index} {...element} />
      ))}
    </div>
  );
}

export function CommentsHtmlCasesWithReact() {
  return (
    <RoomProvider developerToken={SUPERVIZ_KEY}>
      <Children />
    </RoomProvider>
  )
}
