import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface LogoUploadProps {
  hotelId: string;
  currentLogoUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

export function LogoUpload({ hotelId, currentLogoUrl, onUploadComplete }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('hotelId', hotelId);

      const response = await fetch('/api/upload/hotel-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Logo uploaded successfully',
      });

      onUploadComplete(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
      setPreview(currentLogoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="logo-upload">Hotel Logo</Label>
      
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Logo preview"
              className="h-24 w-24 object-contain border rounded-md"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={handleRemove}
              data-testid="button-remove-logo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="h-24 w-24 border-2 border-dashed rounded-md flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1">
          <Input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            data-testid="input-logo-upload"
          />
          <Label
            htmlFor="logo-upload"
            className="cursor-pointer"
          >
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              asChild
              data-testid="button-upload-logo"
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </span>
            </Button>
          </Label>
          <p className="text-sm text-muted-foreground mt-2">
            PNG, JPG, or SVG. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
}
