import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (urls: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export default function PhotoUploader({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  disabled = false,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const uploaded: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds the 10MB limit.`);
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const folder = userId || "anonymous";
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from("damage-photos")
          .upload(path, file, { contentType: file.type });

        if (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("damage-photos")
          .getPublicUrl(path);

        uploaded.push(urlData.publicUrl);
      }

      if (uploaded.length > 0) {
        onPhotosChange([...photos, ...uploaded]);
        toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
        disabled={disabled || uploading}
      />

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted group">
            <img src={url} alt={`Damage photo ${i + 1}`} className="w-full h-full object-cover" />
            {!disabled && (
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}

        {photos.length < maxPhotos && !disabled && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "aspect-[4/3] rounded-lg border-2 border-dashed border-border hover:border-accent",
              "flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-accent transition-colors",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <span className="text-xs font-medium">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Action buttons */}
      {photos.length === 0 && !disabled && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload Photos
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment");
                fileInputRef.current.click();
                fileInputRef.current.removeAttribute("capture");
              }
            }}
            disabled={uploading}
            className="flex-1"
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Upload up to {maxPhotos} photos • Max 10MB each • JPG, PNG, WEBP
      </p>
    </div>
  );
}
