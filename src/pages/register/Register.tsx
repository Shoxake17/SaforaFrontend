// src/pages/register/Register.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Register.css';

// ── Modular step komponentlar ────────────────────────────
import StepAccount from './StepAccountOne';
import StepService from './StepServiceTwo';
import StepBusiness from './StepBusinessThree';
import StepDetails from './StepDetailsFour';

// ── Umumiy UI komponentlar ───────────────────────────────
import StepIndicator from '../../components/UI/StepIndicator';

// ── Hooklar ──────────────────────────────────────────────
import useRegisterForm from '../../hooks/useRegisterForm';
import usePhotoUpload from '../../hooks/usePhotoUpload';

// Step label'lari — StepIndicator ga uzatamiz
const STEPS = [
  { label: 'Account' },
  { label: 'Service' },
  { label: 'Business Type' },
  { label: 'Details' },
];

// Register — Orchestrator (faqat layout + step switching)
const Register: React.FC = () => {
  const {
    currentStep,
    email,
    setEmail,
    googleUser,
    serviceType,
    setServiceType,
    businessType,
    setBusinessType,
    hotelData,
    setHotelData,
    managerData,
    setManagerData,
    formError,
    submitting,
    goStep,
    changePcCount,
    handleSubmit,
  } = useRegisterForm();

  // ── Photo upload (usePhotoUpload) ──────────────────────
  const {
    photoFiles,
    photoInputRef,
    photoZoneRef,
    handlePhotos,
    removePhoto,
  } = usePhotoUpload();

  // RENDER
  return (
    <div className="reg-page">
      {/* Background decorations */}
      <div className="reg-bg">
        <div className="reg-bg-shape reg-bg-1"></div>
        <div className="reg-bg-shape reg-bg-2"></div>
        <div className="reg-bg-shape reg-bg-3"></div>
        <div className="reg-3d-shape reg-3d-1"></div>
        <div className="reg-3d-shape reg-3d-2"></div>
      </div>

      <div className="reg-container">
        {/* Header */}
        <div className="reg-header">
          <img src="/logo.png" alt="Safora" className="reg-logo" />
          <h1 className="reg-title">Register Your Business</h1>
          <p className="reg-subtitle">
            Get started in under 2 minutes — free setup, no credit card
          </p>
        </div>

        {/* Step progress bar */}
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {/* Global error */}
        {formError && (
          <div className="reg-alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            {formError}
          </div>
        )}

        {/* ── Form ────────────────────────────────────────── */}
        <form onSubmit={(e) => handleSubmit(e, photoFiles)} noValidate>
          {/*  STEP 0 — Account */}
          {currentStep === 0 && (
            <StepAccount
              email={email}
              setEmail={setEmail}
              googleUser={googleUser}
              onContinue={() => goStep(1)}
            />
          )}

          {/* 
              STEP 1 — Service Type*/}
          {currentStep === 1 && (
            <StepService
              serviceType={serviceType}
              setServiceType={setServiceType}
              goStep={goStep}
            />
          )}

          {/* STEP 2 — Business Type*/}
          {currentStep === 2 && (
            <StepBusiness
              businessType={businessType}
              setBusinessType={setBusinessType}
              goStep={goStep}
            />
          )}

          {/* STEP 3 — Hotel + Manager Details */}
          {currentStep === 3 && (
            <StepDetails
              businessType={businessType}
              serviceType={serviceType}
              hotelData={hotelData}
              setHotelData={setHotelData}
              managerData={managerData}
              setManagerData={setManagerData}
              googleUser={googleUser}
              changePcCount={changePcCount}
              goStep={goStep}
              photoFiles={photoFiles}
              photoZoneRef={photoZoneRef}
              photoInputRef={photoInputRef}
              handlePhotos={handlePhotos}
              removePhoto={removePhoto}
              submitting={submitting}
            />
          )}
        </form>

        {/* Footer */}
        <div className="reg-footer-link">
          <Link to="/">
            <i className="fa-solid fa-arrow-left me-1"></i> Back to portal
          </Link>
        </div>

        {/* Feature strip */}
        <div className="reg-features">
          <div className="reg-feat">
            <i className="fa-solid fa-bolt"></i> Quick 2-min setup
          </div>
          <div className="reg-feat">
            <i className="fa-solid fa-shield-halved"></i> Secure &amp; private
          </div>
          <div className="reg-feat">
            <i className="fa-solid fa-robot"></i> AI-powered tools
          </div>
          <div className="reg-feat">
            <i className="fa-solid fa-headset"></i> 24/7 support
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;