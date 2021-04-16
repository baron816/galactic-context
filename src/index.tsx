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

type SetterMap<T extends Record<string, any>> = {
  // @ts-ignore
  [P in keyof T as `useSet${Capitalize<P>}`]: () => Setter<T[P]>;
};

type GetterMap<T extends Record<string, any>> = {
  // @ts-ignore
  [P in keyof T as `use${Capitalize<P>}`]: () => T[P];
};

type HookMap<T> = {
  setters: SetterMap<T>;
  getters: GetterMap<T>;
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
  function createObservers() {
    return Object.entries(mapping).reduce((acc, [key, val]) => {
      acc[key as P] = new Observer(val);
      return acc;
    }, {} as ObserverMap<T>);
  }

  const StateContext = React.createContext<Context<T>>({
    observers: createObservers(),
  });

  function StateProvider({
    children,
    debug,
  }: {
    children: React.ReactElement | React.ReactElement[];
    debug?: string | ((key: string, newValue: any) => void);
  }) {
    const observers = React.useMemo(() => createObservers(), []);
    return (
      <StateContext.Provider value={{ observers, debug }}>
        {children}
      </StateContext.Provider>
    );
  }

  const getterHooks = Object.keys(mapping).reduce((acc, key: keyof T) => {
    const hookName = `use${upperFirst(key as string)}`;
    // @ts-ignore
    acc[hookName] = function useValue() {
      const { observers } = React.useContext(StateContext);
      const currentObserver = observers[key];
      const [state, setState] = React.useState(currentObserver.value);

      React.useLayoutEffect(() => {
        return currentObserver.subscribe(setState);
      }, [currentObserver]);

      return state;
    };

    return acc;
  }, {} as GetterMap<T>);

  const setterHooks = Object.keys(mapping).reduce((acc, key: keyof T) => {
    const hookName = `useSet${upperFirst(key as string)}`;
    // @ts-ignore
    acc[hookName] = function useSetter(): Setter<T[keyof T]> {
      const { observers, debug } = React.useContext(StateContext);
      const currentObserver = observers[key];

      return React.useCallback(
        (newVal: T[keyof T] | ((oldVal: T[keyof T]) => T[keyof T])) => {
          if (debug === "*") {
            console.log(key, newVal);
          } else if (isFunction(debug)) {
            debug(key as string, newVal);
          } else if (debug && new RegExp(debug, "g").test(key as string)) {
            console.trace(key, newVal);
          }
          // @ts-ignore
          currentObserver.update(newVal);
        },
        [currentObserver, debug]
      );
    };
    return acc;
  }, {} as SetterMap<T>);

  return {
    getters: getterHooks,
    setters: setterHooks,
    StateProvider,
    StateContext,
  };
}

function isFunction(val: any): val is Function {
  return typeof val === "function";
}
