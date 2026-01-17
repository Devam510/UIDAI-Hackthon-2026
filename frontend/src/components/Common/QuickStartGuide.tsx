import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface QuickStartGuideProps {
    onClose: () => void;
}

const QuickStartGuide: React.FC<QuickStartGuideProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const steps = [
        {
            title: "Welcome to UIDAI Insight Platform",
            description: "Your AI-powered command center for Aadhaar enrollment analytics. Let's take a quick tour!",
            icon: "🎯"
        },
        {
            title: "Step 1: Select Your State",
            description: "Start by selecting a state from the dropdown on the Home page. This will load all analytics for that state.",
            icon: "🗺️"
        },
        {
            title: "Step 2: View State Overview",
            description: "Check the Overview page for KPIs, trends, and district hotspots. This gives you a complete state health snapshot.",
            icon: "📊"
        },
        {
            title: "Step 3: Check Forecast",
            description: "Visit the Forecast page to see ML-powered enrollment predictions with confidence intervals for the next 6 months.",
            icon: "🔮"
        },
        {
            title: "Step 4: Review Risk Analysis",
            description: "Explore District Risks, Biometric Risks, and Demographic Risks pages to identify problem areas and get AI recommendations.",
            icon: "⚠️"
        },
        {
            title: "Step 5: Export & Act",
            description: "Use export buttons to download data as CSV. Follow AI recommendations to deploy resources where needed most.",
            icon: "✅"
        }
    ];

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('hideQuickStartGuide', 'true');
        }
        onClose();
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-300 dark:border-primary-500/30 rounded-2xl shadow-2xl max-w-2xl w-full animate-in zoom-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="text-3xl">{steps[currentStep].icon}</span>
                        Quick Start Guide
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                            {steps[currentStep].title}
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                            {steps[currentStep].description}
                        </p>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep
                                    ? 'w-8 bg-primary-500'
                                    : index < currentStep
                                        ? 'w-2 bg-primary-400'
                                        : 'w-2 bg-slate-300 dark:bg-slate-600'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Step Counter */}
                    <p className="text-center text-slate-600 dark:text-slate-400 text-sm mb-6">
                        Step {currentStep + 1} of {steps.length}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary-500 focus:ring-2 focus:ring-primary-500"
                        />
                        Don't show this again
                    </label>

                    <div className="flex items-center gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrevious}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
                            >
                                <ChevronLeft size={18} />
                                Previous
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors shadow-lg"
                        >
                            {currentStep === steps.length - 1 ? (
                                <>
                                    <Check size={18} />
                                    Get Started
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickStartGuide;
