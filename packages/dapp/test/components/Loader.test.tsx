import { render } from "@testing-library/react";
import React from "react";
import { Loader } from "./Loader";

describe("Loader", () => {
  it("should render", () => {
    const view = render(<Loader />);

    expect(view.asFragment()).toMatchSnapshot();
  });
});
