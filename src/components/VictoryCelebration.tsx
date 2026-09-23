import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle' | 'sparkle';
  rotation: number;
  delay: number;
  duration: number;
}

const CELEBRATION_COLORS = [
  '#10b981', // emerald-500
  '#34d399', // emerald-400
  '#059669', // emerald-600
  '#f59e0b', // amber-500
  '#fbbf24', // amber-400
  '#fcd34d', // amber-300
  '#ffffff', // white
  '#6ee7b7', // emerald-300
];

export const VictoryCelebration: React.FC = () => {
  // Générer des particules festives pseudo-aléatoires de manière stable
  const particles: Particle[] = useMemo(() => {
    const list: Particle[] = [];
    const count = 42;

    for (let i = 0; i < count; i++) {
      // Angle dispersé à 360° avec biais vers le haut
      const angle = (i / count) * 2 * Math.PI + (Math.sin(i * 13) * 0.4);
      // Distance radiale d'explosion
      const distance = 80 + (Math.abs(Math.sin(i * 7)) * 180);
      const x = Math.cos(angle) * distance;
      // Biais vers le haut pour donner un effet fontaine / feu d'artifice
      const y = Math.sin(angle) * (distance * 0.75) - 30;

      const shapes: ('rect' | 'circle' | 'sparkle')[] = ['rect', 'circle', 'sparkle'];
      const shape = shapes[i % shapes.length];
      const color = CELEBRATION_COLORS[i % CELEBRATION_COLORS.length];
      const size = 5 + (i % 6) * 1.5;

      list.push({
        id: i,
        x,
        y,
        size,
        color,
        shape,
        rotation: (i * 75) % 360,
        delay: (i % 5) * 0.04,
        duration: 1.2 + (i % 4) * 0.25,
      });
    }
    return list;
  }, []);

  return (
    <div
      aria-hidden="true"
      data-testid="victory-celebration"
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible"
    >
      {/* Onde de choc lumineuse circulaire */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0.9 }}
        animate={{ scale: [0.2, 1.8, 2.5], opacity: [0.9, 0.4, 0] }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-emerald-500/30 via-amber-400/20 to-emerald-400/0 blur-xl"
      />

      {/* Particules et confettis jaillissants */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [0, 1, 1, 0],
            scale: [0, 1.3, 1, 0.4],
            rotate: [0, p.rotation, p.rotation * 2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1], // easeOutCubic
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.5 : p.size,
            backgroundColor: p.shape !== 'sparkle' ? p.color : undefined,
            borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'rect' ? '2px' : undefined,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        >
          {p.shape === 'sparkle' && (
            <svg
              viewBox="0 0 24 24"
              width={p.size * 1.4}
              height={p.size * 1.4}
              fill={p.color}
              className="drop-shadow"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
};
