/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CampaignCard from '../components/CampaignCard';

const mockCampaign = {
  id: 1,
  title: 'Build a Stellar Dev Toolkit',
  creator: 'GB3Z...WAFO',
  goal: 5000,
  raised: 3200,
  deadline: '2026-12-31',
  claimed: false,
};

describe('CampaignCard', () => {
  test('renders campaign title', () => {
    render(<CampaignCard campaign={mockCampaign} onContribute={() => {}} isLoading={false} />);
    expect(screen.getByText('Build a Stellar Dev Toolkit')).toBeInTheDocument();
  });

  test('renders contribute button', () => {
    render(<CampaignCard campaign={mockCampaign} onContribute={() => {}} isLoading={false} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('calls onContribute when button clicked', () => {
    const mockContribute = jest.fn();
    render(<CampaignCard campaign={mockCampaign} onContribute={mockContribute} isLoading={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockContribute).toHaveBeenCalledTimes(1);
  });

  test('shows correct percentage', () => {
    render(<CampaignCard campaign={mockCampaign} onContribute={() => {}} isLoading={false} />);
    expect(screen.getByText(/64%/)).toBeInTheDocument();
  });

  test('disables button when loading', () => {
    render(<CampaignCard campaign={mockCampaign} onContribute={() => {}} isLoading={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('shows claimed state correctly', () => {
    render(<CampaignCard campaign={{ ...mockCampaign, claimed: true }} onContribute={() => {}} isLoading={false} />);
    expect(screen.getByText(/Claimed/)).toBeInTheDocument();
  });
});
