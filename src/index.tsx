import * as React from "react";
import upperFirst from "lodash/upperFirst";

type Subscriber<T> = (val: T) => void;

class Observer<T> {
  subscribers: Set<Subscriber<T>>;
  value: T;

  constructor(val: T) {
    this.value = val;
    this.subscribers = new Set<Subscriber<T>>();
  }

  unsubscribe(fn: Subscriber<T>): () => void {
    return () => {
      this.subscribers.delete(fn);
    };
  }

  subscribe(fn: Subscriber<T>): () => void {
    this.subscribers.add(fn);
    return this.unsubscribe(fn);
  }

  update(value: T | ((oldValue: T) => T)): void {
    if (isFunction(value)) {
      const newVal = value(this.value);
      this.value = newVal;
    } else {
      this.value = value;
    }

    for (const sub of this.subscribers) {
      sub(this.value);
    }
  }
}

type Setter<T> = (newValue: T | ((oldValue: T) => T)) => void;
type Provider = (props: {
  children: React.ReactElement | React.ReactElement[];
  debug?: string | ((key: string, newValue: any) => void);
}) => React.ReactElement;
type Context<T> = {
  observers: ObserverMap<T>;
  debug?: string | ((key: string, newValue: any) => void);
};

type HookMap<T extends Record<string, any>> = {
  // @ts-ignore
  [P in keyof T as `use${Capitalize<P>}`]: () => [T[P], Setter<T[P]>];
};

type ObserverMap<T> = {
  [P in keyof T]: Observer<T[P]>;
};

export function createGalacticContext<
  T extends Record<string, any>,
  P extends keyof T
>(
  mapping: T
): HookMap<T> & {
  StateProvider: Provider;
  StateContext: React.Context<Context<T>>;
} {
  const StateContext = React.createContext<Context<T>>({
    observers: {} as ObserverMap<T>,
  });

  function StateProvider({
    children,
    debug,
  }: {
    children: React.ReactElement | React.ReactElement[];
    debug?: string | ((key: string, newValue: any) => void);
  }) {
    const observers = React.useMemo(() => {
      return Object.entries(mapping).reduce((acc, [key, val]) => {
        acc[key as P] = new Observer(val);
        return acc;
      }, {} as ObserverMap<T>);
    }, []);
    return (
      <StateContext.Provider value={{ observers, debug }}>
        {children}
      </StateContext.Provider>
    );
  }

  const hooks = Object.keys(mapping).reduce((acc, key) => {
    const hookName = `use${upperFirst(key)}`;
    // @ts-ignore
    acc[hookName] = () => {
      const { observers, debug } = React.useContext(StateContext);
      const currentObserver = observers[key];
      const [state, setState] = React.useState(currentObserver.value);

      if (currentObserver == null) {
        throw Error(
          `${hookName} must be used in a decendent of the StateProvider`
        );
      }

      React.useEffect(() => {
        return currentObserver.subscribe(setState);
      }, [currentObserver]);

      return React.useMemo(() => {
        function handleSet(newVal: T | ((oldVal: T) => T)) {
          if (debug === "*") {
            console.log(key, newVal);
          } else if (isFunction(debug)) {
            debug(key, newVal);
          } else if (debug && new RegExp(debug, "g").test(key)) {
            console.trace(key, newVal);
          }
          // @ts-ignore
          currentObserver.update(newVal);
        }
        return [state, handleSet];
      }, [state, currentObserver]);
    };
    return acc;
  }, {} as HookMap<T>);

  return { ...hooks, StateProvider, StateContext };
}

function isFunction(val: any): val is Function {
  return typeof val === "function";
}
