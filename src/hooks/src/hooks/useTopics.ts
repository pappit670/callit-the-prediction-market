import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

export const useTopics = () => {
    const [topics, setTopics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('topics')
            .select('*')
            .eq('active', true)
            .order('name')
            .then(({ data }) => {
                setTopics(data || []);
                setLoading(false);
            });
    }, []);

    return { topics, loading };
};