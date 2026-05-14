"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RefreshCw } from "lucide-react";

interface Props {
  /** Fired exactly once per unique scan within `dedupeMs` */
  onScan: (text: string) => void;
  /** Suppress duplicate scans within this window (ms). Defaults to 2500. */
  dedupeMs?: number;
  /** Pause the scan loop without unmounting (e.g., while showing result). */
  paused?: boolean;
}

/**
 * CameraQRScanner — uses navigator.mediaDevices.getUserMedia for the camera
 * (works on both laptops and phones over HTTPS or localhost). jsQR is
 * dynamically imported so it doesn't break SSR.
 */
export function CameraQRScanner({ onScan, dedupeMs = 2500, paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(true);
  const lastScannedRef = useRef<{ text: string; at: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "live" | "denied" | "unsupported" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  async function start() {
    setErrorMsg("");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setStatus("unsupported");
      return;
    }
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      v.setAttribute("playsinline", "true");
      v.muted = true;
      await v.play();
      setStatus("live");

      // detect if multiple cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch {}

      loop();
    } catch (e: any) {
      console.error("[scanner]", e);
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        setStatus("denied");
        setErrorMsg("Camera permission denied. Allow access and try again.");
      } else if (e?.name === "NotFoundError") {
        setStatus("error");
        setErrorMsg("No camera detected on this device.");
      } else {
        setStatus("error");
        setErrorMsg(e?.message ?? "Couldn't start the camera.");
      }
    }
  }

  function stop() {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }

  async function loop() {
    const jsQR = (await import("jsqr")).default;
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    scanningRef.current = true;

    const tick = () => {
      if (!scanningRef.current) return;
      if (paused) {
        requestAnimationFrame(tick);
        return;
      }
      if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth > 0) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const img = ctx.getImageData(0, 0, c.width, c.height);
        try {
          const code = jsQR(img.data, img.width, img.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data) {
            const now = Date.now();
            const last = lastScannedRef.current;
            if (!last || last.text !== code.data || now - last.at > dedupeMs) {
              lastScannedRef.current = { text: code.data, at: now };
              onScan(code.data);
            }
          }
        } catch {}
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCamera() {
    stop();
    setFacing((f) => (f === "environment" ? "user" : "environment"));
    setTimeout(start, 200);
  }

  return (
    <div className="relative">
      <div className="qr-scan-line rounded-2xl border-2 border-dashed border-fuchsia-400/40 aspect-square max-h-[440px] overflow-hidden bg-black/60 grid place-items-center relative">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${status === "live" ? "" : "opacity-0"}`}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* corner markers */}
        <span className="absolute top-3 left-3 w-7 h-7 border-l-2 border-t-2 border-fuchsia-400/70 pointer-events-none z-10" />
        <span className="absolute top-3 right-3 w-7 h-7 border-r-2 border-t-2 border-fuchsia-400/70 pointer-events-none z-10" />
        <span className="absolute bottom-3 left-3 w-7 h-7 border-l-2 border-b-2 border-fuchsia-400/70 pointer-events-none z-10" />
        <span className="absolute bottom-3 right-3 w-7 h-7 border-r-2 border-b-2 border-fuchsia-400/70 pointer-events-none z-10" />

        {status !== "live" && (
          <div className="text-center px-6 z-10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 grid place-items-center text-fuchsia-300 mb-4">
              {status === "starting" ? (
                <div className="w-7 h-7 rounded-full border-2 border-white/30 border-t-fuchsia-300 animate-spin" />
              ) : status === "denied" ? (
                <CameraOff size={36} />
              ) : (
                <Camera size={36} />
              )}
            </div>
            <div className="font-display text-lg font-semibold">
              {status === "starting"
                ? "Starting camera…"
                : status === "denied"
                ? "Camera blocked"
                : status === "unsupported"
                ? "Camera not supported"
                : status === "error"
                ? "Couldn't start camera"
                : "Camera ready"}
            </div>
            {errorMsg && (
              <div className="text-xs text-rose-300 mt-1.5 max-w-xs">{errorMsg}</div>
            )}
            {(status === "idle" || status === "denied" || status === "error") && (
              <button
                onClick={start}
                className="btn btn-primary mt-4 mx-auto"
              >
                <Camera size={15} /> Start scanning
              </button>
            )}
            {status === "unsupported" && (
              <div className="text-xs text-white/55 mt-2 max-w-xs">
                Your browser doesn't expose a camera API. Use a modern browser over HTTPS
                or paste the ticket code below instead.
              </div>
            )}
          </div>
        )}
      </div>

      {status === "live" && (
        <div className="flex items-center justify-between gap-2 mt-3 text-xs">
          <div className="text-emerald-300 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Camera live — point at any GIKI ticket QR
          </div>
          <div className="flex items-center gap-1">
            {hasMultipleCameras && (
              <button
                onClick={toggleCamera}
                className="btn btn-ghost text-xs"
                title="Switch camera"
              >
                <RefreshCw size={12} /> Switch
              </button>
            )}
            <button onClick={stop} className="btn btn-ghost text-xs text-rose-300">
              <CameraOff size={12} /> Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
