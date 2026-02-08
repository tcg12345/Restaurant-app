import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadMessageCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { data: participantRooms, error: roomsError } = await supabase
          .from('chat_room_participants')
          .select('room_id, last_read_at')
          .eq('user_id', user.id);

        if (roomsError) {
          // Table may not exist yet - silently return 0
          setUnreadCount(0);
          return;
        }

        if (!participantRooms || participantRooms.length === 0) {
          setUnreadCount(0);
          return;
        }

        let totalUnread = 0;

        for (const room of participantRooms) {
          try {
            const { count, error } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.room_id)
              .neq('sender_id', user.id)
              .gt('created_at', room.last_read_at || '1970-01-01');

            if (!error) {
              totalUnread += count || 0;
            }
          } catch {
            continue;
          }
        }

        setUnreadCount(totalUnread);
      } catch {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription - wrapped in try/catch for missing tables
    let subscription: any;
    try {
      subscription = supabase
        .channel('unread-messages')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload) => {
            if (payload.new.sender_id !== user.id) {
              try {
                const { data: participant } = await supabase
                  .from('chat_room_participants')
                  .select('last_read_at')
                  .eq('user_id', user.id)
                  .eq('room_id', payload.new.room_id)
                  .single();

                if (participant && (!participant.last_read_at || payload.new.created_at > participant.last_read_at)) {
                  setUnreadCount(prev => prev + 1);
                }
              } catch {}
            }
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_room_participants' },
          async (payload) => {
            if (payload.new.user_id === user.id) {
              fetchUnreadCount();
            }
          }
        )
        .subscribe();
    } catch {}

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user]);

  return unreadCount;
}
