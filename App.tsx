
import React from 'react';
import { TrafficLight } from './components/TrafficLight';
import { CircularTimer } from './components/CircularTimer';
import { SoundMeter } from './components/SoundMeter';
import { HorizontalTimer } from './components/HorizontalTimer';
import { CleanupPlayer } from './components/CleanupPlayer';

function App() {
  return (
    <div className="min-h-screen p-8 flex flex-col gap-8 max-w-[1920px] mx-auto overflow-hidden">
      {/* Top Header Section */}
      <header className="flex justify-between items-start gap-8">
        <div className="flex flex-col gap-2">
            <h1 className="text-5xl font-black text-white drop-shadow-lg tracking-tight">Onze Klas</h1>
            <p className="text-white/80 text-xl font-medium">Veel plezier vandaag!</p>
        </div>
        
        {/* Horizontal Timer at Top Right */}
        <div className="flex-1 flex justify-end">
          <HorizontalTimer />
        </div>
      </header>

      {/* Main Widgets Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-12 items-center">
        
        {/* Left Column: Traffic Light */}
        <section className="flex flex-col items-center gap-4">
          <TrafficLight />
          <div className="bg-white/40 p-4 rounded-2xl border-2 border-white/20">
            <div className="flex gap-2 text-3xl">
              <span>👨‍🏫</span>
              <span>📚</span>
              <span>✏️</span>
            </div>
          </div>
        </section>

        {/* Center Section: Sound Meter and Circular Timer */}
        <section className="flex flex-col md:flex-row justify-around items-center gap-12 bg-white/10 p-12 rounded-[4rem] border-4 border-white/20 shadow-inner">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest opacity-80">Stopwatch</h2>
            <CircularTimer />
          </div>
          
          <div className="flex flex-col items-center gap-4">
             <h2 className="text-2xl font-bold text-white uppercase tracking-widest opacity-80">Stem Volume</h2>
             <SoundMeter />
          </div>
        </section>

        {/* Right Column: Special Buttons / Audio */}
        <section className="flex flex-col gap-6">
          <CleanupPlayer />
          
          {/* Visual Indicators/Side Widgets placeholder */}
          <div className="flex flex-col gap-4">
            <div className="bg-white/90 p-6 rounded-3xl shadow-lg border-b-8 border-gray-200 flex flex-col items-center">
               <span className="text-5xl font-bold text-gray-800">6</span>
               <span className="text-sm font-bold text-blue-500 uppercase">Maart</span>
            </div>
             <div className="bg-white/90 p-6 rounded-3xl shadow-lg border-b-8 border-gray-200 flex flex-col items-center">
               <span className="text-5xl font-bold text-gray-800">m</span>
               <span className="text-sm font-bold text-indigo-500 uppercase">Maandag</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Info */}
      <footer className="mt-auto flex justify-between items-end text-white/60">
        <div className="text-sm italic">Digibord Dashboard v1.0.0</div>
        <div className="text-sm">Klik op de widgets om instellingen te openen.</div>
      </footer>
    </div>
  );
}

export default App;
