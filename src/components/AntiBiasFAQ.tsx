import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQ_ITEMS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

export const AntiBiasFAQ: React.FC = () => {
  const [openIds, setOpenIds] = useState<string[]>(['prix-achat']);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section id="faq-preuves" className="w-full max-w-2xl mx-auto px-4 py-12 border-t border-neutral-800">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-tight">
          Trop beau pour être vrai ? Les {FAQ_ITEMS.length} vérités chiffrées
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Voitures trop chères ? En appartement sans prise ? La taxation arrive ? Ce que disent les données réelles et les études officielles.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openIds.includes(item.id);
          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-neutral-900 border-neutral-700 shadow-lg'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <button
                id={`faq-btn-${item.id}`}
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer gap-3"
              >
                <span className="font-display font-bold text-sm sm:text-base text-neutral-200 leading-snug">
                  {item.myth}
                </span>

                <div className="text-neutral-400 shrink-0">
                  {isOpen ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-neutral-800/80 bg-neutral-950/80 px-4 sm:px-5 py-4 text-xs sm:text-sm"
                  >
                    <p className="text-neutral-300 leading-relaxed mb-3">
                      {item.explanation}
                    </p>

                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Source :</span>
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline font-medium"
                      >
                        <span>{item.sourceName}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
