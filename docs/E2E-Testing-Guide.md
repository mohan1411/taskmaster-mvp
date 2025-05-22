# Step-by-Step Guide: E2E Testing with Cypress for TaskMaster

This guide will walk you through implementing end-to-end (E2E) testing for the TaskMaster application using Cypress.

## Table of Contents
1. [What is E2E Testing?](#what-is-e2e-testing)
2. [Getting Started with Cypress](#getting-started-with-cypress)
3. [Creating Your First Test](#creating-your-first-test)
4. [Finding Elements on the Page](#finding-elements-on-the-page)
5. [Writing Tests for Core Functionality](#writing-tests-for-core-functionality)
6. [Debugging Tests](#debugging-tests)
7. [Best Practices](#best-practices)
8. [Common Issues and Solutions](#common-issues-and-solutions)
9. [Advanced Testing Techniques](#advanced-testing-techniques)

## What is E2E Testing?

End-to-End testing is a methodology used to test an application's flow from start to finish. It simulates real user scenarios by testing the complete application environment and architecture.

**Benefits for TaskMaster:**
- Validates entire user workflows (login → create task → complete task)
- Tests both frontend and backend components together
- Ensures critical functionality works as expected
- Catches regression issues before users do

## Getting Started with Cypress

### Prerequisites
- Node.js installed
- TaskMaster project with npm/yarn
- Access to the application running locally

### Installation
Cypress should already be installed in your project. If not:

```bash
cd D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP
npm install cypress --save-dev
```

### Opening Cypress

```bash
npx cypress open
```

When Cypress opens:
1. Choose "E2E Testing"
2. Select a browser (Chrome recommended)
3. Click "Start E2E Testing"

## Creating Your First Test

### Creating a Login Test

1. In the Cypress interface, click "Create new spec"
2. Name it `taskmaster-login.cy.js`
3. Click "Create spec"
4. Click "Run spec" to see the empty test run

Now, edit the file with this test code:

```javascript
// Login functionality test
describe('TaskMaster Login', () => {
  it('should load the login page', () => {
    // Visit the login page
    cy.visit('http://localhost:3000/login') // Adjust URL if needed
    
    // Check if the page loaded correctly
    cy.contains('Login')
    cy.get('form').should('be.visible')
  })
  
  it('should show error with invalid credentials', () => {
    cy.visit('http://localhost:3000/login')
    
    // Find input fields 
    cy.get('input[type="email"]').type('wrong@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    
    // Find and click the login button
    cy.get('button').contains('Login').click()
    
    // Check if an error message appears
    cy.contains('Invalid email or password', { timeout: 5000 })
  })
  
  it('should login successfully with valid credentials', () => {
    cy.visit('http://localhost:3000/login')
    
    // Use admin credentials
    cy.get('input[type="email"]').type('admin@taskmaster.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button').contains('Login').click()
    
    // Check if login was successful
    cy.url().should('include', '/dashboard', { timeout: 10000 })
    cy.contains('Dashboard', { timeout: 10000 })
  })
})
```

## Finding Elements on the Page

Finding the right elements is crucial for stable tests. Here are different strategies:

### Element Selection Methods

```javascript
// By tag name
cy.get('button') 

// By class
cy.get('.login-button') 

// By ID
cy.get('#submit-btn') 

// By attribute
cy.get('[name="email"]')
cy.get('[type="submit"]')

// By text content
cy.contains('Login')

// Combined approaches
cy.get('button').contains('Save')
```

### Using Chrome DevTools to Find Selectors

1. Open your TaskMaster application in Chrome
2. Right-click on an element (e.g., login button)
3. Select "Inspect" to open DevTools
4. Look at the HTML to find identifiers

**Best Practice:** Look for stable attributes like IDs, names, or data attributes.

## Writing Tests for Core Functionality

### Task Creation Test

Create a file named `create-task.cy.js`:

```javascript
describe('TaskMaster Task Creation', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('http://localhost:3000/login')
    cy.get('input[type="email"]').type('admin@taskmaster.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button').contains('Login').click()
    cy.url().should('include', '/dashboard', { timeout: 10000 })
  })

  it('should create a new task', () => {
    // Look for a "Create Task" or "Add Task" button
    cy.contains('Create Task', { timeout: 5000 }).click()
    // Alternative: cy.get('button').contains('+').click()
    
    // Fill out task form
    cy.get('input[name="title"]').type('Test Task Created During E2E Testing')
    cy.get('textarea').type('This is a test task description')
    
    // Select priority if available
    cy.get('select').select('High')
    
    // Save the task
    cy.contains('button', 'Save').click()
    
    // Verify task appears in list
    cy.contains('Test Task Created During E2E Testing')
  })
})
```

### Follow-up Management Test

Create a file named `followup-management.cy.js`:

```javascript
describe('TaskMaster Follow-up Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('http://localhost:3000/login')
    cy.get('input[type="email"]').type('admin@taskmaster.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button').contains('Login').click()
    cy.url().should('include', '/dashboard', { timeout: 10000 })
    
    // Navigate to follow-ups section (adjust selector as needed)
    cy.contains('Follow-ups').click()
  })

  it('should create a new follow-up', () => {
    // Click create follow-up button
    cy.contains('Add Follow-up').click()
    
    // Fill out follow-up form
    cy.get('input[name="title"]').type('Test Follow-up from E2E')
    cy.get('textarea').type('This is a test follow-up created via E2E testing')
    
    // Set reminder date (adjust as needed for your date picker)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formattedDate = tomorrow.toISOString().split('T')[0]
    cy.get('input[type="date"]').type(formattedDate)
    
    // Save follow-up
    cy.contains('button', 'Save').click()
    
    // Verify follow-up was created
    cy.contains('Test Follow-up from E2E')
  })
  
  it('should mark a follow-up as completed', () => {
    // First create a follow-up if needed
    // Then find and mark it complete
    cy.contains('Test Follow-up from E2E').parent().find('input[type="checkbox"]').click()
    
    // Verify it's marked as complete (adjust based on your UI)
    cy.contains('Test Follow-up from E2E').parent().should('have.class', 'completed')
  })
})
```

## Debugging Tests

When tests fail, use these techniques to identify issues:

### Pause the Test
```javascript
cy.get('input[name="title"]').type('Test Task')
cy.pause() // Test will pause here so you can inspect
cy.contains('button', 'Save').click()
```

### Debug to Console
```javascript
cy.get('form').debug()
```

### Take Screenshots
```javascript
cy.screenshot('after-login')
```

### Slow Down Test Execution
If tests run too fast to follow:
```javascript
Cypress.config('defaultCommandTimeout', 8000)
```

## Best Practices

1. **Make Tests Independent**: Each test should be able to run on its own
2. **Use beforeEach for Setup**: Perform common setup steps in beforeEach blocks
3. **Add Sufficient Timeouts**: Give elements time to appear with `{ timeout: 5000 }`
4. **Use Flexible Selectors**: Avoid brittle selectors that break with minor UI changes
5. **Test Core User Journeys First**: Focus on critical paths before edge cases
6. **Clean Up After Tests**: Delete test data created during tests

## Common Issues and Solutions

### Element Not Found
**Problem**: `cy.get()` can't find an element
**Solution**: 
- Increase timeout: `cy.get('.selector', { timeout: 10000 })`
- Check if element is in an iframe
- Verify the element exists in your application

### Asynchronous Issues
**Problem**: Test runs too fast before data loads
**Solution**:
- Add explicit waiting: `cy.wait(1000)`
- Wait for network requests: `cy.intercept('GET', '/api/tasks').as('getTasks')` then `cy.wait('@getTasks')`

### Login Problems
**Problem**: Tests can't login consistently
**Solution**:
- Use a programmatic login instead of UI login for better reliability
- Create a custom Cypress command for login

## Advanced Testing Techniques

### Custom Commands
Create reusable login command in `cypress/support/commands.js`:

```javascript
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button').contains('Login').click()
  cy.url().should('include', '/dashboard', { timeout: 10000 })
})
```

Then use it in tests:
```javascript
cy.login('admin@taskmaster.com', 'admin123')
```

### Fixtures for Test Data
Store test data in `cypress/fixtures/tasks.json`:

```json
{
  "newTask": {
    "title": "Test Task from Fixture",
    "description": "This task comes from a test fixture",
    "priority": "high"
  }
}
```

Use in tests:
```javascript
cy.fixture('tasks').then((tasks) => {
  cy.get('input[name="title"]').type(tasks.newTask.title)
  cy.get('textarea').type(tasks.newTask.description)
})
```

### API Testing
Test your TaskMaster API directly:

```javascript
describe('TaskMaster API', () => {
  let authToken

  before(() => {
    // Get auth token via API
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/auth/login',
      body: {
        email: 'admin@taskmaster.com',
        password: 'admin123'
      }
    }).then((response) => {
      authToken = response.body.token
    })
  })

  it('should create a task via API', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/tasks',
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: {
        title: 'API Created Task',
        description: 'Created via API test',
        priority: 'high'
      }
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('title', 'API Created Task')
    })
  })
})
```

---

## Next Steps

After implementing these basic tests, consider:

1. Setting up Continuous Integration (CI) to run tests automatically
2. Expanding test coverage to other areas of TaskMaster
3. Creating a testing strategy document for your team
4. Adding visual regression testing

Remember that E2E testing is a continuous process. As you add new features to TaskMaster, add corresponding tests to ensure everything continues to work correctly.

---

© 2025 TaskMaster Project | Created by: Mohan
