import { SignaturePad } from "../SignaturePad";
import { useState } from "react";

export default function SignaturePadExample() {
  const [savedSignature, setSavedSignature] = useState<string>("");

  const handleSave = (signature: string) => {
    setSavedSignature(signature);
    console.log("Signature saved:", signature.substring(0, 50) + "...");
  };

  return (
    <div className="p-8 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Digital Signature Pad</h2>
        <p className="text-muted-foreground">
          Sign below using your mouse or touch screen
        </p>
        <SignaturePad onSave={handleSave} />
        {savedSignature && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Saved Signature Preview:</p>
            <img
              src={savedSignature}
              alt="Signature"
              className="border rounded-md max-w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
