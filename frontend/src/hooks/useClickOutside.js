// import { useEffect, useRef } from "react";

// /**
//  * Calls `onOutsideClick` when a click/touch happens outside the returned ref's element.
//  * @param {(event: MouseEvent | TouchEvent) => void} onOutsideClick
//  * @param {boolean} enabled - only attaches listeners while true (e.g. menuOpen)
//  * @returns {React.RefObject}
//  */
// export default function useOutsideClick(onOutsideClick, enabled = true) {
//   const ref = useRef(null);

//   useEffect(() => {
//     if (!enabled) return;

//     function handleClick(event) {
//       if (ref.current && !ref.current.contains(event.target)) {
//         onOutsideClick(event);
//       }
//     }

//     document.addEventListener("mousedown", handleClick);
//     document.addEventListener("touchstart", handleClick);

//     return () => {
//       document.removeEventListener("mousedown", handleClick);
//       document.removeEventListener("touchstart", handleClick);
//     };
//   }, [onOutsideClick, enabled]);

//   return ref;
// }