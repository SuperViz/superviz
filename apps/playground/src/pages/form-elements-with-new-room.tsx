import { useCallback, useEffect, useRef } from "react";
import { FormElements } from "@superviz/sdk";
import { createRoom, Room } from "@superviz/room";
import { getConfig } from "../config";
import { v4 as generateId } from "uuid";

import "../styles/form-elements.css";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

export function FormElementsWithNewRoom() {
  const input = useRef<FormElements>();
  const room = useRef<Room>();
  const loaded = useRef<boolean>(false);

  const initializeSuperViz = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;
    
    const uuid = generateId();

    room.current = await createRoom({
      developerToken: SUPERVIZ_KEY,
      roomId: `${SUPERVIZ_ROOM_PREFIX}-form-elements`,
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

    input.current = new FormElements({});

    room.current.addComponent(input.current);
  }, []);

  useEffect(() => {
    initializeSuperViz();

    return () => {
      room.current?.leave();
    };
  }, []);

  const toggleRegister = useCallback((id: string) => {
    const el = document.getElementById(id);
    let button = el?.nextElementSibling;
    if (button?.tagName !== "BUTTON") {
      button = button?.nextElementSibling;
    }

    const state = button?.getAttribute("data-field-state");

    if (state === "registered") {
      console.log("deregistering ", id);
      input.current?.deregisterField(id);
      button!.textContent = "Register";
      button?.setAttribute("data-field-state", "not-registered");
    }

    if (state === "not-registered") {
      console.log("registering ", id);
      input.current?.registerField(id);
      button!.textContent = "Deregister";
      button?.setAttribute("data-field-state", "registered");
    }
  }, []);

  const enableOutline = useCallback((id: string) => {
    input.current?.enableOutline(id);
  }, []);

  const disableOutline = useCallback((id: string) => {
    setTimeout(() => {
      input.current?.disableOutline(id);
    }, 5000);
  }, []);

  const enableSynch = useCallback((id: string) => {
    input.current?.enableRealtimeSync(id);
  }, []);

  const disableSynch = useCallback((id: string) => {
    input.current?.disableRealtimeSync(id);
  }, []);

  const subscribe = useCallback(() => {
    console.log("subscribing", input.current?.subscribe);
    input.current?.subscribe("field.content-change", (data: any) => {
      console.log("update:", data);
    });
    input.current?.subscribe("field.interaction", (data: any) => {
      console.log("typing", data);
    });
  }, []);

  const unsubscribe = useCallback(() => {
    console.log("unsubscribing");
    input.current?.unsubscribe(`field.input`);
  }, []);

  return (
    <main id="main" className="form-elements">
      <div>
        <h2>input without specified type</h2>
        <input id="input-without-specified-type" placeholder="teste" />
        <button
          data-field-state="registered"
          onClick={() => toggleRegister("input-without-specified-type")}
        >
          Deregister
        </button>
        <button onClick={() => enableOutline("input-without-specified-type")}>
          Enable Outline
        </button>
        <button onClick={() => disableOutline("input-without-specified-type")}>
          Disable Outline
        </button>
        <button onClick={() => enableSynch("input-without-specified-type")}>
          Enable Realtime Synch
        </button>
        <button onClick={() => disableSynch("input-without-specified-type")}>
          Disable Realtime Synch
        </button>
        <button onClick={subscribe}>Subscribe to input event</button>
        <button onClick={unsubscribe}>Unsubscribe to input event</button>
        <button
          onClick={() => input!.current!.sync("input-without-specified-type")}
        >
          Synch
        </button>
      </div>
      <div>
        <h2>input with type "text"</h2>
        <input id="input-with-type-text" placeholder="teste" type="email" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("input-with-type-text")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>invalid: input with type checkbox</h2>
        <input id="type-checkbox" type="checkbox" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-checkbox")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type radio</h2>
        <form>
          <input id="type-radio" name="same" type="radio" />
          <button
            data-field-state="not-registered"
            onClick={() => toggleRegister("type-radio")}
          >
            Register
          </button>
          <input type="radio" name="same" id="type-radio-2" />
          <button
            data-field-state="not-registered"
            onClick={() => toggleRegister("type-radio-2")}
          >
            Register
          </button>
        </form>
      </div>
      <div>
        <h2>input with type "email"</h2>
        <input id="input-with-type-email" placeholder="teste" type="email" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("input-with-type-email")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>textarea</h2>
        <textarea id="textarea" placeholder="teste" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("textarea")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type date</h2>
        <input id="type-date" type="date" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-date")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type color</h2>
        <input id="type-color" type="color" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-color")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type datetime-local</h2>
        <input id="type-datetime-local" type="datetime-local" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-datetime-local")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type month</h2>
        <input id="type-month" type="month" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-month")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type number</h2>
        <input id="type-number" type="number" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-number")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type password</h2>
        <input id="type-password" type="password" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-password")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type range</h2>
        <input id="type-range" type="range" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-range")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type search</h2>
        <input id="type-search" type="search" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-search")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type tel</h2>
        <input id="type-tel" type="tel" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-tel")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type time</h2>
        <input id="type-time" type="time" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-time")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type url</h2>
        <input id="type-url" type="url" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-url")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>input with type week</h2>
        <input id="type-week" type="week" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-week")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>invalid: div (we don't accept content-editable (yet))</h2>
        <div id="invalid-div" contentEditable suppressContentEditableWarning>
          this is a div
        </div>
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("invalid-div")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>invalid: input with type reset</h2>
        <input
          id="type-reset"
          type="reset"
          value="The value attribute only changes this label"
        />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-reset")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>invalid: input with type submit</h2>
        <input
          id="type-submit"
          type="submit"
          value="The value attribute only changes this label"
        />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-submit")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>
          invalid: input with type file (the value attribute is the path to the
          file, it doesn't make sense here, and may even be dangerous)
        </h2>
        <input id="type-file" type="file" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-file")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>
          invalid: input with type hidden (the value attribute usually won't be
          changed by the user)
        </h2>
        <input id="type-hidden" type="hidden" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-hidden")}
        >
          Register
        </button>
      </div>
      <div>
        <h2>
          invalid: input with type image (does not accept value attribute)
        </h2>
        <input id="type-image" type="image" />
        <button
          data-field-state="not-registered"
          onClick={() => toggleRegister("type-image")}
        >
          Register
        </button>
      </div>
    </main>
  );
}
