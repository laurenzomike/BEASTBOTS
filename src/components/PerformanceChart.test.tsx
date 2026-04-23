import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PerformanceChart } from './PerformanceChart';

// Mock recharts because it uses ResizeObserver which might not be available in jsdom,
// and we just want to test if the component renders with given props.
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children, data }: any) => <div data-testid="area-chart" data-data={JSON.stringify(data)}>{children}</div>,
    Area: () => <div data-testid="area" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
  };
});

describe('PerformanceChart', () => {
  it('renders successfully with an empty data array', () => {
    const { getByTestId } = render(<PerformanceChart data={[]} />);

    // Check if the ResponsiveContainer and AreaChart are rendered
    expect(getByTestId('responsive-container')).toBeTruthy();
    expect(getByTestId('area-chart')).toBeTruthy();

    // Verify that the empty array was passed down to the mocked chart
    expect(getByTestId('area-chart').getAttribute('data-data')).toBe('[]');
  });

  it('renders successfully with data', () => {
    const data = [
      { time: '10:00', yield: 5 },
      { time: '11:00', yield: 10 }
    ];
    const { getByTestId } = render(<PerformanceChart data={data} />);

    expect(getByTestId('responsive-container')).toBeTruthy();
    expect(getByTestId('area-chart')).toBeTruthy();
    expect(getByTestId('area-chart').getAttribute('data-data')).toBe(JSON.stringify(data));
  });
});
