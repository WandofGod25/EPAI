import React from 'react';
import { render, screen } from '@testing-library/react';
import { UsageStats } from './UsageStats';

// Mock the useUsageStats hook
jest.mock('@/hooks/useUsageStats', () => ({
  useUsageStats: jest.fn()
}));

import { useUsageStats } from '@/hooks/useUsageStats';

describe('UsageStats', () => {
  const mockUseUsageStats = useUsageStats as jest.MockedFunction<typeof useUsageStats>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    mockUseUsageStats.mockReturnValue({
      stats: null,
      loading: true,
      error: null
    });

    render(<UsageStats />);
    
    // Should render 3 skeleton loaders
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(3);
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to load usage stats';
    mockUseUsageStats.mockReturnValue({
      stats: null,
      loading: false,
      error: errorMessage
    });

    render(<UsageStats />);
    
    expect(screen.getByText('Error Loading Stats')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders stats correctly', () => {
    const mockStats = {
      total_ingestion_events: 150,
      total_insights_generated: 75,
      latest_event_timestamp: '2023-06-15T12:30:45Z'
    };
    
    mockUseUsageStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null
    });

    render(<UsageStats />);
    
    expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Ingestion Events')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Total Insights Generated')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Last Event Received')).toBeInTheDocument();
    
    // Format the date for comparison - this will depend on the user's locale
    const formattedDate = new Date('2023-06-15T12:30:45Z').toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('renders nothing when stats is null', () => {
    mockUseUsageStats.mockReturnValue({
      stats: null,
      loading: false,
      error: null
    });

    const { container } = render(<UsageStats />);
    
    // The component should render nothing
    expect(container.firstChild).toBeNull();
  });
}); 