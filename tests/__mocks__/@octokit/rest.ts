/**
 * Mock implementation of @octokit/rest for Jest tests
 * This avoids ES module import issues during testing
 */

export class Octokit {
  constructor(options?: any) {
    // Mock constructor
  }

  rest = {
    pulls: {
      list: jest.fn().mockResolvedValue({
        data: []
      }),
      create: jest.fn().mockResolvedValue({
        data: {
          number: 1,
          title: 'Test PR',
          html_url: 'https://github.com/test/repo/pull/1',
          state: 'open',
          head: { ref: 'feature-branch' },
          base: { ref: 'main' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: { login: 'testuser' }
        }
      })
    },
    repos: {
      get: jest.fn().mockResolvedValue({
        data: {
          name: 'workstation',
          owner: { login: 'creditXcredit' }
        }
      })
    }
  };
}
