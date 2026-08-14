import logo from "../assets/NewLogo.png";

export default function FirstPage_Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-md border-b border-border">
      <div className="max-w-content mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        <a href="#top" className="shrink-0" aria-label="CareSync home">
          <img src={logo} alt="CareSync logo" className="h-10 w-auto " />
        </a>

        <nav className="flex items-center gap-4 md:gap-6" aria-label="Primary">
          <a
            href="#contact"
            className="font-medium text-inksoft hover:text-brand-blue transition-colors"
          >
            Contact
          </a>
          <a
            href="/login"
            className="font-semibold px-5 py-2.5 rounded-full bg-ink text-white transition-all duration-150 hover:bg-brand-bluedeep hover:-translate-y-0.5"
          >
            Log in
          </a>
        </nav>
      </div>
    </header>
  );
}
