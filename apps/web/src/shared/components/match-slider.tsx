"use client";

interface MatchSliderProps {
  value: number;
  onChange: (val: number) => void;
}

export function MatchSlider({ value, onChange }: MatchSliderProps) {
  return (
    <div className="flex flex-col space-y-1 w-full">
      <div className="flex justify-between items-center text-sm font-medium text-[#1B2632]">
        <span>Coincidencia técnica mínima</span>
        <span className="font-bold text-[#1B2632] bg-[#FFB162] px-2.5 py-0.5 rounded-md">
          {value}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Coincidencia técnica mínima"
        className="w-full h-2 bg-[#EEE9DF] rounded-lg appearance-none cursor-pointer accent-[#FFB162]"
      />
      <div className="flex justify-between text-[11px] text-gray-500 font-medium">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}