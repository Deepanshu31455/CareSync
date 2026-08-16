export default function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[0.8rem] font-medium text-inksoft mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[0.78rem] text-brand-coral mt-1.5">{error.message}</p>}
    </div>
  );
}
