import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

export const useOpinions = (topicSlug?: string) => {
    const [opinions, setOpinions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOpinions();
        const channel = supabase
            .channel('opinions_feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'opinions' }, () => {
                fetchOpinions();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [topicSlug]);

    const fetchOpinions = async () => {
        try {
            let query = supabase
                .from('opinions_feed')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (topicSlug && topicSlug !== 'trending') {
                query = query.eq('topic_slug', topicSlug);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOpinions(data || []);
        } catch (e: any) {
            setError(e.message);
            console.error('Failed to fetch opinions:', e);
        } finally {
            setLoading(false);
        }
    };

    return { opinions, loading, error, refetch: fetchOpinions };
};