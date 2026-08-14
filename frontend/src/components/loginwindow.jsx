import { Link } from "react-router-dom";
import RoleLoginCard from "../components/auth/RoleLoginCard";
import SyncLine from "../components/auth/SyncLine";
import { roles } from "../config/roles";

export default function FirstPage() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="section-inner">
        <div className="mx-auto max-w-[640px] text-center">
          <p className="eyebrow justify-center flex">CareSync</p>
          <h1 className="text-[clamp(1.9rem,1.3rem+2.2vw,2.9rem)] font-medium leading-[1.15]">
            One record. Three roles. Always in sync.
          </h1>
          <p className="mt-4 text-[1.02rem] text-inksoft">
            Sign in with the account that matches how you use CareSync.
          </p>
        </div>

        <div className="relative mt-14">
          <SyncLine />
          <div className="relative grid gap-6 md:grid-cols-3">
            {roles.map((role) => (
              <RoleLoginCard key={role.id} role={role} />
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-[0.92rem] text-inksoft">
          Not registered yet?{" "}
          <Link to="/register" className="font-semibold text-brand-blue hover:text-brand-bluedeep">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
