import { useEffect, useState } from 'react';
import { fetchConfigByClave } from '../services';

const DEFAULT_BUSINESS_NAME = 'PrestaYa';
const CACHE_KEY = 'business_name';

export const useBusinessName = () => {
  const [businessName, setBusinessName] = useState<string>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached || DEFAULT_BUSINESS_NAME;
  });

  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const { data, error } = await fetchConfigByClave('nombre_empresa');

        if (error) return;

        const name = data?.trim();
        if (!name) return;

        setBusinessName(name);
        localStorage.setItem(CACHE_KEY, name);
      } catch {
        // Keep fallback value if query fails.
      }
    };

    fetchBusinessName();
  }, []);

  return businessName;
};
