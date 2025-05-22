it('should login programmatically', () => {
  // Direct API login
  cy.request({
    method: 'POST',
    url: 'http://localhost:8000/api/auth/login', // Adjust to match your API
    body: {
      email: 'mohan.g1411@gmail.com',
      password: 'Raptor$75'
    },
    failOnStatusCode: false // Don't fail on non-2xx response
  }).then(response => {
    console.log('API login response:', response)
    
    if (response.status === 200 && response.body.token) {
      // Set auth token
      const token = response.body.token
      const refreshToken = response.body.refreshToken
      
      // Visit with authentication set
      cy.visit('http://localhost:3000', {
        onBeforeLoad(win) {
          // Set tokens in localStorage (adjust based on your app's storage method)
          win.localStorage.setItem('authToken', token)
          if (refreshToken) {
            win.localStorage.setItem('refreshToken', refreshToken)
          }
          
          // Also set as a cookie in case the app uses cookies
          win.document.cookie = `authToken=${token}; path=/`
        }
      })
      
      // Verify we reach dashboard
      cy.url().should('include', '/dashboard', { timeout: 10000 })
    } else {
      console.log('API login failed')
    }
  })
})