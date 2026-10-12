import { Clock, Stethoscope, User } from "lucide-react";
import { API_BASE } from "../../config";

export const BASE = API_BASE;

/* ------------------------------------------------------------------ */
/* BACKEND: change these addresses to match your routes                */
/* ------------------------------------------------------------------ */

// What the page sends and expects back (all calls use the login cookie):
//
//  profile   GET  -> { receptionist }            PUT (JSON) -> { receptionist }
//  photo     PUT  (FormData: imageFile)          -> { profilePhoto }
//  doctors   GET  -> { doctors, requests }
//  search    GET  ?q=text -> { doctors }
//  requests  POST { doctorId } -> { request }    DELETE /:assignmentId
//  doctors   DELETE /:assignmentId               (ends a connection)
export const ENDPOINTS = {
  profile: "/receptionist/profile",
  photo: "/receptionist/photo",
  doctors: "/receptionist/doctors",
  search: "/receptionist/doctors/search",
  requests: "/receptionist/requests",
};

// Shape of the data (field names the page reads):
//  receptionist  { id, fullName, email, phone, dob, gender, address, profilePhoto }
//  doctor card   { _id, fullName, specialization, profilePhoto, clinicAddress, consultationFee }
//  doctors[]     { assignmentId, since, doctor: <doctor card> }
//  requests[]    { assignmentId, requestedAt, expiresAt, expired, doctor: <doctor card> }

/* ------------------------------------------------------------------ */
/* PAGE SETTINGS                                                       */
/* ------------------------------------------------------------------ */

// The sections of the page, in menu order
export const TABS = [
  { key: "personal", label: "Personal Information", icon: User },
  { key: "doctors", label: "Serving Doctors", icon: Stethoscope },
  { key: "requests", label: "Pending Requests", icon: Clock },
];

// Same values as the model's gender field
export const GENDERS = ["male", "female", "other", "prefer-not-to-say"];

// Doctor search: start after this many letters, wait this long after typing stops
export const SEARCH = { minChars: 2, delayMs: 350 };
