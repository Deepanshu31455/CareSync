// trustAndLegalData.js
// Content source for TrustAndLegal.jsx — CareSync
// Edit copy here; the component only handles layout/rendering.

export const trustLegalData = {
  hero: {
    eyebrow: "TRUST & LEGAL",
    title: "One record. Three roles. Rules for all of them.",
    subtitle:
      "CareSync connects patients, doctors, and receptionists around a single medical record. Here's exactly how that record is protected, who can see it, and where our policies live.",
  },

  // Top-level trust pillars, shown as a 4-up grid under the hero
  principles: [
    {
      code: "01",
      title: "Encrypted in transit and at rest",
      description:
        "Medical history, prescriptions, and video visits are encrypted end to end. Nothing sits on a server in plain text, including backups.",
    },
    {
      code: "02",
      title: "Role-based access, always",
      description:
        "Every login is scoped to a role. A receptionist's view is technically incapable of showing clinical history — it isn't just hidden by a setting.",
    },
    {
      code: "03",
      title: "Patient-owned history",
      description:
        "The record belongs to the patient. Doctors add to it during care, but patients decide who else can open it, and can revoke access at any time.",
    },
    {
      code: "04",
      title: "Nothing kept without reason",
      description:
        "Video visits are never recorded or stored. Appointment and contact data is retained only as long as it's needed to run the clinic.",
    },
  ],

  // What each role can and cannot see — mirrors the product's real permission model
  roleAccess: [
    {
      role: "Patient",
      summary: "Full visibility into their own record, nothing more.",
      canSee: [
        "Their complete medical history",
        "Physical visit and video-visit notes",
        "Past diagnoses and prescriptions",
      ],
      cannotSee: [
        "Other patients' records",
        "Clinic administrative or billing systems",
      ],
    },
    {
      role: "Doctor",
      summary: "Full clinical access, limited to patients under their care.",
      canSee: [
        "Full patient history before a consultation",
        "Diagnosis tools and prescribing during a visit",
        "Notes from a patient's prior doctors, when relevant to care",
      ],
      cannotSee: [
        "Patients they have no appointment or referral relationship with",
        "A patient's account, billing, or contact settings",
      ],
    },
    {
      role: "Receptionist",
      summary: "Operational access only — scheduling, not medical history.",
      canSee: [
        "Appointment calendars and booking details",
        "Patient contact information",
        "Which doctor a patient is registered with",
      ],
      cannotSee: [
        "Diagnoses, prescriptions, or visit notes",
        "Any clinical history of any patient",
      ],
    },
  ],

  // Security practices, shown as a checklist
  security: {
    heading: "How the record stays safe",
    items: [
      {
        title: "AES-256 encryption at rest",
        description:
          "All stored medical data, including attachments and prescriptions, is encrypted using industry-standard AES-256.",
      },
      {
        title: "TLS 1.2+ in transit",
        description:
          "Every connection between a device and CareSync's servers, including video visits, is encrypted end to end.",
      },
      {
        title: "Per-role access control",
        description:
          "Access is enforced at the system level by role and relationship — a login cannot query data outside its permitted scope.",
      },
      {
        title: "Audit logging",
        description:
          "Every access to a patient's medical history is logged with who, when, and from which role, available to the patient on request.",
      },
      {
        title: "No stored video",
        description:
          "Video consultations are streamed peer-to-peer through an encrypted session and are never recorded or archived.",
      },
      {
        title: "Independent security review",
        description:
          "CareSync's infrastructure undergoes periodic third-party security assessment and penetration testing.",
      },
    ],
  },

  // Regulatory / compliance alignment
  compliance: {
    heading: "Compliance & data protection",
    intro:
      "CareSync is built for clinics operating in India and handles personal and medical data accordingly.",
    items: [
      {
        name: "DPDP Act, 2023",
        description:
          "Data collection, consent, and processing follow India's Digital Personal Data Protection Act.",
      },
      {
        name: "Data localization",
        description:
          "Patient data is hosted on servers within India, in line with clinic and regulatory data-residency requirements.",
      },
      {
        name: "Consent-first design",
        description:
          "Patients explicitly consent before a new doctor or clinic gains access to their history — access is never assumed.",
      },
      {
        name: "Right to access & erasure",
        description:
          "Patients can request a full export of their record or account deletion, subject to statutory medical record retention periods.",
      },
    ],
  },

  // Legal documents footer/library links to real policies
  legalDocuments: [
    {
      title: "Privacy Policy",
      description: "What we collect, why, and how it's used across all three roles.",
      updated: "Updated Jul 2026",
      href: "/legal/privacy-policy",
    },
    {
      title: "Terms of Service",
      description: "The agreement governing use of CareSync by clinics, doctors, and patients.",
      updated: "Updated Jul 2026",
      href: "/legal/terms",
    },
    {
      title: "Data Protection Policy",
      description: "Our technical and organizational measures for safeguarding medical data.",
      updated: "Updated Jun 2026",
      href: "/legal/data-protection",
    },
    {
      title: "Refund Policy",
      description: "Cancellation and refund terms for consultations booked through CareSync.",
      updated: "Updated Mar 2026",
      href: "/legal/refund-policy",
    },
    {
      title: "Cookie Policy",
      description: "How we use cookies and similar technology on the CareSync platform.",
      updated: "Updated Mar 2026",
      href: "/legal/cookies",
    },
  ],

  // Short trust FAQ, distinct from product FAQ on the homepage
  faqs: [
    {
      question: "Can a clinic or hospital see my data across other clinics?",
      answer:
        "No. Access is tied to an explicit care relationship. A new clinic only sees your history once you've consented to share it with them.",
    },
    {
      question: "What happens to my data if I delete my account?",
      answer:
        "Your account and login are removed immediately. Medical records are retained only for the minimum period required by healthcare regulation, then permanently deleted.",
    },
    {
      question: "Who can I contact about a data or privacy concern?",
      answer:
        "Our data protection contact is reachable at the email and phone number below, and typically responds within two business days.",
    },
  ],

  contact: {
    heading: "Questions about privacy or compliance?",
    description:
      "Reach our data protection team directly — for patients, clinics, or partners.",
    email: "privacy@caresync.health",
    phone: "+91 7981187546",
  },
}

export default trustLegalData