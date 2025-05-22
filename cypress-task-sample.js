// Test for task creation and management
describe('Task Management', () => {
  beforeEach(() => {
    // Log in before each test
    cy.visit('http://localhost:3000/login')
    cy.get('[data-testid=email-input]').type('admin@taskmaster.com')
    cy.get('[data-testid=password-input]').type('admin123')
    cy.get('[data-testid=login-button]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should create a new task', () => {
    // Navigate to task creation
    cy.get('[data-testid=create-task-button]').click()
    
    // Fill out task form
    cy.get('[data-testid=task-title]').type('Test Task from E2E')
    cy.get('[data-testid=task-description]').type('This is a test task created via automated testing')
    cy.get('[data-testid=task-priority]').select('high')
    
    // Set due date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formattedDate = tomorrow.toISOString().split('T')[0]
    cy.get('[data-testid=task-due-date]').type(formattedDate)
    
    // Save task
    cy.get('[data-testid=save-task-button]').click()
    
    // Verify task was created
    cy.get('[data-testid=task-list]').should('contain', 'Test Task from E2E')
    cy.get('[data-testid=high-priority-indicator]').should('be.visible')
  })

  it('should mark a task as complete', () => {
    // Find our test task and mark it complete
    cy.get('[data-testid=task-list]').contains('Test Task from E2E')
      .parent()
      .find('[data-testid=complete-task-checkbox]')
      .click()
    
    // Verify task is marked as complete
    cy.get('[data-testid=task-list]').contains('Test Task from E2E')
      .parent()
      .should('have.class', 'completed-task')
  })

  it('should filter tasks by priority', () => {
    // Filter by high priority
    cy.get('[data-testid=priority-filter]').select('high')
    
    // Verify our high priority task is visible
    cy.get('[data-testid=task-list]').should('contain', 'Test Task from E2E')
    
    // Change filter to low priority
    cy.get('[data-testid=priority-filter]').select('low')
    
    // Verify our high priority task is not visible
    cy.get('[data-testid=task-list]').should('not.contain', 'Test Task from E2E')
  })

  it('should delete a task', () => {
    // Find and delete our test task
    cy.get('[data-testid=task-list]').contains('Test Task from E2E')
      .parent()
      .find('[data-testid=delete-task-button]')
      .click()
    
    // Confirm deletion in modal
    cy.get('[data-testid=confirm-delete-button]').click()
    
    // Verify task is removed
    cy.get('[data-testid=task-list]').should('not.contain', 'Test Task from E2E')
  })
})
