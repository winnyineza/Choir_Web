import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getOrderByTxRef, updateOrderStatus, type TicketOrder } from "@/lib/ticketService";
import { formatCurrency } from "@/lib/flutterwave";
import { getSettings } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ticket,
  User,
  Calendar,
  Search,
  RotateCcw,
  Music2,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type ScanResult = {
  status: "valid" | "used" | "invalid" | "cancelled";
  order?: TicketOrder;
  message: string;
};

const SCANNER_ACCESS_KEY = "serenades_scanner_access";

export default function Scanner() {
  useDocumentTitle("Ticket Scanner | Serenades of Praise");
  
  const { isAuthenticated } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Check authorization on mount
  useEffect(() => {
    // If admin is logged in, auto-authorize
    if (isAuthenticated) {
      setIsAuthorized(true);
      setIsCheckingAuth(false);
      return;
    }
    
    // Check if PIN was previously verified in this session
    const sessionAccess = sessionStorage.getItem(SCANNER_ACCESS_KEY);
    if (sessionAccess === "granted") {
      setIsAuthorized(true);
    }
    
    setIsCheckingAuth(false);
  }, [isAuthenticated]);
  
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    
    const settings = getSettings();
    if (pin === settings.scannerPin) {
      setIsAuthorized(true);
      sessionStorage.setItem(SCANNER_ACCESS_KEY, "granted");
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera. Please use manual entry or check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const verifyTicket = (input: string): ScanResult => {
    // Try to parse as JSON (from QR code) or use as direct txRef
    let txRef = input;
    try {
      const parsed = JSON.parse(input);
      if (parsed.txRef) {
        txRef = parsed.txRef;
      }
    } catch {
      // Not JSON, use input directly as txRef
    }
    
    const order = getOrderByTxRef(txRef);

    if (!order) {
      return {
        status: "invalid",
        message: "Ticket not found. This may be a fake or invalid ticket.",
      };
    }

    if (order.status === "used") {
      return {
        status: "used",
        order,
        message: "This ticket has already been used!",
      };
    }

    if (order.status === "cancelled") {
      return {
        status: "cancelled",
        order,
        message: "This ticket has been cancelled.",
      };
    }

    if (order.status === "pending") {
      return {
        status: "invalid",
        order,
        message: "Payment not confirmed. Ticket is not valid yet.",
      };
    }

    // Valid confirmed ticket
    return {
      status: "valid",
      order,
      message: "Valid ticket! Ready for entry.",
    };
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setScanResult(null);
    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      const result = verifyTicket(manualCode.trim().toUpperCase());
      setScanResult(result);
      setIsProcessing(false);
    }, 500);
  };

  const handleAdmitEntry = () => {
    if (scanResult?.order && scanResult.status === "valid") {
      updateOrderStatus(scanResult.order.id, "used");
      setScanResult({
        ...scanResult,
        status: "used",
        message: "Entry granted! Ticket marked as used.",
      });
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setManualCode("");
  };

  const getStatusConfig = (status: ScanResult["status"]) => {
    switch (status) {
      case "valid":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bg: "bg-green-500/20",
          border: "border-green-500/50",
        };
      case "used":
        return {
          icon: AlertCircle,
          color: "text-yellow-500",
          bg: "bg-yellow-500/20",
          border: "border-yellow-500/50",
        };
      case "cancelled":
      case "invalid":
        return {
          icon: XCircle,
          color: "text-red-500",
          bg: "bg-red-500/20",
          border: "border-red-500/50",
        };
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show PIN entry if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card-glass rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="font-display text-2xl font-bold mb-2">Ticket Scanner</h1>
          <p className="text-muted-foreground mb-6">
            Enter the event PIN to access the scanner
          </p>
          
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="text-center text-2xl tracking-widest bg-secondary border-primary/20"
              maxLength={10}
              autoFocus
            />
            
            {pinError && (
              <p className="text-red-500 text-sm">{pinError}</p>
            )}
            
            <Button type="submit" variant="gold" className="w-full" disabled={!pin}>
              <Shield className="w-4 h-4 mr-2" />
              Access Scanner
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-primary/10">
            <p className="text-sm text-muted-foreground mb-3">Are you an admin?</p>
            <Link to="/admin/login">
              <Button variant="outline" size="sm">
                Login to Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-charcoal border-b border-primary/10 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
              <Music2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold gold-text">Ticket Scanner</h1>
              <p className="text-xs text-muted-foreground">Serenades of Praise</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}
            <Link to="/admin">
              <Button variant="outline" size="sm">
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Manual Entry */}
        <div className="card-glass rounded-2xl p-6 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Enter Ticket Reference
          </h2>
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g., SOP-ABC123"
              className="flex-1 bg-secondary border-primary/20 font-mono"
            />
            <Button type="submit" variant="gold" disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        </div>

        {/* Camera Scanner */}
        <div className="card-glass rounded-2xl p-6 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Scan QR Code
          </h2>
          
          {isScanning ? (
            <div className="space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Point camera at the QR code on the ticket
              </p>
              <Button variant="outline" className="w-full" onClick={stopCamera}>
                Stop Scanning
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Use camera to scan ticket QR codes
              </p>
              <Button variant="gold" onClick={startCamera}>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            </div>
          )}
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div
            className={cn(
              "card-glass rounded-2xl p-6 border-2 animate-in fade-in slide-in-from-bottom-4",
              getStatusConfig(scanResult.status).border
            )}
          >
            {/* Status Header */}
            <div className={cn("text-center mb-6", getStatusConfig(scanResult.status).color)}>
              {(() => {
                const Icon = getStatusConfig(scanResult.status).icon;
                return <Icon className="w-16 h-16 mx-auto mb-3" />;
              })()}
              <h3 className="font-display text-2xl font-bold uppercase">
                {scanResult.status === "valid" ? "Valid Ticket" : 
                 scanResult.status === "used" ? "Already Used" :
                 scanResult.status === "cancelled" ? "Cancelled" : "Invalid"}
              </h3>
              <p className="text-foreground/80 mt-1">{scanResult.message}</p>
            </div>

            {/* Order Details */}
            {scanResult.order && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Ticket className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Reference</p>
                    <p className="font-mono font-bold text-foreground">
                      {scanResult.order.txRef}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Attendee</p>
                    <p className="font-semibold text-foreground">
                      {scanResult.order.customer.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Event</p>
                    <p className="font-semibold text-foreground">
                      {scanResult.order.eventTitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {scanResult.order.eventDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Ticket className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tickets</p>
                    <p className="font-semibold text-foreground">
                      {scanResult.order.tickets.map((t) => `${t.quantity}x ${t.tierName}`).join(", ")}
                    </p>
                    <p className="text-sm gold-text font-bold">
                      {formatCurrency(scanResult.order.total)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {scanResult.status === "valid" && (
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={handleAdmitEntry}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Admit Entry
                </Button>
              )}
              <Button
                variant="outline"
                className={scanResult.status === "valid" ? "" : "flex-1"}
                onClick={resetScanner}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Scan Next
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="mb-2">💡 Tips:</p>
          <ul className="space-y-1">
            <li>• Enter the ticket reference (e.g., SOP-ABC123) manually</li>
            <li>• Or use the camera to scan the QR code</li>
            <li>• Green = Valid, Yellow = Used, Red = Invalid</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

