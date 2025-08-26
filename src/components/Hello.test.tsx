import React from "react";
import { render, screen } from "@testing-library/react";
import { Hello } from "./Hello";

describe("Hello", () => {
  it("renders greeting", () => {
    render(<Hello name="World" />);
    expect(screen.getByRole("status")).toHaveTextContent("Hello, World!");
  });
});
