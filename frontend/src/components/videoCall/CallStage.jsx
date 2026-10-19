import { useEffect, useRef } from "react";
import { Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";

// Attaches a MediaStream to a <video> element
function Feed({ stream, muted, mirror, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={`${mirror ? "-scale-x-100" : ""} ${className}`} />;
}

const PHASE_TEXT = {
  preparing: "Starting your camera and microphone...",
  waiting: "Waiting for the other person to join...",
  connecting: "Connecting the video...",
};

// The video area of a call: the other person large, you small in the corner, and the buttons.
//   call   the object returned by useVideoCall
//   otherName   shown under the video
//   children    extra buttons for the right side of the control bar (for example "End call" for the doctor)
export default function CallStage({ call, otherName, children }) {
  const { phase, notice, localStream, remoteStream, micOn, camOn, hasCamera, toggleMic, toggleCam } = call;
  const showRemote = remoteStream && phase === "connected";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
        {remoteStream && <Feed stream={remoteStream} className={`h-full w-full object-cover ${showRemote ? "" : "opacity-0"}`} />}

        {!showRemote && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-slate-200">
            <Loader2 size={28} className="animate-spin text-slate-400" />
            <p className="text-sm">{PHASE_TEXT[phase] || PHASE_TEXT.connecting}</p>
          </div>
        )}

        {localStream && (
          <div className="absolute bottom-3 right-3 h-24 w-36 overflow-hidden rounded-xl border-2 border-white/70 bg-slate-800 shadow-lg sm:h-32 sm:w-48">
            {camOn ? (
              <Feed stream={localStream} muted mirror className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-300">Camera off</div>
            )}
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">{otherName}</span>
      </div>

      {notice && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={toggleMic}
          aria-pressed={!micOn}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
            micOn ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {micOn ? <Mic size={16} /> : <MicOff size={16} />} {micOn ? "Mute" : "Unmute"}
        </button>
        <button
          onClick={toggleCam}
          disabled={!hasCamera}
          title={!hasCamera ? "No camera was found" : undefined}
          aria-pressed={!camOn}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
            camOn ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {camOn ? <Video size={16} /> : <VideoOff size={16} />} {camOn ? "Camera off" : "Camera on"}
        </button>
        {children}
      </div>
    </div>
  );
}

