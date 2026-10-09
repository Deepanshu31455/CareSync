import { useState } from "react";
import { Camera, ZoomIn } from "lucide-react";
import PhotoLightbox from "./PhotoLightbox";

/**
 * Not editing: clicking the photo zooms it in.
 * Editing: clicking the photo lets the doctor choose a new one.
 */
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

  if (editing) {
    return (
      <label className={`${frame} cursor-pointer`}>
        {image}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
          <Camera size={22} />
          {uploading ? "Uploading..." : "Change photo"}
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUpload}
          disabled={uploading}
        />
      </label>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => src && setZoomed(true)}
        disabled={!src}
        title={src ? "View photo" : undefined}
        className={`${frame} ${src ? "cursor-zoom-in" : "cursor-default"}`}
      >
        {image}

        {src && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
            <ZoomIn size={24} />
          </div>
        )}
      </button>

      {zoomed && (
        <PhotoLightbox src={src} alt={name} onClose={() => setZoomed(false)} />
      )}
    </>
  );
}
