import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tablet, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";

export function AddTabletGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Generate the tablet registration URL with hotel ID
  // Only generate URL if user and hotelId are available
  const tabletUrl = user?.hotelId 
    ? `${window.location.origin}/tablet/register?hotelId=${user.hotelId}`
    : "";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(tabletUrl);
    setCopiedUrl(true);
    toast({
      title: "URL Copied",
      description: "Tablet registration URL copied to clipboard",
    });

    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Don't allow opening if no hotel ID available
  const handleOpenChange = (open: boolean) => {
    if (open && !user?.hotelId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hotel information not available. Please refresh the page.",
      });
      return;
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-add-tablet-guide" disabled={!user?.hotelId}>
          <Tablet className="h-4 w-4 mr-2" />
          How to Add Tablet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Tablet className="h-6 w-6" />
            How to Add a Tablet or iPad
          </DialogTitle>
          <DialogDescription>
            Follow these simple steps to register a new tablet device to your hotel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Step 1 */}
          <Card data-testid="card-step-1">
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Open the Registration Page</CardTitle>
              <CardDescription>
                On your iPad or tablet, open a web browser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You have two options to access the registration page:
              </p>

              {/* Option A: Manual URL */}
              <div className="space-y-2">
                <p className="font-semibold text-sm">Option A: Enter URL Manually</p>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {tabletUrl}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    data-testid="button-copy-url"
                  >
                    {copiedUrl ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Option B: QR Code */}
              <div className="space-y-2">
                <p className="font-semibold text-sm">Option B: Scan QR Code</p>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white dark:bg-white rounded-lg border-2 border-muted" data-testid="qr-code-container">
                    <QRCodeSVG 
                      value={tabletUrl} 
                      size={128}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground">
                    <p>Use your tablet's camera or QR code scanner app to scan this code</p>
                    <p className="mt-2">
                      <strong>Tip:</strong> Most modern tablets can scan QR codes directly from the camera app
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card data-testid="card-step-2">
            <CardHeader>
              <CardTitle className="text-lg">Step 2: Register the Device</CardTitle>
              <CardDescription>
                Give your tablet a memorable name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm">Enter a friendly name for the tablet, such as:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>"Front Desk iPad 1"</li>
                  <li>"Lobby iPad"</li>
                  <li>"Check-in Station 2"</li>
                  <li>"Reception Tablet"</li>
                </ul>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Tip:</strong> Choose names that clearly identify the tablet's location or purpose
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card data-testid="card-step-3">
            <CardHeader>
              <CardTitle className="text-lg">Step 3: Keep the Tablet Connected</CardTitle>
              <CardDescription>
                The tablet will now receive registration cards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                Once registered, the tablet will:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Show a "Ready to receive contracts" status</li>
                <li>Display a green indicator when connected</li>
                <li>Automatically receive registration cards sent from this dashboard</li>
                <li>Allow guests to sign digitally with their finger or stylus</li>
              </ul>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-900 dark:text-green-100">
                  <strong>Important:</strong> Keep the browser tab open on the tablet at all times. The tablet will reconnect automatically if the page is refreshed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card data-testid="card-step-4">
            <CardHeader>
              <CardTitle className="text-lg">Step 4: Send Registration Cards</CardTitle>
              <CardDescription>
                Use the "Send to Tablet" button on the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                After the tablet is registered, you can:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Click "Send to Tablet" from any guest check-in</li>
                <li>Select which tablet to send the contract to</li>
                <li>The guest can then sign directly on the tablet</li>
                <li>The signature syncs back to the main dashboard instantly</li>
              </ul>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card data-testid="card-troubleshooting">
            <CardHeader>
              <CardTitle className="text-lg">Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">Tablet shows "Disconnected"</p>
                  <p className="text-muted-foreground">
                    • Check your internet connection<br />
                    • Refresh the browser page on the tablet<br />
                    • Make sure you're on the same network
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Can't see the tablet in the device list</p>
                  <p className="text-muted-foreground">
                    • Make sure the tablet completed registration<br />
                    • Check that the tablet is showing "Connected" status<br />
                    • Refresh this dashboard page
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Contract not appearing on tablet</p>
                  <p className="text-muted-foreground">
                    • Verify the tablet is online (green indicator)<br />
                    • Try sending the contract again<br />
                    • Check that no other contract is currently open on the tablet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-guide"
          >
            Close
          </Button>
          <Button
            onClick={handleCopyUrl}
            data-testid="button-copy-url-footer"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Registration URL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
