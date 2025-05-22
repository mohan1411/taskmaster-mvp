// Basic login test
describe('TaskMaster Basic Test', () => {
  it('should load the login page', () => {
    // Visit the login page
    cy.visit('http://localhost:3000/login')
    
    // Check if the page contains text indicating it's a login page
    cy.contains('Login', { matchCase: false })
      .should('be.visible')
  })

  it('should attempt to login', () => {
    // Visit login page
    cy.visit('http://localhost:3000/login')
    
    // Type in credentials (using simpler selector approach)
    cy.get('input').first().type('mohan.g1411@gmail.com')
    cy.get('input[type="password"]').type('Raptor$75')
    
    // Find and click login button by its content
    cy.contains('Sign In', { matchCase: false })
      .click()
    
    // Wait for dashboard page to load
    cy.wait(3000)
    
    // Take a screenshot after login attempt
    cy.screenshot('after-login-attempt')
  })
})
