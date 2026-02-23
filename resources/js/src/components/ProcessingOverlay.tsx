import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import processingAnimation from '../assets/animation/dataprocessing.json';

interface ProcessingOverlayProps {
    isOpen: boolean;
    text?: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ isOpen, text }) => {
    const [statusText, setStatusText] = useState(text || 'Analyzing Data...');

    // Cycle through texts to make it feel alive
    useEffect(() => {
        if (!isOpen) return;

        const texts = [
            'Analyzing Data...',
            'Extracting Insights...',
            'Calculating Metrics...',
            'Identifying Top Content...',
            'Generating Visualizations...',
            'Finalizing Report...'
        ];

        let currentIndex = 0;
        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % texts.length;
            setStatusText(texts[currentIndex]);
        }, 2000);

        return () => clearInterval(interval);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/90 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative max-w-sm w-full flex flex-col items-center"
                    >
                        {/* Lottie Animation */}
                        <div className="w-64 h-64 md:w-80 md:h-80">
                            <Lottie
                                animationData={processingAnimation}
                                loop={true}
                                autoplay={true}
                            />
                        </div>

                        {/* Text Animation */}
                        <motion.div
                            key={statusText}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="text-xl md:text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-4"
                        >
                            {statusText}
                        </motion.div>

                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            This typically takes a few seconds
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProcessingOverlay;
