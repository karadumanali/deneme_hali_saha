import React from 'react';
import { Calendar, Clock, CreditCard } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { id: 1, title: 'Tarih & Saha', icon: Calendar },
  { id: 2, title: 'Saat Seçimi', icon: Clock },
  { id: 3, title: 'Ödeme & Dekont', icon: CreditCard }
];

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center px-2 sm:px-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : isCompleted
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`mt-2 text-xs sm:text-sm font-medium text-center whitespace-nowrap ${
                  isActive ? 'text-emerald-600' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 sm:w-16 h-0.5 mx-2 sm:mx-4 transition-colors ${
                  isCompleted ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;