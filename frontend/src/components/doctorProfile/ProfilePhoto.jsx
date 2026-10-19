import { useState } from "react";
import { Camera, ZoomIn } from "lucide-react";
import PhotoLightbox from "./PhotoLightbox";

export default function ProfilePhoto({
  src,
  name,
  editing,
  uploading,
  onUpload,
}) {
  const [zoomed, setZoomed] = useState(false);

  const frame =
    "group relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 sm:mx-0";

  const image = src ? (
    <img src={src} alt={name || "Doctor"} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-blue-600">
      {(name || "D").charAt(0).toUpperCase()}
    </div>
  );

  return (
    <>
      <div className="relative mx-auto sm:mx-0 shrink-0">
        <div
          onClick={() => src && setZoomed(true)}
          className={`${frame} ${src ? "cursor-zoom-in" : "cursor-default"}`}
        >
          {image}

          {src && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
              <ZoomIn size={24} />
            </div>
          )}
        </div>

        <label
          title="Change profile photo"
          className={`absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition ${
            uploading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50 hover:text-blue-600"
          }`}
        >
          <Camera size={18} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {zoomed && (
        <PhotoLightbox src={src} alt={name} onClose={() => setZoomed(false)} />
      )}
    </>
  );
}
