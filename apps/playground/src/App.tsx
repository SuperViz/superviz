import React from "react";
import { routeList } from "./router/router";
import { Outlet, useNavigate } from "react-router-dom";

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => (
  <button
    ref={ref}
    className={`w-full py-2 px-4 bg-purple-500 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 ${
      className || ""
    }`}
    {...props}
  >
    {children}
  </button>
));

function App() {
  const navigate = useNavigate();

  return (
    <main className="w-full h-full bg-purple-50 overflow-hidden flex">
      <aside className="w-1/6 min-w-[200px] max-w-[400px] h-full overflow-auto bg-purple-200 flex flex-col gap-2 p-2">
        {routeList.map((route) => {
          if (!route.children) {
            return (
              <Button
                key={route.path}
                onClick={() => navigate(route.path as string)}
              >
                {" "}
                {route.path}{" "}
              </Button>
            );
          }

          return route.children.map((children, index) => {
            return (
              <Button
                key={route.path ?? "" + index}
                onClick={() => navigate(children.path as string)}
              >
                {" "}
                {children.path}{" "}
              </Button>
            );
          });
        })}
      </aside>
      <section className="flex-1">
        <Outlet />
      </section>
    </main>
  );
}

export default App;
