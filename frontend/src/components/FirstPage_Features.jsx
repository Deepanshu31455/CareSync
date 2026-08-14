const roles = [
  {
    tag: "Patient",
    title: "Your history, always on hand",
    points: [
      "Medical history stored in one secure place",
      "Book physical visits or video follow-ups",
      "See past diagnoses and prescriptions anytime",
    ],
  },
  {
    tag: "Doctor",
    title: "Context before the consultation",
    points: [
      "Full patient history open before the visit",
      "Diagnose with past records, not a blank chart",
      "Move a patient to video for the follow-up",
    ],
  },
  {
    tag: "Receptionist",
    title: "The front desk, without the back-and-forth",
    points: [
      "Register patients and manage appointment slots",
      "Route patients to the right doctor, in person or video",
      "Keep the day's schedule in one screen",
    ],
  },
];

export default function FirstPage_Features() {
  return (
    <section id="features" className="bg-surfacealt">
      <div className="section-inner">
        <p className="eyebrow">Built for everyone in the room</p>
        <h2 className="section-title">
          Three logins. One record that stays in sync.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role, i) => (
            <article
              key={role.tag}
              className="relative overflow-hidden bg-surface border border-border rounded-2xl p-8"
            >
              <span
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-blue to-brand-teal"
                aria-hidden="true"
              />
              <span className="font-mono text-[0.8rem] text-inkfaint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-mono text-[0.78rem] tracking-[0.1em] uppercase text-brand-blue mt-2.5 mb-2">
                {role.tag}
              </p>
              <h3 className="text-[1.28rem] mb-4">{role.title}</h3>
              <ul className="space-y-2.5">
                {role.points.map((point) => (
                  <li
                    key={point}
                    className="relative pl-5 text-[0.94rem] text-inksoft"
                  >
                    <span className="absolute left-0 top-[8px] w-[7px] h-[7px] rounded-full bg-brand-teal" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
