// Emergency auth bypass for demo ONLY
// Add this to backend/controllers/userController.js temporarily

// At the top of the login function, add:
if (req.body.email === 'demo@demo.com' && req.body.password === 'demo') {
  // Create a demo token
  const token = generateToken('demo-user-id');
  return res.json({
    token,
    user: {
      id: 'demo-user-id',
      name: 'Demo User',
      email: 'demo@demo.com'
    }
  });
}
