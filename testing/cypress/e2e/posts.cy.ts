import { setupTest, teardownTest, createPost } from '../support/helpers';

describe('Posts', () => {
  beforeEach(() => {
    setupTest();
    cy.login('alice');
    cy.visit('/posts');
  });

  afterEach(() => {
    teardownTest();
  });

  it('displays the posts list', () => {
    cy.contains('Posts');
    cy.get('.post-card').should('have.length.greaterThan', 0);
  });

  it('searches posts by keyword', () => {
    cy.get('.search-input').type('TypeScript');
    cy.get('.search-form').submit();
    cy.get('.post-card').each($card => {
      cy.wrap($card).contains(/typescript/i);
    });
  });

  it('sorts posts by newest', () => {
    cy.get('.order-tab').contains('Newest').click();
    cy.get('.post-card').first().contains('Getting Started with TypeScript');
  });

  it('sorts posts by most liked', () => {
    cy.get('.order-tab').contains('Most Liked').click();
    cy.get('.post-card').first().should('exist');
  });

  it('likes and then unlikes a post', () => {
    cy.get('.post-card').first().find('[aria-label="Like"]').click();
    cy.get('.post-card').first().find('[aria-label="Unlike"]').should('exist');
    cy.get('.post-card').first().find('[aria-label="Unlike"]').click();
    cy.get('.post-card').first().find('[aria-label="Like"]').should('exist');
  });

  it('creates a new post and shows it in the list', () => {
    createPost('My New Post', 'Content of my brand new post', ['test', 'template']);
    cy.contains('My New Post');
    cy.contains('test');
  });

  it('shows empty state when search returns no results', () => {
    cy.get('.search-input').type('xyznotarealpost123');
    cy.get('.search-form').submit();
    cy.contains('No posts found');
  });
});
