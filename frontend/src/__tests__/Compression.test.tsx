import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Compression } from "@/components/Compression";

vi.mock("@/api", () => ({
  api: {
    compress: vi.fn(),
  },
}));

import { api } from "@/api";

const mockCompressResponse = {
  session_id: "test-session",
  request_id: "test-request",
  original_text: "This function implements a complex algorithm",
  compressed_text: "This func impl a complex algo",
  tokens_before: 18,
  tokens_after: 13,
  tokens_saved: 5,
  compression_ratio: 0.72,
  recovery_ref: "ccr://ccr_obj_test123",
  mode: "compress",
  profile: "full-safe",
};

describe("Compression Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    global.URL.createObjectURL = vi.fn(() => "mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("renders without crashing", () => {
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    expect(screen.getByText("Token Compression Engine")).toBeInTheDocument();
    expect(screen.getByText(/Caveman-style vocabulary reduction for coding agents/)).toBeInTheDocument();
  });

  it("shows sample text in textarea", () => {
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    const textarea = screen.getByRole("textbox");
    expect(textarea.value).toContain("function");
    expect(textarea.value).toContain("implements");
  });

  it("shows mode selector with options", () => {
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    const modeOptions = screen.getAllByText("Compress");
    expect(modeOptions.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Ultracave")).toBeInTheDocument();
    expect(screen.getByText("Passthrough")).toBeInTheDocument();
  });

  it("shows profile selector with options", () => {
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    expect(screen.getByText("Full Safe")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Aggressive")).toBeInTheDocument();
  });

  it("shows framework selector with options", () => {
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.getByText("OpenCode")).toBeInTheDocument();
    expect(screen.getByText("Antigravity CLI")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("shows session type selector with options", () => {
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    expect(screen.getByText("Interactive")).toBeInTheDocument();
    expect(screen.getByText("Print Mode")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("compresses text when button clicked", async () => {
    vi.mocked(api.compress).mockResolvedValue(mockCompressResponse);
    
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    
    const compressButton = screen.getByRole("button", { name: "Compress" });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(screen.getByText("Compressed Output")).toBeInTheDocument();
    });
    
    expect(api.compress).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("function"),
        mode: "compress",
        profile: "full-safe",
      })
    );
    
    expect(screen.getByText("This func impl a complex algo")).toBeInTheDocument();
  });

  it("shows loading state during compression", async () => {
    let resolveCompress: (value: unknown) => void;
    const compressPromise = new Promise((resolve) => {
      resolveCompress = resolve;
    });
    vi.mocked(api.compress).mockReturnValue(compressPromise);
    
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    
    const compressButton = screen.getByRole("button", { name: "Compress" });
    fireEvent.click(compressButton);
    
    expect(screen.getByText("Compressing...")).toBeInTheDocument();
    
    resolveCompress!(mockCompressResponse);
    await waitFor(() => {
      expect(screen.queryByText("Compressing...")).not.toBeInTheDocument();
    });
  });

  it("shows error when compression fails", async () => {
    vi.mocked(api.compress).mockRejectedValue(new Error("API Error"));
    
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    
    const compressButton = screen.getByRole("button", { name: "Compress" });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(screen.getByText("API Error")).toBeInTheDocument();
    });
  });

  it("shows error when input is empty", async () => {
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "" } });
    
    const compressButton = screen.getByRole("button", { name: "Compress" });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(screen.getByText("Please enter some text to compress")).toBeInTheDocument();
    });
  });

  it("displays metrics after compression", async () => {
    vi.mocked(api.compress).mockResolvedValue(mockCompressResponse);
    
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    
    const compressButton = screen.getByRole("button", { name: "Compress" });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(screen.getByText("Tokens Before")).toBeInTheDocument();
      expect(screen.getByText("18")).toBeInTheDocument();
      expect(screen.getByText("Tokens After")).toBeInTheDocument();
      expect(screen.getByText("13")).toBeInTheDocument();
      expect(screen.getByText("Tokens Saved")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Compression Ratio")).toBeInTheDocument();
      expect(screen.getByText("0.72")).toBeInTheDocument();
      expect(screen.getByText("Savings")).toBeInTheDocument();
      expect(screen.getByText("28.0%")).toBeInTheDocument();
    });
  });

  it("shows recovery reference after compression", async () => {
    vi.mocked(api.compress).mockResolvedValue(mockCompressResponse);
    
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    
    const compressButton = screen.getByRole("button", { name: "Compress" });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(screen.getByText("Recovery Reference")).toBeInTheDocument();
      expect(screen.getByText("ccr://ccr_obj_test123")).toBeInTheDocument();
    });
  });

  it("copies compressed text when copy button clicked", async () => {
    vi.mocked(api.compress).mockResolvedValue(mockCompressResponse);
    
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    
    const compressButton = screen.getByRole("button", { name: "Compress" });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      const copyButton = screen.getByText("Copy");
      fireEvent.click(copyButton);
    });
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("This func impl a complex algo");
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });

  it("changes mode when selector changed", async () => {
    vi.mocked(api.compress).mockResolvedValue(mockCompressResponse);
    
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    
    const modeSelect = screen.getByText("Compress").closest("select");
    fireEvent.change(modeSelect, { target: { value: "ultracave" } });
    
    const compressButton = screen.getByRole("button", { name: "Compress" });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(api.compress).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "ultracave" })
      );
    });
  });

  it("changes profile when selector changed", async () => {
    vi.mocked(api.compress).mockResolvedValue(mockCompressResponse);
    
    render(
      <BrowserRouter>
        <Compression />
      </BrowserRouter>
    );
    
    const profileSelect = screen.getByText("Full Safe").closest("select");
    fireEvent.change(profileSelect, { target: { value: "aggressive" } });
    
    const compressButton = screen.getByRole("button", { name: "Compress" });
    fireEvent.click(compressButton);
    
    await waitFor(() => {
      expect(api.compress).toHaveBeenCalledWith(
        expect.objectContaining({ profile: "aggressive" })
      );
    });
  });
});
