import React from "react";

interface UniversalDatePickerProps {
  date: Date;
  onChange: (newDate: Date) => void;
  label?: string;
}

export default function UniversalDatePickerWeb({
  date,
  onChange,
  label,
}: UniversalDatePickerProps) {

  /**
   * HTML datetime-local expects a string like "2025-04-02T13:30"
   * We can convert our Date to that format with substring logic.
   */
  const formattedValue = date.toISOString().slice(0, 16);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // "2025-04-02T13:30"
    if (val) {
      onChange(new Date(val));
    }
  };

  return (
    <div style={{ margin: '8px 0' }}>
      {label && (
        <label
          style={{ 
            display: "block", 
            marginBottom: 4, 
            fontWeight: 600 
          }}
        >
          {label}
        </label>
      )}

      <input
        type="datetime-local"
        value={formattedValue}
        onChange={handleChange}
        style={{
          padding: "4px",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}
