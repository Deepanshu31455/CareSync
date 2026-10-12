import { useEffect } from "react";
import { Download, X } from "lucide-react";

// Full-screen image view. Esc or a click outside closes it.
// image = { src, title, downloadUrl }  (downloadUrl is optional)
export default function PhotoLightbox({ image, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // stop the page scrolling behind

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        title="Close"
        className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
      >
        <X size={22} />
      </button>

      <img
        src={image.src}
        alt={image.title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] max-w-[92vw] rounded-xl object-contain"
      />

      {image.downloadUrl && (
        <a
          href={image.downloadUrl}
          download
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          <Download size={16} />
          Download
        </a>
      )}
    </div>
  );
}
