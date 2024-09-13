import { useRef, useState } from "react";

interface ElementExampleProps {
  element: JSX.Element;
  name: string;
  props: any;
}

export default function ElementExample({
  element,
  name,
  props,
}: ElementExampleProps) {
  const elementRef = useRef<HTMLElement>(null);
  const [hasAttribute, setHasAttribute] = useState(true);

  const toggleDataAttribute = () => {
    if (elementRef.current?.toggleAttribute("data-superviz-id")) {
      elementRef.current?.setAttribute("data-superviz-id", `${name}-example`);
      setHasAttribute(true);
      return;
    }

    setHasAttribute(false);
  };

  if (name === "svg") {
    return (
      <div className="element-example" id={name}>
        <h1>{`<${name}>`}</h1>
        <button
          type="button"
          className="toggle-button"
          onClick={toggleDataAttribute}
        >
          {hasAttribute ? "Remove" : "Add"} data attribute
        </button>
        <element.type {...props} ref={elementRef} />
      </div>
    );
  }

  return (
    <div className="element-example" /* id={name} */>
      <h1>{`<${name}>`}</h1>
      <button
        type="button"
        className="toggle-button"
        onClick={toggleDataAttribute}
      >
        {hasAttribute ? "Remove" : "Add"} data attribute
      </button>
      <element.type
        {...props}
        ref={elementRef}
        id={name}
        data-superviz-id={`${name}-example`}
      />
    </div>
  );
}
