import { useState } from "react";

const faqs = [
  {
    q: "Who can see a patient's medical history?",
    a: "Only the patient, and any doctor they see through the platform. Receptionists can see appointment and contact details, not clinical history.",
  },
  {
    q: "Do I need to visit in person every time?",
    a: "No. The usual flow is a physical visit first, so the doctor can examine you directly, then video visits for the follow-ups that don't need an exam room.",
  },
  {
    q: "What happens to my data if I switch doctors?",
    a: "Your history stays attached to your account, not to a single doctor's clinic, so a new doctor can see the same record with your permission.",
  },
  {
    q: "Can a receptionist edit medical records?",
    a: "No. Receptionists manage scheduling and registration only. Medical history can only be added to or edited by a doctor.",
  },
  {
    q: "Is CareSync built for a single clinic or a chain?",
    a: "Both. A single clinic can run on it as-is, and a multi-branch clinic can manage receptionists and doctors across every location it operates in.",
  },
];

export default function FirstPage_FAQ() {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <section id="faq" className="section-inner">
      <p className="eyebrow">Questions</p>
      <h2 className="section-title">Before you ask</h2>

      <div className="max-w-[760px]">
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className="border-b border-border">
              <button
                className="w-full bg-transparent border-none py-5 px-1 flex items-center justify-between gap-4 text-left text-[1.02rem] font-medium text-ink"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
              >
                {item.q}
                <span className="font-mono text-brand-blue shrink-0" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <p className="px-1 pb-5 max-w-[62ch] m-0 text-inksoft">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

//code of component reruns when values of usestate hook changes
