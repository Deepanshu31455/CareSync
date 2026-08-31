const testimonials = [
  {
    quote:
      "I stopped asking patients to repeat their history at every visit. It's already open before I walk in.",
    name: "Dr. Ananya Rao",
    role: "General Physician",
  },
  {
    quote:
      "My follow-up video call last month took ten minutes because the doctor already had my reports from the visit before.",
    name: "Karan Mehta",
    role: "Patient",
  },
  {
    quote:
      "Scheduling and routing patients to the right doctor used to be three phone calls. Now it's one screen.",
    name: "Sneha Iyer",
    role: "Receptionist",
  },
];

export default function FirstPage_Testimonials() {
  return (
    <section id="testimonials" className="section-inner">
      <p className="eyebrow">In their words</p>
      <h2 className="section-title">People who use it, day to day</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="m-0 bg-surface border border-border rounded-2xl p-8 shadow-card"
          >
            <span
              className="block font-display text-[2.6rem] leading-none text-brand-coral mb-1.5"
              aria-hidden="true"
            >
              “
            </span>
            <blockquote className="m-0 mb-5 text-[1rem] text-ink">
              {t.quote}
            </blockquote>
            <figcaption className="flex flex-col text-[0.88rem]">
              <span className="font-semibold text-ink">{t.name}</span>
              <span className="text-inkfaint">{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
