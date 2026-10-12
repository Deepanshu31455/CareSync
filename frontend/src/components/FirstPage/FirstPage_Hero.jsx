import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

// The main button for each logged-in role: its text and where it goes.
// Doctor and receptionist go to their dashboard; a patient goes to doctor search.
// Change SEARCH_ROUTE to the path of your search page.
const SEARCH_ROUTE = "/search";

const ROLE_BUTTON = {
  doctor: { label: "Go to work", to: "/dashboard/doctor" },
  receptionist: { label: "Go to work", to: "/dashboard/receptionist" },
  patient: { label: "Search for doctor", to: SEARCH_ROUTE },
};

export default function FirstPage_Hero() {
  const user = useSelector((state) => state.authStore.user);
  const button = user ? ROLE_BUTTON[user.role] : null;

  return (
    <section
      id="top"
      className="max-w-content mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-16 grid md:grid-cols-[1.05fr_0.95fr] gap-12 items-center"
    >
      <div>
        <p className="eyebrow">What we are</p>
        <h1 className="text-[clamp(2.4rem,1.7rem+3vw,3.6rem)] font-semibold leading-[1.08] mb-6">
          One patient record.
          <br />
          Three people in sync.
        </h1>
        <p className="text-[1.08rem] text-inksoft max-w-[46ch] mb-9">
          CareSync connects patients, doctors, and receptionists in one
          healthcare platform. Patients can book appointments, make payments,
          join queues, and receive prescriptions, while doctors manage
          consultations and patients, and receptionists handle bookings and
          administrative tasks.
        </p>
        <div className="flex flex-wrap gap-4">
          {user ? (
            // A logged-in user with an unknown role gets no button instead of a broken link
            button && (
              <Link to={button.to} className="btn-primary">
                {button.label}
              </Link>
            )
          ) : (
            <Link to="/login" className="btn-primary">
              Get started
            </Link>
          )}
          <a href="#how-it-works" className="btn-ghost">
            See how it works
          </a>
        </div>
      </div>

      <div
        className="flex justify-center order-first md:order-last"
        aria-hidden="true"
      >
        <SyncPulse />
      </div>
    </section>
  );
}

function SyncPulse() {
  return (
    <svg
      viewBox="0 0 480 360"
      className="w-full max-w-[440px]"
      role="img"
      aria-label="Patient, doctor and receptionist connected by a synced record"
    >
      <path
        className="stroke-brand-blue [stroke-width:2.5] [stroke-dasharray:1400] animate-sync-pulse"
        d="M60,180 C130,180 130,60 200,60 L230,60 L245,100 L260,20 L275,140 L290,60 L310,60 C380,60 380,180 420,180 C380,180 380,300 310,300 L275,300 C240,300 240,180 200,180 L60,180 Z"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[
        { cx: 60, cy: 180, label: "Patient" },
        { cx: 420, cy: 180, label: "Doctor" },
        { cx: 240, cy: 300, label: "Reception" },
      ].map((node) => (
        <g key={node.label} transform={`translate(${node.cx}, ${node.cy})`}>
          <circle className="fill-brand-teal opacity-[0.14]" r="26" />
          <circle className="fill-brand-bluedeep" r="9" />
          <text
            className="font-mono fill-inksoft"
            style={{ fontSize: "13px" }}
            y="44"
            textAnchor="middle"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}