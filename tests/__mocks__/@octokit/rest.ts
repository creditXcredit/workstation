/**
 * Mock for @octokit/rest package
 * Provides minimal mock implementation for testing
 */

export class Octokit {
  constructor(options?: any) {
    // Mock constructor
  }

  pulls = {
    list: jest.fn().mockResolvedValue({ data: [] }),
    create: jest.fn().mockResolvedValue({ data: { number: 1, html_url: 'https://github.com/test/test/pull/1' } }),
    get: jest.fn().mockResolvedValue({ data: { number: 1, state: 'open' } }),
    update: jest.fn().mockResolvedValue({ data: { number: 1, state: 'closed' } }),
  };

  repos = {
    get: jest.fn().mockResolvedValue({ data: { name: 'test-repo', full_name: 'test/test-repo' } }),
    listBranches: jest.fn().mockResolvedValue({ data: [] }),
  };

  git = {
    getRef: jest.fn().mockResolvedValue({ data: { ref: 'refs/heads/main', object: { sha: 'abc123' } } }),
  };
}

export default { Octokit };
