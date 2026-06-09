import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useUIStore } from "../store/uiStore";

export const VisitorTracker = () => {
    const setLiveVisitorsCount = useUIStore((state) => state.setLiveVisitorsCount);

    useEffect(() => {
        const client = supabase();
        if (!client) return;

        const channel = client.channel('visitor-presence');

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const count = Object.keys(state).length;
                setLiveVisitorsCount(count);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [setLiveVisitorsCount]);

    return null;
};
