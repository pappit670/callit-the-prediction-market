import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

export const useFixtures = (leagueSlug?: string) => {
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let query = supabase
            .from('football_fixtures')
            .select('*')
            .gte('fixture_date', new Date().toISOString())
            .order('fixture_date', { ascending: true })
            .limit(20);

        if (leagueSlug) query = query.eq('league_slug', leagueSlug);

        query.then(({ data }) => {
            setFixtures(data || []);
            setLoading(false);
        });
    }, [leagueSlug]);

    return { fixtures, loading };
};