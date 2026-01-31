/**
 * Lead Capture Form Component
 * Collects visitor information for follow-up
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface LeadCaptureFormProps {
  language: "en" | "es";
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    userType: "tenant" | "landlord" | "both";
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const translations = {
  en: {
    title: "Get in Touch",
    subtitle: "We'd love to hear from you",
    name: "Full Name",
    namePlaceholder: "John Doe",
    email: "Email Address",
    emailPlaceholder: "john@example.com",
    phone: "Phone Number",
    phonePlaceholder: "+1 (555) 123-4567",
    userType: "I am a...",
    tenant: "Tenant",
    landlord: "Landlord",
    both: "Both",
    submit: "Submit",
    cancel: "Cancel",
    required: "This field is required",
    invalidEmail: "Please enter a valid email",
    invalidPhone: "Please enter a valid phone number",
  },
  es: {
    title: "Ponte en Contacto",
    subtitle: "Nos encantaría saber de ti",
    name: "Nombre Completo",
    namePlaceholder: "Juan Pérez",
    email: "Correo Electrónico",
    emailPlaceholder: "juan@ejemplo.com",
    phone: "Número de Teléfono",
    phonePlaceholder: "+34 123 456 789",
    userType: "Soy un...",
    tenant: "Inquilino",
    landlord: "Propietario",
    both: "Ambos",
    submit: "Enviar",
    cancel: "Cancelar",
    required: "Este campo es obligatorio",
    invalidEmail: "Por favor, ingresa un correo válido",
    invalidPhone: "Por favor, ingresa un número de teléfono válido",
  },
};

export default function LeadCaptureForm({
  language,
  onSubmit,
  onCancel,
  isLoading = false,
}: LeadCaptureFormProps) {
  const t = translations[language];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "both" as "tenant" | "landlord" | "both",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t.required;
    }

    if (!formData.email.trim()) {
      newErrors.email = t.required;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t.invalidEmail;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t.required;
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t.invalidPhone;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Failed to submit form:", error);
      setErrors({
        submit: "Failed to submit form. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border rounded-lg p-4 shadow-sm m-2">
      <div className="text-center mb-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.title}</h3>
        <p className="text-sm text-slate-500">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            {t.name}
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t.namePlaceholder}
            className={`h-9 text-sm ${errors.name ? "border-red-500" : ""}`}
            disabled={isSubmitting || isLoading}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            {t.email}
          </label>
          <Input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t.emailPlaceholder}
            className={`h-9 text-sm ${errors.email ? "border-red-500" : ""}`}
            disabled={isSubmitting || isLoading}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            {t.phone}
          </label>
          <Input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t.phonePlaceholder}
            className={`h-9 text-sm ${errors.phone ? "border-red-500" : ""}`}
            disabled={isSubmitting || isLoading}
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* User Type */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            {t.userType}
          </label>
          <Select
            value={formData.userType}
            onValueChange={(val) => 
              setFormData(prev => ({ ...prev, userType: val as any }))
            }
            disabled={isSubmitting || isLoading}
          >
            <SelectTrigger className="h-9 text-sm w-full">
              <SelectValue placeholder={t.userType} />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="tenant">{t.tenant}</SelectItem>
              <SelectItem value="landlord">{t.landlord}</SelectItem>
              <SelectItem value="both">{t.both}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <p className="text-xs text-red-500 text-center">{errors.submit}</p>
        )}

        {/* Form Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
            className="flex-1 h-9 text-xs"
          >
            {t.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="flex-1 h-9 text-xs bg-cyan-500 hover:bg-cyan-600"
          >
            {isSubmitting || isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              t.submit
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
