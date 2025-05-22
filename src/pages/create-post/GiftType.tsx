import React from "react";

const GiftType = ({ selected, onSelect }: { selected: string; onSelect: (type: string) => void }) => {
  const options = ["Gift", "Donation"];

  return (
    <div className="flex border rounded-full overflow-hidden">
      {options.map((option, i) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`flex-1 py-2 text-sm font-medium ${
            selected === option ? "bg-purple-100 text-purple-800" : "bg-white text-gray-800"
          } ${i === 0 ? "rounded-l-full" : ""} ${i === options.length - 1 ? "rounded-r-full" : ""}`}
        >
          {selected === option && "✔ "} {option}
        </button>
      ))}
    </div>
  );
};

export default GiftType;
