
import React, { useEffect, useState } from 'react';
import { Scale, Shield } from 'lucide-react';

interface SplashScreenProps {
    onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        // Sequence of animations
        // 0: Initial State (Blank)
        // 1: Icon Scales Up (300ms)
        // 2: Icon Pulses/Settles & Text Slides In (1000ms)
        // 3: Fade Out (2500ms)

        const t1 = setTimeout(() => setStage(1), 100);
        const t2 = setTimeout(() => setStage(2), 800);
        const t3 = setTimeout(() => onFinish(), 2500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [onFinish]);

    return (
        <div className={`fixed inset-0 z-[100] bg-slate-50 dark:bg-dark-950 flex flex-col items-center justify-center transition-opacity duration-700 ${stage >= 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

            <div className="relative flex items-center justify-center">
                {/* Background Glow */}
                <div className={`absolute w-32 h-32 bg-primary-500/20 rounded-full blur-2xl transition-all duration-1000 ${stage >= 1 ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />

                {/* Main Icon (Scale or Shield) */}
                <div className={`relative z-10 p-4 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-xl shadow-primary-600/30 text-white transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${stage >= 1 ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-12'}`}>
                    <Scale size={48} strokeWidth={1.5} />
                </div>
            </div>

            {/* Text Reveal */}
            <div className="mt-6 text-center overflow-hidden">
                <h1 className={`text-4xl font-bold text-slate-900 dark:text-white tracking-tight transition-all duration-1000 transform ${stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    LexPrime
                </h1>
                <p className={`mt-2 text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] transition-all duration-1000 delay-200 transform ${stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
                    Advocacia
                </p>
            </div>

            {/* Loading Bar / Footer */}
            <div className={`mt-12 w-48 h-1 bg-slate-200 dark:bg-dark-800 rounded-full overflow-hidden transition-all duration-500 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="h-full bg-primary-500 animate-loading-bar" />
            </div>

        </div>
    );
};
