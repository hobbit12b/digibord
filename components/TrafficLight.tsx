
import React, { useState } from 'react';
import { TrafficLightColor } from '../types';

export const TrafficLight: React.FC = () => {
  const [active, setActive] = useState<TrafficLightColor>(TrafficLightColor.GREEN);

  const toggle = (color: TrafficLightColor) => {
    setActive(prev => prev === color ? TrafficLightColor.OFF : color);
  };

  return (
    <div className="bg-black rounded-full p-6 flex flex-col gap-4 border-4 border-gray-300 shadow-2xl w-48 items-center">
      <button 
        onClick={() => toggle(TrafficLightColor.RED)}
        className={`w-24 h-24 rounded-full border-4 border-gray-700 transition-all duration-300 shadow-inner ${
          active === TrafficLightColor.RED ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.8)]' : 'bg-gray-800'
        }`}
      />
      <button 
        onClick={() => toggle(TrafficLightColor.ORANGE)}
        className={`w-24 h-24 rounded-full border-4 border-gray-700 transition-all duration-300 shadow-inner ${
          active === TrafficLightColor.ORANGE ? 'bg-orange-400 shadow-[0_0_40px_rgba(251,146,60,0.8)]' : 'bg-gray-800'
        }`}
      />
      <button 
        onClick={() => toggle(TrafficLightColor.GREEN)}
        className={`w-24 h-24 rounded-full border-4 border-gray-700 transition-all duration-300 shadow-inner ${
          active === TrafficLightColor.GREEN ? 'bg-green-500 shadow-[0_0_40px_rgba(34,197,94,0.8)]' : 'bg-gray-800'
        }`}
      />
    </div>
  );
};
