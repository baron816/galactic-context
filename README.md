# Galactic Context

<p align="center">
    <img alt="galaxy" src="https://astronomy.com/-/media/Images/andromeda.jpg?mw=600" />
</p>

Easy, efficient state management with React Context.

![NPM](https://img.shields.io/npm/l/galactic-context) ![npm](https://img.shields.io/npm/v/galactic-context) ![NPM](https://img.shields.io/bundlephobia/minzip/galactic-context)

## Install

`npm i galactic-context`

## Motivation

If you're using Context for "global" state, you run the risk of rerendering your entire app each time you update a value in a provider. This is because each Provider is a component, and when it rerenders, all of it's children will also rerender.

You can also have complications if you have Provider state values that depend on each other. No Provider can _easily_ access the Context values of it's children.

Context also has a lot of boilerplate that would be nice to reduce.

Galactic Context allows you to have a single "StateProvider" to store all of the values you would consider using "globally" across components in your app. It generates "value" and "setter" hooks for you, and when a "setter" hook gets called to update state, only the components consuming the "value" hooks will update (not your entire app).

## Usage

`createGalacticContext` receives a single argument--an object corresponding to key value pairs, for which the resulting object will return setter hooks and getter hooks. The getter hooks will be named as "usePropertyName" and "useSetPropertyName".

`createGalacContext` also includes the `StateProvider`, which will use to wrap your app.

```javascript
const {
  StateProvider,
  getters: { useCounter, useEmail },
  setters: { useSetCounter, useSetEmail },
} = createGalacticContext({
  counter: 0,
  email: "",
});

function App() {
  <StateProvider>
    <CounterComponent label="component 1" />
    <CounterComponent label="component 2" /> // Both CounterComponents will update
    when the setter for `useCounter` is called.
    <EmailComponent /> // EmailComponent WON'T rerender when the setter for
    `useCounter` is called. StateProvider won't cause rerenders at all.
  </StateProvider>;
}

function CounterComponent({ label }) {
  const counter = useCounter();
  const setCounter = useSetCounter();

  return (
    <div>
      <h1>{`${label}, ${counter}`}</h1>
      <button onClick={() => setCounter(counter + 1)}>Increment</button>
    </div>
  );
}

function EmailComponent() {
  const email = useEmail();
  const useSetEmail = useSetEmail();

  return <input onChange={(e) => setEmail(e.target.value)} value={email} />;
}
```

`createGalacticContext` will include `StateContext` in it's returned object, but it's unlikely you'll need it (you'd probably only want to use it in conjunction with RxJS). It includes the observers for all of the properties, the names of which match the object you passed to `createGalacticContext`.

### Debugger

`StateProvder` accepts an options `debug` param.

You can pass it:

1. `*` to `console.log` the key and new value of every setter that gets called.
2. A regular expression to `console.trace` each setter call (good for tracking where state is being set from).
3. A function that receives the key and new value of the setter.

```javascript
return (
  <StateProvider
    debug={(key, newValue) => {
      if (key === "counter") {
        debugger;
      }
    }}
  >
    <App />
  </StateProvider>
);
```
