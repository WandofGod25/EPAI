import type { Meta, StoryObj } from '@storybook/react-vite';
import { InsightCard } from '../InsightCard';

const meta: Meta<typeof InsightCard> = {
  title: 'SDK/InsightCard',
  component: InsightCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleInsight = {
  title: 'Predicted Attendance',
  icon: 'chart',
  confidence: 0.92,
  value: '487',
  description: 'Based on historical data and current registrations, we predict 487 attendees for your upcoming event.',
  generatedDate: new Date().toLocaleDateString(),
  modelVersion: 'AttendancePredictor v1.2'
};

export const Standard: Story = {
  args: {
    data: sampleInsight
  },
};

export const DarkTheme: Story = {
  args: {
    data: sampleInsight,
    theme: 'dark'
  },
};

export const Compact: Story = {
  args: {
    data: sampleInsight,
    compact: true
  },
};

export const NoConfidence: Story = {
  args: {
    data: sampleInsight,
    showConfidence: false
  },
}; 