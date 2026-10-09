import { DEFAULT_FACILITIES } from "./constants";
import { normalizeWorkingHours } from "./timeUtils";

export function buildForm(doc) {
  return {
    fullName: doc.fullName || "",
    specialization: doc.specialization || "",
    qualifications: doc.qualifications || "",
    affiliation: doc.affiliation || "",
    experience: doc.experience ?? 0,
    phone: doc.phone || "",
    phone1: doc.phone1 || doc.phone || "",
    phone2: doc.phone2 || "",
    clinicAddress: doc.clinicAddress || doc.address || "",
    workingHours: normalizeWorkingHours(doc.workingHours),
    googleExperience: doc.googleExperience || "",
    facilities: doc.facilities || [...DEFAULT_FACILITIES],
    otherDescription: doc.otherDescription || "",
    directions: {
      instructions: doc.directions?.instructions || "",
      landmark: doc.directions?.landmark || "",
      mapLink: doc.directions?.mapLink || "",
    },
    profilePhoto: doc.profilePhoto || "",
  };
}
