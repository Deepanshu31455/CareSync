import { Card } from "./ui";
import ProfilePhoto from "./ProfilePhoto";

// Shared ProfileHeader for Patient and Receptionist
// (Supports both `profile` object and individual props)
export default function ProfileHeader({
  profile,
  name,
  idLabel,
  id,
  email,
  photo,
  saving = false,
  onChangePhoto,
  children,
}) {
  const finalName = name || profile?.fullName || "User";
  const finalId = id || profile?.id;
  const finalEmail = email || profile?.email;
  const finalPhoto = photo || profile?.profilePhoto;
  const finalIdLabel = idLabel || (profile?.role === "patient" ? "Patient ID" : profile?.role === "receptionist" ? "Receptionist ID" : "ID");

  return (
    <Card className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
      <ProfilePhoto
        photo={finalPhoto}
        name={finalName}
        saving={saving}
        onChangePhoto={onChangePhoto}
        shape="rounded-full"
        size="md"
      />

      {children ? (
        <div className="min-w-0 flex-1">{children}</div>
      ) : (
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold text-slate-900">{finalName}</h1>
          <p className="mt-1 font-mono text-xs text-teal-700">
            {finalIdLabel}: {finalId || "—"}
          </p>
          <p className="break-all text-sm text-slate-500">{finalEmail || "—"}</p>
        </div>
      )}
    </Card>
  );
}
