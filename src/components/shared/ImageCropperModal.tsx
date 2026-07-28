import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Crop, Loader } from "lucide-react";
import { COLORS, Button } from "@/components/shared/UIComponents";
import getCroppedImg from "@/utils/cropImage";

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 16 / 9,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-2">
            <Crop size={18} style={{ color: COLORS.primary }} />
            <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>Crop Image</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>

        <div className="relative w-full h-[60vh] bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ background: COLORS.border }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isProcessing} icon={isProcessing ? <Loader className="animate-spin" size={16} /> : <Crop size={16} />}>
              {isProcessing ? "Processing..." : "Apply & Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
