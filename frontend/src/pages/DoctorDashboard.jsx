import React, { useState } from 'react';
import {Video, Stethoscope } from 'lucide-react';
import InClinic from '../components/doctor_dashboard/InClinic';
import VideoConsultation from '../components/doctor_dashboard/VideoConsultation';

/* =========================================================
   DATA — kept separate from the component logic below.
   In your real project, move this block into its own
   file (e.g. doctorDashboardData.js) and import it.
   ========================================================= */

const COLORS = {
  bg: '#F4F7F5',
  navy: '#0B1E3D',
  blue: '#1746A2',
  blueSoft: '#EAF2FF',
  teal: '#0F8C7C',
  tealSoft: '#EAF6F0',
  amber: '#B5651D',
  amberSoft: '#FDF1E7',
  card: '#FFFFFF',
  border: '#E1E7E4',
  text: '#101828',
  textMuted: '#5B6B67',
};

/* =========================================================
   COMPONENT
   ========================================================= */

function PulseLine({ color = COLORS.blue, height = 40 }) {
  return (
    <svg viewBox="0 0 200 40" width="100%" height={height} preserveAspectRatio="none">
      <polyline
        points="0,20 60,20 75,5 90,35 105,20 200,20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DoctorDashboard() {
  const [view, setView] = useState('selector'); // 'selector' | 'physical' | 'video'

  /* ---------------- SELECTOR SCREEN ---------------- */

  if (view === 'selector') {
    return (
      <div
        className="min-h-screen w-full flex flex-col md:flex-row"
        style={{ backgroundColor: COLORS.bg, fontFamily: "'Inter', sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        `}</style>

        <button
          onClick={() => setView('physical')}
          className="w-full md:w-1/2 min-h-[45vh] md:min-h-screen flex flex-col justify-center items-start p-10 md:p-16 text-left transition-transform duration-300 hover:scale-[1.01]"
          style={{ backgroundColor: COLORS.card }}
        >
          <span
            className="text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: COLORS.teal, letterSpacing: '0.15em' }}
          >
            01 · In clinic
          </span>
          <div className="flex items-center gap-3 mb-4" style={{ color: COLORS.blue }}>
            <Stethoscope size={32} strokeWidth={1.75} />
            <h1
              className="text-4xl md:text-5xl font-semibold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.navy }}
            >
              Physical
              <br />
              Consultations
            </h1>
          </div>
          <p className="text-base mt-2 max-w-sm" style={{ color: COLORS.textMuted }}>
            Today's in-person queue — full patient history, vitals, and prescriptions in one screen.
          </p>
          <div className="w-40 mt-6"><PulseLine color={COLORS.blue} /></div>
        </button>

        <button
          onClick={() => setView('video')}
          className="w-full md:w-1/2 min-h-[45vh] md:min-h-screen flex flex-col justify-center items-start p-10 md:p-16 text-left transition-transform duration-300 hover:scale-[1.01]"
          style={{ backgroundColor: COLORS.navy }}
        >
          <span
            className="text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: '#7FD8C8', letterSpacing: '0.15em' }}
          >
            02 · Remote
          </span>
          <div className="flex items-center gap-3 mb-4" style={{ color: '#FFFFFF' }}>
            <Video size={32} strokeWidth={1.75} />
            <h1
              className="text-4xl md:text-5xl font-semibold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#FFFFFF' }}
            >
              Video
              <br />
              Consultations
            </h1>
          </div>
          <p className="text-base mt-2 max-w-sm" style={{ color: '#AFC0D6' }}>
            Follow-ups and remote visits. Nothing is recorded or stored.
          </p>
          <div className="w-40 mt-6"><PulseLine color="#7FD8C8" /></div>
        </button>
      </div>
    );
  }

  /* ---------------- VIDEO CONSULTATIONS (empty) ---------------- */

  if (view === 'video') {
    return (
        <VideoConsultation view={view} setView={setView}/>
    );
  }

  /* ---------------- PHYSICAL CONSULTATIONS (empty) ---------------- */

  return (
    <InClinic view={view} setView={setView}/>
  );
}
