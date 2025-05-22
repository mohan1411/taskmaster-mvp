describe('TaskMaster Login with Debugging', () => {
  beforeEach(() => {
    // Intercept all API requests related to login
    cy.intercept('POST', '**/api/auth/login').as('loginRequest')
    cy.intercept('GET', '**/login**').as('loginPageLoad')
    cy.intercept('GET', '**/dashboard**').as('dashboardLoad')
  })

  it('should login with detailed logging', () => {
    // Visit login page and confirm it loads
    cy.visit('http://localhost:3000/login')
    cy.wait('@loginPageLoad')
    cy.screenshot('login-page')
    
    // Fill in credentials
    cy.get('input[type="text"]').clear().type('mohan.g1411@gmail.com')
    cy.get('input[type="password"]').clear().type('Raptor$75')
    cy.screenshot('filled-form')
    
    // Click sign in button
    cy.get('button').contains('Sign In').click()
    
    // Wait for login request and log it
    cy.wait('@loginRequest', { timeout: 10000 }).then(interception => {
      console.log('Login Request:', {
        url: interception.request.url,
        body: interception.request.body,
        method: interception.request.method
      })
      
      console.log('Login Response:', {
        statusCode: interception.response?.statusCode,
        body: interception.response?.body,
        headers: interception.response?.headers
      })
      
      if (interception.response?.statusCode !== 200) {
        cy.screenshot('login-failed')
      }
    })
    
    // Check current URL after login attempt 
    cy.url().then(url => {
      console.log('Current URL after login attempt:', url)
      cy.screenshot('after-login-attempt')
    })
    
    // Look for error messages on the page
    cy.get('body').then($body => {
      const bodyText = $body.text()
      console.log('Body text snippet:', bodyText.substring(0, 200))
      if (bodyText.includes('Invalid') || bodyText.includes('error') || bodyText.includes('failed')) {
        console.log('Possible error message detected:', bodyText)
      }
    })
  })
})