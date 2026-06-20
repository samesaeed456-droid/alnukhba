import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, X, Check } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const webcamRef = useRef<Webcam>(null);

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-carbon/90 p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full aspect-square object-cover"
        />
        <div className="p-4 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-100 font-black text-slate-700 uppercase"
          >
            إلغاء
          </button>
          <button
            onClick={capture}
            className="flex-1 py-3 rounded-xl bg-solar font-black text-white uppercase flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            التقاط
          </button>
        </div>
      </div>
    </div>
  );
};
