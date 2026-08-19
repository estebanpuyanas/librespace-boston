// Cypress custom commands
// Docs: https://on.cypress.io/custom-commands

// cy.login() — logs in via API, bypassing the UI.
// Use this in tests that don't specifically test authentication to save time.
Cypress.Commands.add('login', (username, password = 'password123') => {
  cy.request('POST', `${Cypress.env('API_URL')}/auth/login`, { username, password }).then(
    ({ body }) => {
      localStorage.setItem('token', body.token);
      localStorage.setItem('user', JSON.stringify(body.user));
    },
  );
});

// cy.logout()
Cypress.Commands.add('logout', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
});
