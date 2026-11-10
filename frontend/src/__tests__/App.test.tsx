import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";

describe("App", () => {
  it("renders without crashing", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText("Vector Observatory")).toBeInTheDocument();
  });

  it("shows navigation links", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // Dashboard appears in nav and page title - check both exist
    expect(screen.getAllByText("Dashboard")).toHaveLength(2);
    expect(screen.getByText("Compression")).toBeInTheDocument();
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Policies")).toBeInTheDocument();
    expect(screen.getByText("Docs")).toBeInTheDocument();
  });
});