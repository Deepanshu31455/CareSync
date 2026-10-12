import { useState } from "react";
import { Camera } from "lucide-react";
import { PHOTO_RULES } from "./constants";
import { checkFile } from "./helpers";
import { Avatar, Card } from "./ui";
import PhotoLightbox from "./PhotoLightbox";

// Photo, name, ID and email (shown as plain text, never editable).
// Clicking the photo opens it larger; the camera button changes it.
//   name, idLabel ("Receptionist ID"), id, email, photo = what to show
//   onChangePhoto = (file) => Promise
export default function ProfileHeader({ name, idLabel, id, email, photo, saving, onChangePhoto }) {
  const [zoomed, setZoomed] = useState(false);
  const [problem, setProblem] = useState(null);

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be picked again later
    if (!file) return;

    const message = checkFile(file, PHOTO_RULES);
    if (message) {
      setProblem(message);
      return;
    }

    setProblem(null);
    await onChangePhoto(file);
  }

  return (
    <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      <div className="relative shrink-0">
        {photo ? (
          <button type="button" onClick={() => setZoomed(true)} title="View photo" className="block cursor-zoom-in rounded-full">
            <Avatar src={photo} name={name} className="h-24 w-24 text-3xl" />
          </button>
        ) : (
          <Avatar name={name} className="h-24 w-24 text-3xl" />
        )}

        <label
          title="Change profile photo"
          className={`absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow ${
            saving ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-50"
          }`}
        >
          <Camera size={17} />
          <input type="file" accept={PHOTO_RULES.accept.join(",")} className="hidden" onChange={chooseFile} disabled={saving} />
        </label>
      </div>

      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold text-slate-900">{name}</h1>
        <p className="mt-1 font-mono text-xs text-teal-700">
          {idLabel}: {id || "—"}
        </p>
        <p className="break-all text-sm text-slate-500">{email || "—"}</p>
        {problem && <p className="mt-2 text-sm text-red-600">{problem}</p>}
      </div>

      {zoomed && <PhotoLightbox image={{ src: photo, title: name }} onClose={() => setZoomed(false)} />}
    </Card>
  );
}
