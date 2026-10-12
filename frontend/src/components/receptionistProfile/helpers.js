// Builds the editable form from the saved profile.
// Receptionist ID and email are deliberately NOT in here, so they can never be edited.
export function buildForm(profile) {
  return {
    fullName: profile.fullName || "",
    phone: profile.phone || "",
    dob: profile.dob ? String(profile.dob).slice(0, 10) : "", // yyyy-mm-dd for the date input
    gender: profile.gender || "",
    address: profile.address || "",
  };
}
