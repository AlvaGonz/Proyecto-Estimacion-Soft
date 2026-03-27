import { useState, useEffect, useCallback, useRef } from 'react';
import { Round } from '../../../../types';
import { roundService } from '../services/roundService';
import { estimationService } from '../../estimations/services/estimationService';
import { projectService } from '../../projects/services/projectService';

export interface UseRoundsResult {
  rounds: Round[];
  activeRound: Round | null;
  selectedRoundId: string | null;
  setSelectedRoundId: (id: string | null) => void;
  loadRounds: (showSpinner?: boolean) => Promise<void>;
  isLoading: boolean;
  totalExperts: number;
}

export const useRounds = (projectId: string, taskId: string): UseRoundsResult => {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalExperts, setTotalExperts] = useState<number>(0);
  const autoSelectedForTask = useRef<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    projectService.getProject(projectId).then(p => {
      if (isMounted.current) setTotalExperts(p.expertIds?.length || 0);
    });
  }, [projectId]);

  const loadRounds = useCallback(async (showSpinner = true) => {
    if (!taskId || !projectId) return;

    if (showSpinner) setIsLoading(true);

    try {
      const allRounds = await roundService.getRoundsByTask(projectId, taskId);
      const taskRounds = allRounds.filter(r => String(r.taskId) === String(taskId));

      if (isMounted.current) {
        setRounds(prev => {
          if (JSON.stringify(prev) === JSON.stringify(taskRounds)) return prev;
          return taskRounds;
        });

        const active = taskRounds.find(r => r.status === 'open') || null;
        setActiveRound(active);

        // Auto-select latest round
        if (autoSelectedForTask.current !== taskId && taskRounds.length > 0) {
          const latestId = active?.id || (active as any)?._id || 
            (taskRounds[taskRounds.length - 1].id || (taskRounds[taskRounds.length - 1] as any)._id);
          setSelectedRoundId(latestId);
          autoSelectedForTask.current = taskId;
        }

        if (!active && taskRounds.length > 0 && !selectedRoundId) {
          const lastClosed = taskRounds[taskRounds.length - 1];
          const roundId = lastClosed.id || (lastClosed as any)._id;
          setSelectedRoundId(roundId);
        }
      }
    } catch (err) {
      console.error("Error loading rounds", err);
    } finally {
      if (isMounted.current && showSpinner) setIsLoading(false);
    }
  }, [projectId, taskId, selectedRoundId]);

  useEffect(() => {
    loadRounds(true);
  }, [loadRounds]);

  useEffect(() => {
    if (!activeRound) return;
    const pollInterval = setInterval(() => {
      loadRounds(false);
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [loadRounds, activeRound]);

  return {
    rounds,
    activeRound,
    selectedRoundId,
    setSelectedRoundId,
    loadRounds,
    isLoading,
    totalExperts
  };
};
