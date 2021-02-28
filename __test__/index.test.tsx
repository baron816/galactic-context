import React from "react";
import { createGalacticContext } from "../src";
import { act, renderHook } from "@testing-library/react-hooks";

describe("createGalactiContext", () => {
  const { StateProvider, useCounter } = createGalacticContext({
    counter: 0,
  });
  const wrapper = ({ children }) => <StateProvider>{children}</StateProvider>;

  test("simple usage", () => {
    const { result } = renderHook(() => useCounter(), { wrapper });

    act(() => {
      result.current[1](29);
    });

    expect(result.current[0]).toBe(29);
  });
});
