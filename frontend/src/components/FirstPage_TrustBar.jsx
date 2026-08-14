const badges = [
  "Encrypted medical records",
  "Role-based access only",
  "Video visits, not stored",
  "Patient-owned history",
];

export default function FirstPage_TrustBar() {
  return (
    <section className="bg-ink" aria-label="Data security commitments">
      <div className="max-w-content mx-auto px-6 md:px-8 py-7 flex flex-wrap justify-center gap-8">
        {badges.map((badge) => (
          <div
            key={badge}
            className="flex items-center gap-2.5 text-[#dce6f5] text-[0.88rem] font-mono"
          >
            <span className="w-[7px] h-[7px] rounded-full bg-brand-teal" aria-hidden="true" />
            {badge}
          </div>
        ))}
      </div>
    </section>
  );
}
