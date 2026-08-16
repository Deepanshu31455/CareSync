export const ROLES = [
  { id: "patient", label: "Patient", digit: "1" },
  { id: "receptionist", label: "Receptionist", digit: "2" },
  { id: "doctor", label: "Doctor", digit: "3" },
];

export const STEP_LABELS = {
  email: "Verify email",
  personal: "Personal details",
  role: "Select role",
  details: "Role details",
  account: "Account setup",
  phoneVerify: "Verify phone",
};

// Fields each step must pass before "Continue" is allowed.
// "details" is skipped entirely for receptionists.
export const STEP_FIELDS = {
  email: ["email", "emailVerified"],
  personal: ["fullName", "phone", "dob", "gender", "address"],
  role: ["role"],
  details: {
    patient: ["bloodGroup", "emergencyContact"],
    doctor: ["specialization", "licenseNumber", "experience"],
  },
  account: ["idSuffix", "password", "confirmPassword"],
  phoneVerify: ["phoneVerified"],
};
