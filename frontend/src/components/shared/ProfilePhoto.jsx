import { useState } from "react";
import { Camera, ZoomIn } from "lucide-react";
import PhotoLightbox from "./PhotoLightbox";

const ALLOWED_EXTENSIONS = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ProfilePhoto({
  src,
  photo,
  name = "User",
  saving = false,
  uploading = false,
  onChangePhoto,
  onUpload,
  shape = "rounded-2xl", // "rounded-2xl" (doctor) or "rounded-full" (patient/receptionist)
  size = "lg", // "lg" (h-28 w-28) or "md" (h-24 w-24)
}) {
  const [zoomed, setZoomed] = useState(false);
  const [problem, setProblem] = useState(null);

  const imgSrc = photo || src;
  const isBusy = saving || uploading;

  const sizeClasses = size === "lg" ? "h-28 w-28" : "h-24 w-24";
  const initialTextSize = size === "lg" ? "text-4xl" : "text-3xl";

  async function handleFileChange(event) {
    const file = event.target?.files?.[0];
    if (event.target) event.target.value = ""; // allow choosing same file again
    if (!file) return;

    if (!ALLOWED_EXTENSIONS.includes(file.type.toLowerCase())) {
      setProblem("Only JPG, PNG, and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setProblem("The image must be smaller than 5 MB.");
      return;
    }

    setProblem(null);

    const handler = onChangePhoto || onUpload;
    if (handler) {
      await handler(file);
    }
  }

  return (
    <div className="flex flex-col items-center sm:items-start">
      {/* Container is explicitly locked in dimensions so camera badge NEVER detaches */}
      <div className={`relative ${sizeClasses} shrink-0 self-start`}>
        {/* Avatar Image / Placeholder */}
        <div
          onClick={() => imgSrc && setZoomed(true)}
          className={`group relative h-full w-full overflow-hidden border border-slate-200 bg-slate-100 ${shape} ${
            imgSrc ? "cursor-zoom-in" : "cursor-default"
          }`}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center font-bold text-blue-600 ${initialTextSize}`}>
              {(name || "U").charAt(0).toUpperCase()}
            </div>
          )}

          {imgSrc && (
            <div className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100 ${shape}`}>
              <ZoomIn size={22} />
            </div>
          )}
        </div>

        {/* Camera Upload Badge locked exactly to the bottom-right corner */}
        <label
          title="Change profile photo"
          className={`absolute bottom-0 right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white text-slate-700 shadow-md transition-all ${
            isBusy
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:bg-slate-50 hover:text-blue-600 hover:scale-105 active:scale-95"
          }`}
        >
          <Camera size={17} />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={handleFileChange}
            disabled={isBusy}
          />
        </label>
      </div>

      {problem && (
        <p className="mt-2 text-xs font-medium text-red-600 text-center sm:text-left">{problem}</p>
      )}

      {zoomed && imgSrc && (
        <PhotoLightbox
          src={imgSrc}
          alt={name}
          onClose={() => setZoomed(false)}
        />
      )}
    </div>
  );
}

