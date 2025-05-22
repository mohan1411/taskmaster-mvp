// API tests for TaskMaster using Jest and Supertest
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongoServer;

// We'll use the actual server but with a test database
const app = require('../backend/server'); // adjust path as needed
let authToken;
let taskId;

// Setup and teardown for the entire test suite
beforeAll(async () => {
  // Create an in-memory MongoDB instance for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  // Create a test admin user
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: 'password123',
      role: 'admin'
    });
    
  // Login to get auth token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'testadmin@example.com',
      password: 'password123'
    });
    
  authToken = loginResponse.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Task API Tests
describe('Task API', () => {
  test('should create a new task', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task via API',
        description: 'This is a test task created via API testing',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
      });
      
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.title).toBe('Test Task via API');
    
    // Save task ID for later tests
    taskId = response.body._id;
  });
  
  test('should get all tasks', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.some(task => task.title === 'Test Task via API')).toBeTruthy();
  });
  
  test('should get a single task by ID', async () => {
    const response = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body._id).toBe(taskId);
    expect(response.body.title).toBe('Test Task via API');
  });
  
  test('should update a task', async () => {
    const response = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Test Task',
        description: 'This task has been updated during testing',
        priority: 'medium'
      });
      
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated Test Task');
    expect(response.body.priority).toBe('medium');
  });
  
  test('should mark a task as complete', async () => {
    const response = await request(app)
      .patch(`/api/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ completed: true });
      
    expect(response.status).toBe(200);
    expect(response.body.completed).toBeTruthy();
  });
  
  test('should delete a task', async () => {
    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(200);
    
    // Verify task is gone
    const checkResponse = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(checkResponse.status).toBe(404);
  });
});

// Follow-up API Tests
describe('Follow-up API', () => {
  let followupId;
  
  test('should create a new follow-up', async () => {
    const response = await request(app)
      .post('/api/followups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Follow-up via API',
        description: 'This is a test follow-up created via API testing',
        deadline: new Date(Date.now() + 86400000).toISOString() // Tomorrow
      });
      
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.title).toBe('Test Follow-up via API');
    
    // Save follow-up ID for later tests
    followupId = response.body._id;
  });
  
  test('should get all follow-ups', async () => {
    const response = await request(app)
      .get('/api/followups')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.some(followup => followup.title === 'Test Follow-up via API')).toBeTruthy();
  });
  
  test('should update a follow-up', async () => {
    const response = await request(app)
      .put(`/api/followups/${followupId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Test Follow-up',
        status: 'completed'
      });
      
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated Test Follow-up');
    expect(response.body.status).toBe('completed');
  });
  
  test('should delete a follow-up', async () => {
    const response = await request(app)
      .delete(`/api/followups/${followupId}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(200);
    
    // Verify follow-up is gone
    const checkResponse = await request(app)
      .get(`/api/followups/${followupId}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(checkResponse.status).toBe(404);
  });
});
