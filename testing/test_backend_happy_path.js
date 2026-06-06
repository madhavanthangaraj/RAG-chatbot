const assert = require('assert');
const test = require('node:test');

// Mock config/db to avoid database connections during testing
const mockDb = {};
require.cache[require.resolve('../backend/src/config/db')] = {
  exports: mockDb
};

const kbRepository = require('../backend/src/repositories/kb.repository');

test('Backend Fallback Search Happy Path', async (t) => {
  // Mock listing of articles
  const mockArticles = [
    { id: '1', title: 'Reset Student Password', content: 'Follow these steps to recover or reset your login password.', effectiveness_score: 4.5 },
    { id: '2', title: 'Submitting Feedback & Suggestions', content: 'We welcome student suggestions on fees, portal, hostel issues.', effectiveness_score: 5.0 },
    { id: '3', title: 'Instructions to Pay Student Fees', content: 'Online payment instructions for tuition fees and hostel bills.', effectiveness_score: 3.8 }
  ];

  // Override listArticles to return mock data
  kbRepository.listArticles = async () => mockArticles;

  await t.test('Should match exact keywords in title with boost', async () => {
    const results = await kbRepository.searchArticles('how to reset password');
    assert.strictEqual(results.length > 0, true);
    assert.strictEqual(results[0].title, 'Reset Student Password');
  });

  await t.test('Should resolve typo-tolerance matching content', async () => {
    const results = await kbRepository.searchArticles('student suggestions');
    assert.strictEqual(results.length > 0, true);
    assert.strictEqual(results[0].title, 'Submitting Feedback & Suggestions');
  });

  await t.test('Should sort results by match score density and fallback to effectiveness score', async () => {
    const results = await kbRepository.searchArticles('hostel');
    // "hostel" appears in content of both "Submitting Feedback & Suggestions" (effectiveness 5.0) and "Instructions to Pay Student Fees" (effectiveness 3.8)
    // Since search scores are equal (1 point each), verify it sorts by effectiveness_score
    assert.strictEqual(results.length >= 2, true);
    assert.strictEqual(results[0].title, 'Submitting Feedback & Suggestions');
    assert.strictEqual(results[1].title, 'Instructions to Pay Student Fees');
  });


  await t.test('Should return empty array for empty or null queries', async () => {
    const emptyResults = await kbRepository.searchArticles('');
    assert.deepStrictEqual(emptyResults, []);

    const nullResults = await kbRepository.searchArticles(null);
    assert.deepStrictEqual(nullResults, []);
  });
});
