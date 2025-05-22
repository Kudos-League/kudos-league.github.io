import React from "react";

type Feat = {
  location: string;
  date: Date;
  placement: number;
  description: string;
};

const userFeats: Feat[] = [
  {
    location: "Denver",
    date: new Date(2023, 11, 1), // December 2023
    placement: 2,
    description: "Most Kudos in Dec",
  },
  {
    location: "Denver",
    date: new Date(2023, 4, 1), // May 2023
    placement: 10,
    description: "Most Kudos in May",
  },
  {
    location: "Denver",
    date: new Date(2024, 0, 1), // Jan 2024
    placement: 18,
    description: "Most Kudos in 2024",
  },
];

const Achievements: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-4 justify-center my-6">
      {userFeats.map((feat, i) => (
        <div
          key={i}
          className="relative bg-blue-50 p-4 rounded-lg w-48 text-center border border-blue-200 shadow-sm"
        >
          <div className="text-sm font-semibold text-blue-800">
            {feat.location}
          </div>
          <div className="text-xs text-gray-500 mb-1">
            {feat.date.toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
          </div>
          <div className="text-xs text-gray-700">{feat.description}</div>
          <div className="absolute -top-3 -right-3 bg-black text-white text-xs w-7 h-7 flex items-center justify-center rounded-full shadow-md">
            {feat.placement === 1
              ? "🥇"
              : feat.placement === 2
              ? "🥈"
              : feat.placement === 3
              ? "🥉"
              : `${feat.placement}th`}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Achievements;
