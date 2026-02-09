import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeVin, isValidVin, decodeVin } from "@/lib/vinDecoder";
import type { DecodedVehicle } from "@/lib/vinDecoder";
import { useIsMobile } from "@/hooks/use-mobile";
import VinPrivacyNotice from "./VinPrivacyNotice";

interface Props {
  onDecoded: (vehicle: DecodedVehicle) => void;
  onSwitchToVin: () => void;
  onSwitchToDropdown: () => void;
}

export default function VinScanner({ onDecoded, onSwitchToVin, onSwitchToDropdown }: Props) {
  const isMobile = useIsMobile();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processVin = useCallback(async (raw: string) => {
    const vin = sanitizeVin(raw);
    if (!isValidVin(vin)) {
      setError("Scanned code doesn't appear to be a valid VIN. Try again or enter manually.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const vehicle = await decodeVin(vin);
      if (!vehicle.make) {
        setError("Couldn't decode the scanned VIN. Try entering it manually.");
        return;
      }
      onDecoded(vehicle);
    } catch {
      setError("Couldn't decode the scanned VIN. Try entering it manually.");
    } finally {
      setLoading(false);
      stopScanner();
    }
  }, [onDecoded]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const startScanner = async () => {
    setError("");
    setScanning(true);

    // Dynamically import to keep bundle small for non-scanner users
    const { Html5QrcodeScanner } = await import("html5-qrcode");

    // Small delay to let the container mount
    await new Promise((r) => setTimeout(r, 100));

    const scanner = new Html5QrcodeScanner(
      "vin-scanner-container",
      {
        fps: 10,
        qrbox: { width: 280, height: 80 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
      },
      false
    );

    scanner.render(
      (decodedText: string) => {
        processVin(decodedText);
      },
      () => {
        // scan error — ignore individual frame errors
      }
    );

    scannerRef.current = scanner;

    // Auto-timeout after 30s
    setTimeout(() => {
      if (scannerRef.current) {
        setError("Having trouble scanning? The VIN barcode can be hard to read if it's worn, dirty, or in low light. Try entering the VIN manually or use the dropdown.");
      }
    }, 30000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setLoading(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("vin-file-scanner");
      const result = await scanner.scanFile(file, true);
      await scanner.clear();
      await processVin(result);
    } catch {
      setError("Couldn't read a barcode from that image. Try a clearer photo or enter the VIN manually.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-wrenchli-teal" />
        <p className="text-sm text-muted-foreground">Decoding VIN...</p>
      </div>
    );
  }

  // Desktop experience
  if (!isMobile && !scanning) {
    return (
      <div className="text-center py-6 space-y-4">
        <p className="text-3xl">📷</p>
        <p className="font-heading text-base font-semibold text-foreground">
          VIN Scanning works best on your phone
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          To scan your VIN barcode, open Wrenchli on your mobile device and use the Scan VIN option.
        </p>
        <p className="text-sm text-muted-foreground">On this device, you can:</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={onSwitchToVin} className="border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10">
            Enter VIN Manually →
          </Button>
          <Button variant="outline" size="sm" onClick={onSwitchToDropdown} className="border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10">
            Use Year/Make/Model →
          </Button>
        </div>
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">Or upload a photo of your VIN barcode:</p>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10">
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Photo
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <div id="vin-file-scanner" className="hidden" />
        </div>
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        <VinPrivacyNotice />
      </div>
    );
  }

  // Mobile — pre-scan instructions
  if (!scanning) {
    return (
      <div className="text-center py-4 space-y-4">
        <p className="text-3xl">📷</p>
        <p className="font-heading text-base font-semibold text-foreground">
          Scan Your VIN Barcode
        </p>
        <p className="text-sm text-muted-foreground">
          Point your camera at the VIN barcode on:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Your dashboard (visible through the windshield)</li>
          <li>• The sticker on your driver's door jamb</li>
        </ul>
        <Button onClick={startScanner} className="h-12 px-8 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 font-semibold">
          <Camera className="mr-2 h-5 w-5" /> Open Camera
        </Button>
        <p className="text-xs text-muted-foreground">
          Tip: Make sure there's good lighting and hold the camera steady.
        </p>
        <p className="text-xs text-muted-foreground">
          Can't scan?{" "}
          <button onClick={onSwitchToVin} className="text-wrenchli-teal font-semibold hover:underline">
            Enter VIN manually →
          </button>
        </p>
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      </div>
    );
  }

  // Active scanning
  return (
    <div className="space-y-3" ref={containerRef}>
      <div id="vin-scanner-container" className="rounded-lg overflow-hidden" />
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={stopScanner} className="text-xs">
          Cancel
        </Button>
        <Button variant="outline" size="sm" onClick={onSwitchToVin} className="text-xs border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10">
          Enter VIN manually →
        </Button>
      </div>
      {error && <p className="text-sm text-destructive font-medium text-center">{error}</p>}
    </div>
  );
}
