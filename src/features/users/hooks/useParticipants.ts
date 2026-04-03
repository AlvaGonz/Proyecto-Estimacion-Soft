import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../../../types';
import { userService } from '../services/userService';

export const useParticipants = (userIds: string[] = []) => {
  const [participants, setParticipants] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptedIds = useRef(new Set<string>());

  const fetchParticipants = useCallback(async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    
    // Mark as attempted before async to prevent race conditions during loop
    ids.forEach(id => attemptedIds.current.add(id));
    
    setLoading(true);
    setError(null);
    try {
      const uniqueIds = Array.from(new Set(ids)).filter(id => id && typeof id === 'string' && !id.includes('[object'));
      
      // Fetch each user
      const userPromises = uniqueIds.map(id => 
        userService.getUserById(id).catch(err => {
          console.warn(`Failed to fetch user ${id}:`, err);
          return null;
        })
      );
      
      const results = await Promise.all(userPromises);
      const newUserMap: Record<string, User> = {};
      
      results.forEach(user => {
        if (user) {
          newUserMap[user.id] = user;
        }
      });
      
      if (Object.keys(newUserMap).length > 0) {
        setParticipants(prev => ({ ...prev, ...newUserMap }));
      }
    } catch (err) {
      console.error('Error in useParticipants:', err);
      setError('Error al cargar participantes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userIds && userIds.length > 0) {
      const missingIds = userIds.filter(id => !participants[id] && !attemptedIds.current.has(id));
      if (missingIds.length > 0) {
        fetchParticipants(missingIds);
      }
    }
  }, [JSON.stringify(userIds), fetchParticipants]); // Removed participants from dependencies

  const getParticipant = (id: string): User | null => {
    return participants[id] || null;
  };

  const getParticipantName = (id: string, fallback: string = 'Usuario'): string => {
    return participants[id]?.name || fallback;
  };

  const refresh = useCallback(() => {
    if (userIds && userIds.length > 0) {
      userIds.forEach(id => attemptedIds.current.delete(id));
      fetchParticipants(userIds);
    }
  }, [userIds, fetchParticipants]);

  return {
    participants,
    loading,
    error,
    getParticipant,
    getParticipantName,
    refresh
  };
};
