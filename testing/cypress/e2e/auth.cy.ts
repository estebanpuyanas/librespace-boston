import { setupTest, teardownTest } from '../support/helpers';

describe('Authentication', () => {
  beforeEach(() => {
    setupTest();
  });
  afterEach(() => {
    teardownTest();
  });

  it('shows login form on initial load', () => {
    cy.visit('/');
    cy.contains('Sign In');
    cy.get('#username').should('be.visible');
    cy.get('#password').should('be.visible');
  });

  it('logs in with valid credentials', () => {
    cy.visit('/');
    cy.get('#username').type('alice');
    cy.get('#password').type('password123');
    cy.get('[type="submit"]').click();
    cy.contains('Posts');
    cy.contains('alice');
  });

  it('shows error for invalid credentials', () => {
    cy.visit('/');
    cy.get('#username').type('alice');
    cy.get('#password').type('wrongpassword');
    cy.get('[type="submit"]').click();
    cy.contains('Invalid credentials');
  });

  it('switches to registration form', () => {
    cy.visit('/');
    cy.contains('Sign up').click();
    cy.contains('Create Account');
    cy.get('#email').should('be.visible');
  });

  it('registers a new user and lands on posts page', () => {
    cy.visit('/');
    cy.contains('Sign up').click();
    cy.get('#username').type('newuser');
    cy.get('#email').type('newuser@example.com');
    cy.get('#password').type('password123');
    cy.get('[type="submit"]').click();
    cy.contains('Posts');
  });

  it('logs out and returns to login page', () => {
    cy.login('alice');
    cy.visit('/posts');
    cy.get('[title="Logout"]').click();
    cy.contains('Sign In');
  });
});
