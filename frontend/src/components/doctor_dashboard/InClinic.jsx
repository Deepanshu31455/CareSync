import React from 'react'
import { ArrowLeft,Stethoscope } from 'lucide-react';


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
const InClinic = ({setView,view}) => {
  return (
      <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: COLORS.bg, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
      `}</style>
      <div
        className="flex items-center gap-4 px-6 py-4 border-b"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
      >
        <button
          onClick={() => setView('selector')}
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: COLORS.textMuted }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.navy }}
        >
          Physical Consultations
        </h2>
      </div>
      






    </div>
  )
}

export default InClinic
