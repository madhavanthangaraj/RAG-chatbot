import { describe, it, expect, vi } from 'vitest';

// Mock config/db to avoid database connections
vi.mock('../backend/src/config/db', () => ({}));

import kbRepository from '../backend/src/repositories/kb.repository';

describe('Backend Fallback Search with Vitest', () => {
  const mockArticles = [
    { id: '1', title: 'Reset Student Password', content: 'Follow these steps to recover or reset your login password.', effectiveness_score: 4.5 },
    { id: '2', title: 'Submitting Feedback & Suggestions', content: 'We welcome student suggestions on fees, portal, hostel issues.', effectiveness_score: 5.0 },
    { id: '3', title: 'Instructions to Pay Student Fees', content: 'Online payment instructions for tuition fees and hostel bills.', effectiveness_score: 3.8 }
  ];

  it('should match exact keywords in title with boost', async () => {
    kbRepository.listArticles = vi.fn().mockResolvedValue(mockArticles);
    const results = await kbRepository.searchArticles('how to reset password');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Reset Student Password');
  });

  it('should resolve matching content keywords', async () => {
    kbRepository.listArticles = vi.fn().mockResolvedValue(mockArticles);
    const results = await kbRepository.searchArticles('student suggestions');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Submitting Feedback & Suggestions');
  });

  it('should sort results by density and fallback to effectiveness score', async () => {
    kbRepository.listArticles = vi.fn().mockResolvedValue(mockArticles);
    const results = await kbRepository.searchArticles('hostel');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].title).toBe('Submitting Feedback & Suggestions');
    expect(results[1].title).toBe('Instructions to Pay Student Fees');
  });
});
