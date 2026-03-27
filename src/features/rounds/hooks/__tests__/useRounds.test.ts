import { renderHook, waitFor } from '@testing-library/react';
import { useRounds } from '../useRounds';
import { roundService } from '../../services/roundService';
import { projectService } from '../../../projects/services/projectService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../services/roundService');
vi.mock('../../../projects/services/projectService');

describe('useRounds', () => {
  const mockProjectId = 'p1';
  const mockTaskId = 't1';
  const mockRounds = [
    { id: 'r1', taskId: 't1', status: 'closed', roundNumber: 1 },
    { id: 'r2', taskId: 't1', status: 'open', roundNumber: 2 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (projectService.getProject as any).mockResolvedValue({ expertIds: ['e1', 'e2'] });
    (roundService.getRoundsByTask as any).mockResolvedValue(mockRounds);
  });

  it('RED: should auto-select the active round when task changes', async () => {
    const { result } = renderHook(() => useRounds(mockProjectId, mockTaskId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // This should FAIL because I deleted the auto-selection logic
    expect(result.current.selectedRoundId).toBe('r2');
  });
});
