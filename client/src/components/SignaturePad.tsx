import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eraser, RotateCcw } from "lucide-react";

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

export function SignaturePad({ onSave }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    console.log("Signature cleared");
  };

  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL();
      onSave(dataUrl);
      setIsEmpty(true);
      console.log("Signature saved");
    }
  };

  const handleEnd = () => {
    setIsEmpty(sigCanvas.current?.isEmpty() ?? true);
  };

  return (
    <div className="space-y-4">
      <Card className="p-1">
        <div className="border-2 border-dashed border-border rounded-md bg-background" data-testid="canvas-signature">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: "w-full h-40 touch-none",
            }}
            onEnd={handleEnd}
          />
        </div>
      </Card>
      <div className="flex gap-2">
        <Button
          data-testid="button-clear-signature"
          type="button"
          variant="outline"
          onClick={clear}
          className="gap-2"
          disabled={isEmpty}
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
        <Button
          data-testid="button-save-signature"
          type="button"
          onClick={save}
          className="flex-1 gap-2"
          disabled={isEmpty}
        >
          <Eraser className="h-4 w-4" />
          Confirm Signature
        </Button>
      </div>
    </div>
  );
}
