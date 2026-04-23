import { render } from '@testing-library/react';
import { PerformanceChart } from '../PerformanceChart';
import { describe, it, expect, vi } from 'vitest';

// Mock recharts components to avoid complex DOM elements and ResizeObserver issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  // Wrap AreaChart children in svg to prevent React warnings for <defs>, <linearGradient>, etc.
  AreaChart: ({ children }: any) => <svg data-testid="area-chart">{children}</svg>,
  Area: () => <g data-testid="area" />,
  XAxis: () => <g data-testid="x-axis" />,
  YAxis: () => <g data-testid="y-axis" />,
  CartesianGrid: () => <g data-testid="cartesian-grid" />,
  Tooltip: () => <g data-testid="tooltip" />,
}));

describe('PerformanceChart', () => {
  const mockData = [
    { time: '10:00', yield: 10 },
    { time: '11:00', yield: 20 },
    { time: '12:00', yield: 15 },
  ];

  it('renders correctly with data', () => {
    const { getByTestId, container } = render(<PerformanceChart data={mockData} />);

    // Check main container
    expect(container.firstChild).toHaveClass('w-full', 'h-32', 'md:h-48', 'mt-4');

    // Check chart components
    expect(getByTestId('responsive-container')).toBeInTheDocument();
    expect(getByTestId('area-chart')).toBeInTheDocument();
    expect(getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(getByTestId('x-axis')).toBeInTheDocument();
    expect(getByTestId('y-axis')).toBeInTheDocument();
    expect(getByTestId('tooltip')).toBeInTheDocument();
    expect(getByTestId('area')).toBeInTheDocument();
  });

  it('renders correctly with empty data', () => {
    const { getByTestId } = render(<PerformanceChart data={[]} />);

    expect(getByTestId('responsive-container')).toBeInTheDocument();
    expect(getByTestId('area-chart')).toBeInTheDocument();
  });
});
