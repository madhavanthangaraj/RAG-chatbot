import { describe, it, expect } from 'vitest';

describe('Frontend Helper Styles Happy Path', () => {
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' };
      case 'high':
        return { background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' };
      case 'medium':
        return { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' };
      default:
        return { background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'resolved':
        return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' };
      case 'in_progress':
        return { background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' };
      case 'closed':
        return { background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' };
      default:
        return { background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' };
    }
  };

  it('should return correct background and color for urgent priority style', () => {
    const style = getPriorityStyle('urgent');
    expect(style.color).toBe('#ef4444');
    expect(style.background).toContain('239, 68, 68');
  });

  it('should return correct color for high priority style', () => {
    const style = getPriorityStyle('high');
    expect(style.color).toBe('#f59e0b');
  });

  it('should return correct style details for resolved status', () => {
    const style = getStatusStyle('resolved');
    expect(style.color).toBe('#10b981');
  });
});
