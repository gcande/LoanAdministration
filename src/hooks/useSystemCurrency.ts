import { useEffect, useState } from 'react';
import { fetchConfigByClave } from '../services';
import { getStoredCurrency, setStoredCurrency } from '../utils/finance';

const CONFIG_KEY = 'divisa';

export const useSystemCurrency = () => {
  const [currency, setCurrency] = useState<string>(() => getStoredCurrency());

  useEffect(() => {
    let isMounted = true;

    const fetchCurrency = async () => {
      try {
        const rawValue = await fetchConfigByClave(CONFIG_KEY);
        const value = rawValue?.trim().toUpperCase();
        if (!value) return;

        setStoredCurrency(value);
        if (isMounted) setCurrency(value);
      } catch {
        // Keep cached value.
      }
    };

    fetchCurrency();

    return () => {
      isMounted = false;
    };
  }, []);

  return currency;
};
