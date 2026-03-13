import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

export const useCrypto = () => {
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchPrices = async () => {
        const { data } = await supabase
            .from('crypto_prices')
            .select('*')
            .order('fetched_at', { ascending: false });

        const seen = new Set();
        const latest = (data || []).filter(p => {
            if (seen.has(p.coin_id)) return false;
            seen.add(p.coin_id);
            return true;
        });

        setPrices(latest);
        setLoading(false);
    };

    return { prices, loading };
};