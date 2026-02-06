// Accessible Form Components / Barrierefreie Formular-Komponenten / Componente Formular Accesibile
// Forms with proper ARIA labels and error handling
// Formulare mit korrekten ARIA-Labels und Fehlerbehandlung
// Formulare cu etichete ARIA corecte și gestionarea erorilor

'use client';

import React, { forwardRef, useId } from 'react';
import ScreenReaderOnly, { LiveRegion } from './ScreenReaderOnly';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean;
    'aria-required': boolean;
  }) => React.ReactNode;
}

/**
 * Accessible form field wrapper
 */
export function FormField({
  label,
  error,
  hint,
  required = false,
  children,
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-1 font-medium text-white">
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
            <ScreenReaderOnly>(Pflichtfeld)</ScreenReaderOnly>
          </>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-sm text-gray-400 mb-1">
          {hint}
        </p>
      )}

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': !!error,
        'aria-required': required,
      })}

      {error && (
        <p id={errorId} className="text-sm text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Accessible text input
 */
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => {
    return (
      <FormField label={label} error={error} hint={hint} required={required}>
        {(fieldProps) => (
          <input
            ref={ref}
            {...props}
            {...fieldProps}
            className={`
              w-full px-4 py-2 
              bg-zinc-800 border border-zinc-700 
              rounded-lg text-white
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
          />
        )}
      </FormField>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

/**
 * Accessible textarea
 */
interface AccessibleTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const AccessibleTextarea = forwardRef<
  HTMLTextAreaElement,
  AccessibleTextareaProps
>(({ label, error, hint, required, className = '', ...props }, ref) => {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      {(fieldProps) => (
        <textarea
          ref={ref}
          {...props}
          {...fieldProps}
          className={`
            w-full px-4 py-2 
            bg-zinc-800 border border-zinc-700 
            rounded-lg text-white resize-y min-h-[120px]
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
        />
      )}
    </FormField>
  );
});

AccessibleTextarea.displayName = 'AccessibleTextarea';

/**
 * Accessible select
 */
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AccessibleSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({ label, options, error, hint, required, placeholder, className = '', ...props }, ref) => {
    return (
      <FormField label={label} error={error} hint={hint} required={required}>
        {(fieldProps) => (
          <select
            ref={ref}
            {...props}
            {...fieldProps}
            className={`
              w-full px-4 py-2 
              bg-zinc-800 border border-zinc-700 
              rounded-lg text-white
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        )}
      </FormField>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';

/**
 * Accessible checkbox
 */
interface AccessibleCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(
  ({ label, description, className = '', ...props }, ref) => {
    const id = useId();
    const descriptionId = `${id}-description`;

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-describedby={description ? descriptionId : undefined}
          className={`
            mt-1 w-5 h-5 
            bg-zinc-800 border-2 border-zinc-600 
            rounded text-red-500
            focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black
            ${className}
          `}
          {...props}
        />
        <div>
          <label htmlFor={id} className="font-medium text-white cursor-pointer">
            {label}
          </label>
          {description && (
            <p id={descriptionId} className="text-sm text-gray-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

AccessibleCheckbox.displayName = 'AccessibleCheckbox';

/**
 * Accessible radio group
 */
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface AccessibleRadioGroupProps {
  legend: string;
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
}

export function AccessibleRadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  required,
}: AccessibleRadioGroupProps) {
  const errorId = useId();

  return (
    <fieldset
      className="mb-4"
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="font-medium text-white mb-2">
        {legend}
        {required && (
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </legend>

      <div className="space-y-2">
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const descriptionId = `${optionId}-description`;

          return (
            <div key={option.value} className="flex items-start gap-3">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={option.disabled}
                aria-describedby={option.description ? descriptionId : undefined}
                className="
                  mt-1 w-5 h-5 
                  bg-zinc-800 border-2 border-zinc-600 
                  text-red-500
                  focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black
                "
              />
              <div>
                <label
                  htmlFor={optionId}
                  className={`
                    font-medium cursor-pointer
                    ${option.disabled ? 'text-gray-500' : 'text-white'}
                  `}
                >
                  {option.label}
                </label>
                {option.description && (
                  <p id={descriptionId} className="text-sm text-gray-400 mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-500 mt-2" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Form with live announcements
 */
interface AccessibleFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmitSuccess?: () => void;
  onSubmitError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function AccessibleForm({
  children,
  onSubmit,
  onSubmitSuccess,
  onSubmitError,
  successMessage,
  errorMessage,
  ...props
}: AccessibleFormProps) {
  const [announcement, setAnnouncement] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      await onSubmit?.(e);
      if (successMessage) {
        setAnnouncement(successMessage);
      }
      onSubmitSuccess?.();
    } catch (err) {
      const message = errorMessage || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
      setAnnouncement(message);
      onSubmitError?.(message);
    }
  };

  return (
    <form {...props} onSubmit={handleSubmit}>
      {children}
      {announcement && (
        <LiveRegion mode="assertive">{announcement}</LiveRegion>
      )}
    </form>
  );
}
