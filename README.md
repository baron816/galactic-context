# Galactic Context

<p align="center">
    <img alt="galaxy" src="https://astronomy.com/-/media/Images/andromeda.jpg?mw=600" />
</p>

Easy, efficient state management with React Context.

![NPM](https://img.shields.io/npm/l/galactic-context) ![npm](https://img.shields.io/npm/v/galactic-context) ![NPM](https://img.shields.io/bundlephobia/minzip/galactic-context)

## Install

`npm i galactic-context`

## Usage

`createGalacticContext` receives a single argument, an object corresponding to key value pairs, for which the keys will be converted to hooks that function like `useState`, and the values will be the initial default values. It will return an object with a `StateProvider`, a `StateContext`, and hooks for all of the properties in the object you passed in.

```javascript
const { StateProvider, useCounter, useEmail } = createGalacticContext({
  counter: 0,
  email: '',
});

function App() {
  <StateProvider>
    <CounterComponent label="component 1" />
    <CounterComponent label="component 2" /> // Both CounterComponents will update when the setter for `useCounter` is called.
    <EmailComponent /> // EmailComponent WON'T rerender when the setter for `useCounter` is called. StateProvider won't cause rerenders at all.
  </StateProvider>
}

function CounterComponent({ label }) {
  const [counter, setCounter] = useCounter();

  return (
    <div>
      <h1>{`${label}, ${counter}`}</h1>
      <button onClick={() => setCounter(counter + 1)}>Increment</button>
    </div>
  );
}

function EmailComponent() {
  const [email, setEmail] = useEmail();

  return (
    <input onChange={e => setEmail(e.target.value)} value={email} />
  )
}

```

`createGalacticContext` creates observers for each property in the object you pass to it. It also creates hooks for each property name with the structure `propertyName` -> `usePropertyName` (`use` is prepended, and the first character is capitalized). That hook will listen for state changes on the observer and set state at the component level. That means the provider won't update itself, and won't rerender the entire app if it's wrapping everything. Only the components that use hooks that update will rerender (plus their descendants).

`createGalacticContext` will include `StateContext` in it's returned object, but it's unlikely you'll need it (you'd probably only want to use it in conjunction with RxJS). It includes the observers for all of the properties, the names of which match the object you passed to `createGalacticContext`.

### Debugger

`StateProvder` accepts an options `debug` param.

You can pass it:

1) `*` to `console.log` the key and new value of every setter that gets called.
2) A regular expression to `console.trace` each setter call (good for tracking where state is being set from).
3) A function that receives the key and new value of the setter.

```javascript
return (
  <StateProvider debug={(key, newValue) => {
    if (key === 'counter') {
      debugger;
    }
  }}>
    <App />
  </StateProvider>
)
```

### Privatize

It's possible that you'll want to prevent your components from being able to set a particular state value (perhaps it's reserved for a single place). You can use `privatize` to create a hook that will only return the value and not include the setter.

```javascript
import { privatize } from 'galactic-context';

...

const useServiceLevel = privatize(useServiceLevelWithSetter);

function MyComponent() {
  const serviceLevel = useServiceLevel();

  ...
}

```
