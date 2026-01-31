import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./Home";
import { MemoryRouter } from "react-router-dom";

describe("Home Page", () => {
  it("renders the welcome message", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText(/Welcome to ClearLet v2/i)).toBeInTheDocument();
  });

  it("renders sign in and sign up links", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });
});
