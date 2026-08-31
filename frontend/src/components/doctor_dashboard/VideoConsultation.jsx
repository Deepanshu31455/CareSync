import React from 'react'
import { ArrowLeft, Video} from 'lucide-react';


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
const VideoConsultation = ({view,setView}) => {
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
            Video Consultations
          </h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ backgroundColor: COLORS.blueSoft }}
          >
            <Video size={26} style={{ color: COLORS.blue }} />
          </div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.navy }}
          >
            No video consultations set up yet
          </h3>
          <p className="text-sm text-center max-w-sm" style={{ color: COLORS.textMuted }}>
            This view is a placeholder for now — the video queue, call links, and follow-up
            scheduling will live here.
          </p>
        </div>
      </div>
  )
}

export default VideoConsultation
