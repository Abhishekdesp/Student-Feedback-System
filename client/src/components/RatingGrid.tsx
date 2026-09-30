import React from 'react';

interface RatingGridProps {
  questionId: string;
  selectedRating?: number;
  onChange: (rating: number) => void;
}

const RATING_OPTIONS = [
  { value: 5, label: 'Excellent' },
  { value: 4, label: 'Very Good' },
  { value: 3, label: 'Good' },
  { value: 2, label: 'Poor' },
  { value: 1, label: 'Bad' },
];

export const RatingGrid: React.FC<RatingGridProps> = ({ questionId, selectedRating, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-2">
      {RATING_OPTIONS.map((opt) => {
        const inputId = `rating_${questionId}_${opt.value}`;
        return (
          <label
            key={opt.value}
            htmlFor={inputId}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded border cursor-pointer text-sm font-medium transition ${
              selectedRating === opt.value
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              id={inputId}
              name={`rating_${questionId}`}
              value={opt.value}
              checked={selectedRating === opt.value}
              onChange={() => onChange(opt.value)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
};
