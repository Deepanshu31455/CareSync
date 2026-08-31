import { Link } from "react-router-dom";
import logo from "../assets/NewLogo.png";

const services = [
  "Patient records",
  "In-person visits",
  "Video consultations",
  "Front-desk scheduling",
];

const cities = ["Delhi NCR", "Agra", "Mumbai", "Bengaluru"];

const legal = ["Privacy policy", "Terms of service", "Data protection", "Refund policy"];

export default function FirstPage_Footer() {
  return (
    <footer className="bg-brand-bluedeep text-[#cddcf5]">
      <div className="max-w-content mx-auto px-6 md:px-8 grid md:grid-cols-5 gap-8 pt-16 pb-10">
        <div className="md:col-span-1">
          <img
            src={logo}
            alt="CareSync logo"
            className="h-6 mb-4 brightness-0 invert"
          />
          <p className="text-[#a9bde3] text-[0.92rem] max-w-[32ch]">
            CareSync keeps patients, doctors and receptionists working off
            one shared record — from the front desk to the follow-up call.
          </p>
        </div>

        <div id="contact">
          <h4 className="font-mono text-[0.78rem] tracking-[0.08em] uppercase text-[#7fa0dc] mb-4">
            Contact us
          </h4>
          <ul className="space-y-2.5">
            <li>
              <a href="mailto:deep3.36ojha@gmail.com" className="text-[0.92rem] hover:text-white">
                deep3.36ojha@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+917983187046" className="text-[0.92rem] hover:text-white">
                +91 7983187046
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-[0.78rem] tracking-[0.08em] uppercase text-[#7fa0dc] mb-4">
            Services
          </h4>
          <ul className="space-y-2.5">
            {services.map((s) => (
              <li key={s} className="text-[0.92rem]">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-[0.78rem] tracking-[0.08em] uppercase text-[#7fa0dc] mb-4">
            Presence
          </h4>
          <ul className="space-y-2.5">
            {cities.map((c) => (
              <li key={c} className="text-[0.92rem]">
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-[0.78rem] tracking-[0.08em] uppercase text-[#7fa0dc] mb-4">
            Trust &amp; legal
          </h4>
          <ul className="space-y-2.5">
            {legal.map((l) => (
              <li key={l}>
                <Link to="/TrustAndLegal" className="text-[0.92rem] hover:text-white">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-8 py-5 text-center text-[0.82rem] text-[#7fa0dc]">
        <p className="m-0">© {new Date().getFullYear()} CareSync. All rights reserved.</p>
      </div>
    </footer>
  );
}
