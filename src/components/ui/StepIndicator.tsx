// src/components/ui/StepIndicator.tsx

import React from 'react';

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => (
  <div className="reg-steps">
    {steps.map((step, idx) => (
      <React.Fragment key={idx}>
        <div
          className={[
            'reg-step-item',
            idx === currentStep ? 'active' : '',
            idx < currentStep ? 'done' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="reg-step-num">
            {idx < currentStep ? (
              <i className="fa-solid fa-check" style={{ fontSize: 10 }} />
            ) : (
              idx + 1
            )}
          </div>
          <span>{step.label}</span>
        </div>

        {idx < steps.length - 1 && (
          <div className={`reg-step-line ${idx < currentStep ? 'done' : ''}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default StepIndicator;