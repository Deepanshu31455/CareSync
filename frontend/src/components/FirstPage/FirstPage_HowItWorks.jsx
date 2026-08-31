const steps = [
  {
    step: "01",
    title: "Register at the front desk",
    body: "The receptionist books the visit and pulls up the patient's existing history, so the doctor isn't starting from zero.",
  },
  {
    step: "02",
    title: "See the doctor in person",
    body: "The doctor reviews the full medical history before the patient walks in, and diagnoses with that context in hand.",
  },
  {
    step: "03",
    title: "Follow up over video",
    body: "For check-ins after the first visit, the doctor and patient connect by video — same record, no repeat exam.",
  },
];

export default function FirstPage_HowItWorks() {
  return (
    <section id="how-it-works" className="section-inner">
      <p className="eyebrow">How it works</p>
      <h2 className="section-title">From the front desk to the follow-up</h2>

      <ol className="grid md:grid-cols-3 gap-8">
        {steps.map((s) => (
          <li
            key={s.step}
            className="flex flex-col gap-3.5 border-t-2 border-border pt-5"
          >
            <span className="font-mono text-[0.85rem] text-brand-coral">
              {s.step}
            </span>
            <div>
              <h3 className="text-[1.1rem] mb-1.5">{s.title}</h3>
              <p className="text-[0.94rem] text-inksoft m-0">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
