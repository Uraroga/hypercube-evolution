
import React, { useState, useMemo, useEffect } from 'react';
import { HYPERCUBE_NAMES, DIMENSION_COLORS } from './constants';
import type { Point2D, PointND, Edge } from './types';

// Optimized helper function to generate n-dimensional hypercube vertices and edges.
const generateHypercube = (dimension: number): { vertices: PointND[], edges: Edge[] } => {
  if (dimension < 1) {
    if (dimension === 0) return { vertices: [[0]], edges: [] };
    return { vertices: [], edges: [] };
  }

  const numVertices = 1 << dimension;
  const vertices: PointND[] = [];
  for (let i = 0; i < numVertices; i++) {
    const point: number[] = [];
    for (let j = 0; j < dimension; j++) {
      point.push((i >> j) & 1 ? 0.5 : -0.5); // Use -0.5 to 0.5 range
    }
    vertices.push(point);
  }

  const edges: Edge[] = [];
  for (let i = 0; i < numVertices; i++) {
    for (let j = 0; j < dimension; j++) {
      const neighbor = i ^ (1 << j);
      if (i < neighbor) {
        edges.push([i, neighbor]);
      }
    }
  }

  return { vertices, edges };
};


interface HypercubeVisualizerProps {
  dimension: number;
  size: number;
  color: string;
}

const HypercubeVisualizer: React.FC<HypercubeVisualizerProps> = ({ dimension, size, color }) => {
  const { vertices: nDVertices, edges } = useMemo(() => generateHypercube(dimension), [dimension]);

  const projectedVertices = useMemo(() => {
    if (dimension === 0) return [{ x: 0, y: 0 }];
    
    // Simple projection for low dimensions
    if (dimension === 1) return [{ x: -size/2, y: 0 }, { x: size/2, y: 0 }];
    if (dimension === 2) {
        return [
            { x: -size / 2, y: -size / 2 },
            { x:  size / 2, y: -size / 2 },
            { x: -size / 2, y:  size / 2 },
            { x:  size / 2, y:  size / 2 },
        ];
    }


    return nDVertices.map(point => {
      let x = 0;
      let y = 0;
      // Perspective projection for higher dimensions
      for (let k = 0; k < dimension; k++) {
        const angle = (Math.PI * k) / (dimension - 1.5);
        x += point[k] * Math.cos(angle);
        y += point[k] * Math.sin(angle);
      }
      // Adjusted scaling factor to ensure the hypercube fits within the viewbox.
      // The original factor's reduction was not aggressive enough for higher dimensions.
      const scaleFactor = size * 2.2 / (dimension - 1);
      return { x: x * scaleFactor, y: y * scaleFactor };
    });
  }, [nDVertices, dimension, size]);

  if (!projectedVertices.length) {
    return null;
  }

  return (
    <div className="w-full h-full flex items-center justify-center fade-in">
      <svg width="100%" height="100%" viewBox="-120 -120 240 240" preserveAspectRatio="xMidYMid meet">
        <g stroke={color} strokeWidth="1" strokeLinecap="round" className="transition-all duration-500">
          {edges.map(([i, j], index) => {
            const p1 = projectedVertices[i];
            const p2 = projectedVertices[j];
            if (!p1 || !p2) return null;
            return <line key={index} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
          })}
        </g>
         <g fill={color} className="transition-all duration-500">
            {projectedVertices.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2" />
            ))}
        </g>
      </svg>
    </div>
  );
};

const PlayIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8 5v14l11-7z"></path></svg>
);
const PauseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
);
const ResetIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"></path></svg>
);


const App: React.FC = () => {
  const [dimension, setDimension] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    if (isPlaying) {
      const interval = 3000 / speed;
      const timer = setTimeout(() => {
        setDimension(d => (d >= 9 ? 2 : d + 1));
      }, interval);
      return () => clearTimeout(timer);
    }
  }, [dimension, isPlaying, speed]);

  const handleReset = () => {
    setIsPlaying(false);
    setDimension(2);
  };
  
  const currentColor = DIMENSION_COLORS[dimension] || '#ffffff';

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Hypercube Evolution
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Visualizing Dimensions from Square to Enneract</p>
        </header>

        <main className="w-full aspect-square bg-gray-900/50 rounded-2xl shadow-2xl shadow-black/50 border border-gray-700/50 p-2 sm:p-4 flex items-center justify-center">
          <HypercubeVisualizer
            key={dimension}
            dimension={dimension}
            size={100}
            color={currentColor}
          />
        </main>

        <footer className="w-full mt-8 p-6 bg-gray-800/40 rounded-xl border border-gray-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="text-center md:text-left flex-1">
              <div className="text-sm text-gray-400">Dimension</div>
              <div className="text-2xl font-bold transition-colors duration-500" style={{ color: currentColor }}>
                {dimension}D - {HYPERCUBE_NAMES[dimension]}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/70 transition-colors text-gray-300 hover:text-white"
                  aria-label="Reset animation"
                >
                  <ResetIcon />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors text-white shadow-lg shadow-purple-500/30"
                  aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-400 hidden sm:inline">Speed</span>
                 <input
                    type="range"
                    min="0.5"
                    max="4"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-24 sm:w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                        accentColor: currentColor,
                    }}
                 />
              </div>
            </div>
          </div>
        </footer>
        
      </div>
    </div>
  );
};

export default App;
