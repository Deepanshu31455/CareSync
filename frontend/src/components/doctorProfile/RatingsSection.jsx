import { Star } from "lucide-react";
import { Section } from "./ui";



function Stars({ value }) {
  return (
    <div className="mb-2 flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={
            n <= Math.round(value || 0)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
          }
        />
      ))}
    </div>
  );
}

export default function RatingsSection({ rating, reviews }) {
  return (
    <Section title="Ratings & Patient Reviews" icon={Star}>
      <div className="mb-5 rounded-xl bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <Star size={26} className="fill-amber-400 text-amber-400" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{rating.rating} / 5</p>
            <p className="text-sm text-gray-600">
              Based on {rating.totalRatings} ratings
            </p>
          </div>
        </div>
      </div>

      <h3 className="mb-3 font-semibold text-gray-800">Patient Reviews</h3>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No patient reviews yet.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-gray-200 p-4"
            >
              <Stars value={review.rating} />

              <p className="text-sm leading-6 text-gray-600">"{review.comment}"</p>

              <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span className="font-medium text-gray-800">{review.author}</span>
                <span>{review.date}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
