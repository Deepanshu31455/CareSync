const pillars = [
  {
    title: "Why we built it",
    body: "Medical history usually lives in three places at once — a paper file, a receptionist's register, and a doctor's memory. CareSync puts it in one place instead, so nothing gets lost between visits.",
  },
  {
    title: "What the platform does",
    body: "Patients keep their history on the app. Doctors open that same history before a physical visit, and diagnose with the full picture. Follow-ups happen over video, without anyone leaving home.",
  },
  {
    title: "Who it's for",
    body: "Built around three logins — patient, doctor and receptionist — each seeing exactly what their role needs, and nothing they don't.",
  },
];

export default function FirstPage_About() {
  return (
    <section id="about" className="section-inner">
      <p className="eyebrow">Our purpose</p>
      <h2 className="section-title">
        A clinic runs on information moving correctly —
        <span className="text-brand-blue"> we just make sure it does.</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {pillars.map((p) => (
          <article
            key={p.title}
            className="bg-surface border border-border rounded-2xl p-7 shadow-card"
          >
            <b><h3 className="text-[1.15rem] mb-2.5">{p.title}</h3></b>
            <p className="text-[0.96rem] text-inksoft m-0">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
