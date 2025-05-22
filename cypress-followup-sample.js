// Test for follow-up functionalities
describe('Follow-up Management', () => {
  beforeEach(() => {
    // Log in before each test
    cy.visit('http://localhost:3000/login')
    cy.get('[data-testid=email-input]').type('admin@taskmaster.com')
    cy.get('[data-testid=password-input]').type('admin123')
    cy.get('[data-testid=login-button]').click()
    cy.url().should('include', '/dashboard')
    
    // Navigate to follow-ups section
    cy.get('[data-testid=followups-tab]').click()
  })

  it('should create a new follow-up', () => {
    // Click create follow-up button
    cy.get('[data-testid=create-followup-button]').click()
    
    // Fill out follow-up form
    cy.get('[data-testid=followup-title]').type('Test Follow-up from E2E')
    cy.get('[data-testid=followup-description]').type('This is a test follow-up created via automated testing')
    
    // Select associated email if applicable
    if (cy.get('[data-testid=associated-email-dropdown]').should('exist')) {
      cy.get('[data-testid=associated-email-dropdown]').click()
      cy.get('[data-testid=email-option]').first().click()
    }
    
    // Set reminder date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formattedDate = tomorrow.toISOString().split('T')[0]
    cy.get('[data-testid=followup-date]').type(formattedDate)
    
    // Save follow-up
    cy.get('[data-testid=save-followup-button]').click()
    
    // Verify follow-up was created
    cy.get('[data-testid=followup-list]').should('contain', 'Test Follow-up from E2E')
  })

  it('should mark a follow-up as completed', () => {
    // Find our test follow-up and mark it complete
    cy.get('[data-testid=followup-list]').contains('Test Follow-up from E2E')
      .parent()
      .find('[data-testid=complete-followup-button]')
      .click()
    
    // Verify follow-up is marked as complete
    cy.get('[data-testid=followup-list]').contains('Test Follow-up from E2E')
      .parent()
      .should('have.class', 'completed-followup')
  })

  it('should filter follow-ups by status', () => {
    // Filter by completed status
    cy.get('[data-testid=status-filter]').select('completed')
    
    // Verify our completed follow-up is visible
    cy.get('[data-testid=followup-list]').should('contain', 'Test Follow-up from E2E')
    
    // Change filter to pending status
    cy.get('[data-testid=status-filter]').select('pending')
    
    // Verify our completed follow-up is not visible
    cy.get('[data-testid=followup-list]').should('not.contain', 'Test Follow-up from E2E')
  })

  it('should link a follow-up to a task', () => {
    // Create a task first
    cy.get('[data-testid=tasks-tab]').click()
    cy.get('[data-testid=create-task-button]').click()
    cy.get('[data-testid=task-title]').type('Test Task for Follow-up Link')
    cy.get('[data-testid=save-task-button]').click()
    
    // Go back to follow-ups
    cy.get('[data-testid=followups-tab]').click()
    
    // Find our test follow-up and open it for editing
    cy.get('[data-testid=followup-list]').contains('Test Follow-up from E2E')
      .parent()
      .find('[data-testid=edit-followup-button]')
      .click()
    
    // Link to the task
    cy.get('[data-testid=link-task-dropdown]').click()
    cy.get('[data-testid=task-option]').contains('Test Task for Follow-up Link').click()
    
    // Save changes
    cy.get('[data-testid=save-followup-button]').click()
    
    // Verify link was created by checking for link indicator
    cy.get('[data-testid=followup-list]').contains('Test Follow-up from E2E')
      .parent()
      .find('[data-testid=linked-task-indicator]')
      .should('be.visible')
  })

  it('should delete a follow-up', () => {
    // Find and delete our test follow-up
    cy.get('[data-testid=followup-list]').contains('Test Follow-up from E2E')
      .parent()
      .find('[data-testid=delete-followup-button]')
      .click()
    
    // Confirm deletion in modal
    cy.get('[data-testid=confirm-delete-button]').click()
    
    // Verify follow-up is removed
    cy.get('[data-testid=followup-list]').should('not.contain', 'Test Follow-up from E2E')
    
    // Also clean up the task we created
    cy.get('[data-testid=tasks-tab]').click()
    cy.get('[data-testid=task-list]').contains('Test Task for Follow-up Link')
      .parent()
      .find('[data-testid=delete-task-button]')
      .click()
    cy.get('[data-testid=confirm-delete-button]').click()
  })
})
