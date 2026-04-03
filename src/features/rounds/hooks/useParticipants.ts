import { useState, useEffect } from 'react';
import { userService } from '../../users/services/userService';

export interface ParticipantInfo {
  name: string;
  avatar?: string;
}

/**
 * Hook to fetch and map expert IDs to their display names and avatars.
 * Used to avoid generic "Expert X" labels and show real participant names.
 */
export const useParticipants = (expertIds: string[] = []) => {
  const [participants, setParticipants] = useState<Record<string, ParticipantInfo>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!expertIds || expertIds.length === 0) {
      setParticipants({});
      return;
    }

    // Sort to ensure stable effect dependency
    const sortedIds = [...expertIds].sort();
    const idsKey = sortedIds.join(',');

    const fetchParticipants = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.all(
          sortedIds.map(id => 
            userService.getUserById(id)
              .then(u => ({ id: u.id, name: u.name, avatar: (u as any).avatar }))
              .catch(() => ({ id, name: 'Experto', avatar: undefined }))
          )
        );

        const pMap: Record<string, ParticipantInfo> = {};
        results.forEach(u => {
          if (u) {
            pMap[u.id] = { name: u.name, avatar: u.avatar };
          }
        });

        setParticipants(pMap);
      } catch (err) {
        console.error('useParticipants: Error fetching participant details', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [expertIds.length === 0 ? '' : [...expertIds].sort().join(',')]);

  return { participants, isLoading };
};
