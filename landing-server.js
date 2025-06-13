const express = require('express');
const path = require('path');
const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Redirect to main app
app.get('/app', (req, res) => {
  res.redirect(process.env.APP_URL || 'https://fizztask.com/login');
});

// Handle 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Landing page server running on port ${PORT}`);
});
