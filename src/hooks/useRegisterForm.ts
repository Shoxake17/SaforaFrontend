// src/hooks/useRegisterForm.ts

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { registerBusiness } from '../services/auth';
import { generateSlug } from '../utils/slug';   // ✅ YANGI — markaziy slug utility
import type {
  GoogleUser,
  HotelData,
  ManagerData,
  ServiceType,
  BusinessType,
} from '../types/register';

// ── Default values ───────────────────────────────────────
const DEFAULT_HOTEL_DATA: HotelData = {
  name: '',
  country: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  rules: '',
  portal_password: '',
  portal_password_confirm: '',
  reception_pc_count: 1,
};

const DEFAULT_MANAGER_DATA: ManagerData = {
  first_name: '',
  last_name: '',
  username: '',
  password1: '',
  password2: '',
};

// ❌ generateSlug funksiyasi BU YERDAN OLIB TASHLANDI
// ✅ Endi src/utils/slug.ts da

// ═══════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════
const useRegisterForm = () => {
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [hotelData, setHotelData] = useState<HotelData>(DEFAULT_HOTEL_DATA);
  const [managerData, setManagerData] = useState<ManagerData>(DEFAULT_MANAGER_DATA);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Google OAuth params ────────────────────────────────
  useEffect(() => {
    const googleEmail = searchParams.get('google_email');
    const googleId = searchParams.get('google_id');
    const firstName = searchParams.get('first_name') ?? '';
    const lastName = searchParams.get('last_name') ?? '';
    const photo = searchParams.get('photo') ?? '';
    const error = searchParams.get('error');

    if (error) {
      setFormError(
        error === 'google_failed'
          ? 'Google bilan kirish bekor qilindi'
          : "Tizimda xatolik. Qaytadan urinib ko'ring."
      );
      return;
    }

    if (googleEmail && googleId) {
      const user: GoogleUser = { email: googleEmail, googleId, firstName, lastName, photo };
      setGoogleUser(user);
      setEmail(googleEmail);
      setManagerData((prev) => ({
        ...prev,
        first_name: firstName,
        last_name: lastName,
        username: googleEmail
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9_.-]/g, ''),
      }));
    }
  }, [searchParams]);

  const goStep = (n: number) => {
    setCurrentStep(n);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changePcCount = (delta: number) => {
    setHotelData((prev) => ({
      ...prev,
      reception_pc_count: Math.max(1, Math.min(20, prev.reception_pc_count + delta)),
    }));
  };

  // ═══════════════════════════════════════════════════════
  // VALIDATION — Google user uchun parol IXTIYORIY
  // ═══════════════════════════════════════════════════════
  const validateStep3 = (): string | null => {
    if (!hotelData.name.trim()) return 'Business name kiritilishi shart';
    if (!hotelData.country.trim()) return 'Country kiritilishi shart';
    if (!hotelData.city.trim()) return 'City kiritilishi shart';
    if (!hotelData.address.trim()) return 'Address kiritilishi shart';
    if (!hotelData.phone.trim()) return 'Hotel phone kiritilishi shart';

    if (!hotelData.portal_password) return 'Portal password kiritilishi shart';
    if (hotelData.portal_password.length < 6)
      return "Portal password kamida 6 belgi bo'lishi kerak";
    if (hotelData.portal_password !== hotelData.portal_password_confirm)
      return 'Portal parollar mos kelmayapti';

    if (!managerData.first_name.trim()) return 'First name kiritilishi shart';
    if (!managerData.last_name.trim()) return 'Last name kiritilishi shart';
    if (!managerData.username.trim()) return 'Username kiritilishi shart';

    if (!googleUser) {
      // Email user — parol MAJBURIY
      if (!managerData.password1) return 'Password kiritilishi shart';
      if (managerData.password1.length < 6)
        return "Password kamida 6 belgi bo'lishi kerak";
      if (managerData.password1 !== managerData.password2)
        return 'Manager parollar mos kelmayapti';
    } else {
      // Google user — parol IXTIYORIY
      if (managerData.password1) {
        if (managerData.password1.length < 6)
          return "Password kamida 6 belgi bo'lishi kerak";
        if (managerData.password1 !== managerData.password2)
          return 'Manager parollar mos kelmayapti';
      }
    }

    return null;
  };

  // ═══════════════════════════════════════════════════════
  // SUBMIT
  // ═══════════════════════════════════════════════════════
  const handleSubmit = async (e: React.FormEvent, photoFiles: File[]) => {
    e.preventDefault();

    const validationError = validateStep3();
    if (validationError) {
      setFormError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setFormError('');

    const formData = new FormData();

    formData.append('service_type', serviceType ?? '');
    formData.append('business_type', businessType ?? '');

    formData.append('name', hotelData.name);
    formData.append('country', hotelData.country);
    formData.append('city', hotelData.city);
    formData.append('address', hotelData.address);
    formData.append('phone', hotelData.phone);
    formData.append('hotel_email', hotelData.email);
    formData.append('rules', hotelData.rules);
    formData.append('portal_password', hotelData.portal_password);
    formData.append('portal_password_confirm', hotelData.portal_password_confirm);
    formData.append('reception_pc_count', String(hotelData.reception_pc_count));

    formData.append('first_name', managerData.first_name);
    formData.append('last_name', managerData.last_name);
    formData.append('username', managerData.username);
    if (managerData.password1) formData.append('password1', managerData.password1);
    if (managerData.password2) formData.append('password2', managerData.password2);

    formData.append('email', email || googleUser?.email || '');
    if (googleUser) {
      formData.append('google_id', googleUser.googleId);
      formData.append('photo', googleUser.photo ?? '');
    }

    photoFiles.forEach((f) => formData.append('hotel_images', f));

    const result = await registerBusiness(formData);

    if (result.success) {
      let portalUrl: string;

      if (result.redirect) {
        portalUrl = result.redirect;
      } else if (result.hotel_slug) {
        portalUrl = `/portal/${result.hotel_slug}`;
      } else if (result.hotel?.slug) {
        portalUrl = `/portal/${result.hotel.slug}`;
      } else {
        // ✅ Markaziy slug utility'dan ishlatamiz
        const fallbackSlug = generateSlug(hotelData.name);
        portalUrl = `/portal/${fallbackSlug}`;
      }

      window.location.href = portalUrl;
    } else {
      setFormError(result.error ?? "Ro'yxatdan o'tishda xatolik");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSubmitting(false);
    }
  };

  return {
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
    setFormError,
    submitting,
    goStep,
    changePcCount,
    handleSubmit,
  };
};

export default useRegisterForm;