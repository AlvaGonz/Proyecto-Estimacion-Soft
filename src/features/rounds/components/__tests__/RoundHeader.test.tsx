import { render, screen } from '@testing-library/react';
import { RoundHeader } from '../RoundHeader';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('RoundHeader', () => {
  const defaultProps = {
    rounds: [],
    selectedRoundId: null,
    onSelectRound: vi.fn(),
    activeTab: 'round' as const,
    setActiveTab: vi.fn()
  };

  it('RED: shows empty state message when rounds list is empty', () => {
    render(<RoundHeader {...defaultProps} />);
    
    // This should fail because it doesn't exist yet
    expect(screen.getByText(/Sin rondas activas/i)).toBeDefined();
  });
});
