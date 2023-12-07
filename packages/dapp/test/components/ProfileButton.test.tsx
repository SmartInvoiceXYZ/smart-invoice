import { render } from "@testing-library/react";
import React from "react";
import { ProfileButton } from "./ProfileButton";

describe("ProfileButton", () => {
  const mockDisconnect = jest.fn();

  it("should render", () => {
    const view = render(
      <ProfileButton
        account="0x123490871023748917234aeefg"
        chainId={1}
        disconnect={mockDisconnect}
      />,
    );

    expect(view.asFragment()).toMatchSnapshot();
  });
});
