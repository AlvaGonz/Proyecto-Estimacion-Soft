import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThreePointInput from '../ThreePointInput';

const defaultProps = {
  values: { optimistic: '' as number | '', mostLikely: '' as number | '', pessimistic: '' as number | '' },
  justification: '',
  unit: 'Horas',
  onChange: () => {},
};

function TestWrapper({
  initialValues = defaultProps.values,
}: {
  initialValues?: { optimistic: number | ''; mostLikely: number | ''; pessimistic: number | '' };
}) {
  const [values, setValues] = useState(initialValues);
  const [justification, setJustification] = useState('');
  return (
    <ThreePointInput
      values={values}
      justification={justification}
      unit="Horas"
      onChange={(v, j) => {
        setValues(v);
        setJustification(j);
      }}
    />
  );
}

describe('ThreePointInput', () => {
  it('calculates E = (O + 4M + P) / 6 correctly — O=2, M=5, P=14 → E=6', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const oInput = screen.getByPlaceholderText('O');
    const mInput = screen.getByPlaceholderText('M');
    const pInput = screen.getByPlaceholderText('P');

    await user.type(oInput, '2');
    await user.type(mInput, '5');
    await user.type(pInput, '14');

    expect(await screen.findByText(/6\.00/)).toBeInTheDocument();
  });

  it('calculates σ = (P - O) / 6 correctly — O=2, P=14 → σ=2', async () => {
    const user = userEvent.setup();

    render(
      <ThreePointInput
        {...defaultProps}
        values={{ optimistic: 2, mostLikely: 5, pessimistic: 14 }}
        onChange={() => {}}
      />
    );

    expect(screen.getByText(/2\.00/)).toBeInTheDocument();
  });

  it('validates O ≤ M ≤ P — O=10, M=5, P=14 shows error on optimistic', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const oInput = screen.getByPlaceholderText('O');
    const mInput = screen.getByPlaceholderText('M');
    const pInput = screen.getByPlaceholderText('P');

    await user.type(oInput, '10');
    await user.type(mInput, '5');
    await user.type(pInput, '14');

    expect(screen.getByRole('alert')).toHaveTextContent(/O debe ser ≤ M/i);
  });

  it('shows correct 68% range [E-σ, E+σ] — O=2, M=5, P=14 → [4.00, 8.00]', async () => {
    render(
      <ThreePointInput
        {...defaultProps}
        values={{ optimistic: 2, mostLikely: 5, pessimistic: 14 }}
        onChange={() => {}}
      />
    );

    expect(screen.getByText(/4\.00/)).toBeInTheDocument();
    expect(screen.getByText(/8\.00/)).toBeInTheDocument();
  });
});
