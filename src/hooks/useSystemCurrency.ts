import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getStoredCurrency, setStoredCurrency } from '../utils/finance';

const CONFIG_KEY = 'divisa';

export const useSystemCurrency = () => {
  const [currency, setCurrency] = useState<string>(() => getStoredCurrency());

  useEffect(() => {
    let isMounted = true;

    const fetchCurrency = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracion')
          .select('valor')
          .eq('clave', CONFIG_KEY)
          .single();

        if (error) return;

        const value = data?.valor?.trim().toUpperCase();
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
