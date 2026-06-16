/**
 * Shared controlled password input with an independent show/hide toggle.
 * Each instance manages its own visibility state; toggling one instance
 * never affects a sibling. The toggle is type="button" to prevent form
 * submission on click (design §4.4, AC-11, AC-21).
 */
import { useState } from 'react';

export interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error?: string;
  autocomplete?: string;
  disabled?: boolean;
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  autocomplete,
  disabled = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const errorId = `${id}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autocomplete}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={[
            'w-full rounded-md border px-3 py-2 pr-10 text-sm text-gray-900',
            error ? 'border-red-500' : 'border-gray-300',
            disabled ? 'cursor-not-allowed bg-gray-50 opacity-60' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {visible ? (
            /* Eye-slash icon — password is currently visible */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* Eye icon — password is currently masked */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
