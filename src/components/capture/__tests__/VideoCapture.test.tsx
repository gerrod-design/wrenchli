/**
 * Component tests for VideoCapture on the native (iOS / no-MediaRecorder) path.
 * jsdom has no mediaDevices.getUserMedia and no MediaRecorder, so
 * shouldUseNativeCapture() is true here — exactly the iPhone strategy.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VideoCapture from "@/components/capture/VideoCapture";

describe("VideoCapture (native capture strategy)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the big record button with mode-specific copy", () => {
    render(<VideoCapture mode="symptom" onCaptured={() => {}} />);
    expect(screen.getByText("Record the noise")).toBeInTheDocument();
    expect(
      screen.getByText(/picture and sound together, for at least 3 seconds/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Record video" }),
    ).toBeInTheDocument();
  });

  it("renders repair-complete copy for repair mode", () => {
    render(<VideoCapture mode="repair-complete" onCaptured={() => {}} />);
    expect(screen.getByText("Film the finished repair")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Film repair" }),
    ).toBeInTheDocument();
  });

  it("uses a native camera picker input (accept + capture attributes)", () => {
    const { container } = render(<VideoCapture mode="symptom" onCaptured={() => {}} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    expect(input?.getAttribute("accept")).toBe("video/*");
    expect(input?.getAttribute("capture")).toBe("environment");
  });

  it("rejects an empty file in plain language with a retake path", async () => {
    const onCaptured = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <VideoCapture mode="symptom" onCaptured={onCaptured} onError={onError} />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const empty = new File([], "clip.mp4", { type: "video/mp4" });
    fireEvent.change(input, { target: { files: [empty] } });

    await waitFor(() => {
      expect(
        screen.getByText(/looks empty or damaged/i),
      ).toBeInTheDocument();
    });
    expect(onCaptured).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.stringContaining("empty or damaged"));
    // Every error offers a retake — no dead ends.
    expect(
      screen.getByRole("button", { name: /record again/i }),
    ).toBeInTheDocument();
  });

  it("rejects a non-video file in plain language", async () => {
    const onCaptured = vi.fn();
    const { container } = render(
      <VideoCapture mode="symptom" onCaptured={onCaptured} />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const notVideo = new File([new Uint8Array(600_000)], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [notVideo] } });

    await waitFor(() => {
      expect(
        screen.getByText(/doesn't look like a video file/i),
      ).toBeInTheDocument();
    });
    expect(onCaptured).not.toHaveBeenCalled();
  });
});
