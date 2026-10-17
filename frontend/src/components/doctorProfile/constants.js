import { API_BASE } from "../../config";

export const BASE = API_BASE;

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DEFAULT_OPEN = "09:00 AM";
export const DEFAULT_CLOSE = "05:00 PM";

export const DEFAULT_FACILITIES = [
  "Wheelchair Accessible",
  "On-site Pharmacy",
  "ECG & Ultrasound",
  "Digital Check-in",
  "Free Parking",
  "Emergency Triage",
];

export const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100";

export const cardClass = "rounded-2xl border border-gray-200 bg-white p-5 sm:p-6";

// Change these if your routes are different.



//dummy reviews and rating
// Sample data. Replace with real data from your backend when it's ready.
export const DUMMY_RATING = {
  rating: 4.6,
  totalRatings: 128,
};

export const DUMMY_REVIEWS = [
  {
    id: 1,
    author: "Rohit Sharma",
    rating: 5,
    comment:
      "Very patient and explained everything clearly. The clinic was clean and well organised.",
    date: "2 weeks ago",
  },
  {
    id: 2,
    author: "Anjali Verma",
    rating: 5,
    comment: "Short waiting time and a very friendly staff. Highly recommended.",
    date: "1 month ago",
  },
  {
    id: 3,
    author: "Karan Singh",
    rating: 4,
    comment:
      "Good diagnosis and helpful advice. Parking can be a little difficult at peak hours.",
    date: "2 months ago",
  },
  {
    id: 4,
    author: "Pooja Gupta",
    rating: 4,
    comment: "Doctor listens carefully. The online appointment booking was smooth.",
    date: "3 months ago",
  },
];
