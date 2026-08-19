// Shared test helpers — imported directly by spec files.
// Keep UI actions here so spec bodies stay readable.

const API = Cypress.env('API_URL') ?? 'http://localhost:8000/api';

// Reset DB to a known state before each test.
// Your server should expose POST /api/test/seed (only in NODE_ENV=test).
export const setupTest = (): void => {
  cy.request('POST', `${API}/test/seed`);
};

export const teardownTest = (): void => {
  cy.request('POST', `${API}/test/cleanup`);
};

// Full UI login (use cy.login() command for speed in tests that don't test auth itself)
export const loginViaUI = (username: string, password = 'password123'): void => {
  cy.visit('/');
  cy.get('#username').type(username);
  cy.get('#password').type(password);
  cy.get('[type="submit"]').click();
  cy.contains(username);
};

export const createPost = (title: string, content: string, tags: string[]): void => {
  cy.contains('New Post').click();
  cy.get('[data-cy="post-title"]').type(title);
  cy.get('[data-cy="post-content"]').type(content);
  tags.forEach(tag => cy.get('[data-cy="post-tags"]').type(`${tag}{enter}`));
  cy.get('[data-cy="submit-post"]').click();
};
