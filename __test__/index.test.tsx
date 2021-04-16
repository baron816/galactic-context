import React from "react";
import { createGalacticContext } from "../src";
import { act, renderHook } from "@testing-library/react-hooks";

describe("createGalactiContext", () => {
  test("simple usage", () => {
    const {
      StateProvider,
      getters: { useCounter },
      setters: { useSetCounter },
    } = createGalacticContext({
      counter: 0,
    });
    const wrapper = ({ children }) => <StateProvider>{children}</StateProvider>;
    const { result } = renderHook(
      () => ({ counter: useCounter(), setCounter: useSetCounter() }),
      {
        wrapper,
      }
    );

    act(() => {
      result.current.setCounter(29);
    });

    expect(result.current.counter).toBe(29);
  });

  test("multi-set", () => {
    const {
      StateProvider,
      getters: { useCounter },
      setters: { useSetCounter },
    } = createGalacticContext({
      counter: 0,
    });
    const wrapper = ({ children }) => <StateProvider>{children}</StateProvider>;
    const { result } = renderHook(
      () => ({ counter: useCounter(), setCounter: useSetCounter() }),
      {
        wrapper,
      }
    );

    act(() => {
      result.current.setCounter(22);
      result.current.setCounter(23);
    });

    expect(result.current.counter).toBe(23);
  });

  test("setting from cb", () => {
    const {
      StateProvider,
      getters: { useCounter },
      setters: { useSetCounter },
    } = createGalacticContext({
      counter: 15,
    });
    const wrapper = ({ children }) => <StateProvider>{children}</StateProvider>;

    const { result } = renderHook(
      () => ({ counter: useCounter(), setCounter: useSetCounter() }),
      {
        wrapper,
      }
    );

    act(() => {
      result.current.setCounter((prevVal) => prevVal + 1);
      result.current.setCounter((prevVal) => prevVal + 1);
    });

    expect(result.current.counter).toBe(17);
  });

  test("multiple hooks", () => {
    const {
      StateProvider,
      getters: { useCounter, useName, usePassword },
      setters: { useSetCounter, useSetName, useSetPassword },
    } = createGalacticContext({
      counter: 15,
      name: "",
      password: null as string | null,
    });
    const wrapper = ({ children }) => <StateProvider>{children}</StateProvider>;

    const { result } = renderHook(
      () => ({
        counter: useCounter(),
        setCounter: useSetCounter(),
        name: useName(),
        setName: useSetName(),
        password: usePassword(),
        setPassword: useSetPassword(),
      }),
      {
        wrapper,
      }
    );

    act(() => {
      result.current.setName("Impressive Cookie Man");
      result.current.setCounter(82);
    });

    expect(result.current.name).toBe("Impressive Cookie Man");
    expect(result.current.counter).toBe(82);
  });
});
