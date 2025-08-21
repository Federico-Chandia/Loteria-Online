import { useState, useEffect } from 'react';

// Hook para debounce de validaciones
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para validaciones pesadas con debounce
export const useValidationDebounce = (validationFn, dependencies, delay = 300) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const debouncedDeps = useDebounce(dependencies, delay);

  useEffect(() => {
    if (!debouncedDeps) return;

    setIsValidating(true);
    
    const validate = async () => {
      try {
        const result = await validationFn(debouncedDeps);
        setValidationResult(result);
      } catch (error) {
        setValidationResult({ isValid: false, errors: [error.message] });
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [debouncedDeps, validationFn]);

  return { isValidating, validationResult };
};