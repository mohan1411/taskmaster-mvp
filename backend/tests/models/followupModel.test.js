// tests/models/followupModel.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongoServer;

// Import the model - adjust path as needed
const Followup = require('../../models/followupModel');

describe('Followup Model Tests', () => {
  beforeAll(async () => {
    // Create an in-memory MongoDB server for testing
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    // Disconnect and stop the MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clear the database between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  });

  // Test creation with valid data
  it('should create & save a follow-up successfully', async () => {
    // Arrange
    const validFollowup = new Followup({
      user: new mongoose.Types.ObjectId(),
      emailId: 'email123',
      threadId: 'thread123',
      subject: 'Test Subject',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(),
      reason: 'Test reason',
      notes: 'Test notes',
      keyPoints: ['Point 1', 'Point 2'],
      aiGenerated: false
    });

    // Act
    const savedFollowup = await validFollowup.save();

    // Assert
    expect(savedFollowup._id).toBeDefined();
    expect(savedFollowup.subject).toBe('Test Subject');
    expect(savedFollowup.status).toBe('pending');
    expect(savedFollowup.priority).toBe('medium');
    expect(savedFollowup.createdAt).toBeDefined();
    expect(savedFollowup.updatedAt).toBeDefined();
  });

  // Test for required fields
  it('should fail to save without required fields', async () => {
    // Arrange
    const followupWithoutRequiredField = new Followup({
      // Missing 'user' field which should be required
      emailId: 'email123',
      subject: 'Test Subject'
    });

    // Act & Assert
    await expect(followupWithoutRequiredField.save()).rejects.toThrow();
  });

  // Test for default values
  it('should have default values when not provided', async () => {
    // Arrange
    const followupWithDefaults = new Followup({
      user: new mongoose.Types.ObjectId(),
      emailId: 'email123',
      threadId: 'thread123',
      subject: 'Test Subject',
      contactName: 'John Doe',
      contactEmail: 'john@example.com'
      // status, priority, aiGenerated should have defaults
    });

    // Act
    const savedFollowup = await followupWithDefaults.save();

    // Assert
    expect(savedFollowup.status).toBe('pending'); // Default value
    expect(savedFollowup.priority).toBe('medium'); // Default value
    expect(savedFollowup.aiGenerated).toBe(false); // Default value
  });

  // Test status validation
  it('should validate status field', async () => {
    // Arrange
    const followupWithInvalidStatus = new Followup({
      user: new mongoose.Types.ObjectId(),
      emailId: 'email123',
      threadId: 'thread123',
      subject: 'Test Subject',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      status: 'invalid-status', // Invalid status
      priority: 'medium'
    });

    // Act & Assert
    await expect(followupWithInvalidStatus.save()).rejects.toThrow();
  });

  // Test priority validation
  it('should validate priority field', async () => {
    // Arrange
    const followupWithInvalidPriority = new Followup({
      user: new mongoose.Types.ObjectId(),
      emailId: 'email123',
      threadId: 'thread123',
      subject: 'Test Subject',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      status: 'pending',
      priority: 'invalid-priority' // Invalid priority
    });

    // Act & Assert
    await expect(followupWithInvalidPriority.save()).rejects.toThrow();
  });

  // Test relatedTasks field
  it('should store relatedTasks as an array of ObjectIds', async () => {
    // Arrange
    const taskId1 = new mongoose.Types.ObjectId();
    const taskId2 = new mongoose.Types.ObjectId();
    
    const followupWithRelatedTasks = new Followup({
      user: new mongoose.Types.ObjectId(),
      emailId: 'email123',
      threadId: 'thread123',
      subject: 'Test Subject',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      relatedTasks: [taskId1, taskId2]
    });

    // Act
    const savedFollowup = await followupWithRelatedTasks.save();

    // Assert
    expect(savedFollowup.relatedTasks.length).toBe(2);
    expect(savedFollowup.relatedTasks[0].toString()).toBe(taskId1.toString());
    expect(savedFollowup.relatedTasks[1].toString()).toBe(taskId2.toString());
  });

  // Test completedAt field
  it('should not have completedAt set for new follow-up', async () => {
    // Arrange
    const newFollowup = new Followup({
      user: new mongoose.Types.ObjectId(),
      emailId: 'email123',
      subject: 'Test Subject',
      contactName: 'John Doe',
      contactEmail: 'john@example.com'
    });

    // Act
    const savedFollowup = await newFollowup.save();

    // Assert
    expect(savedFollowup.completedAt).toBeUndefined();
  });

  // Test updating status to 'completed'
  it('should allow updating status to completed', async () => {
    // Arrange
    const followup = new Followup({
      user: new mongoose.Types.ObjectId(),
      emailId: 'email123',
      subject: 'Test Subject',
      contactName: 'John Doe',
      contactEmail: 'john@example.com'
    });
    
    const savedFollowup = await followup.save();
    
    // Act
    savedFollowup.status = 'completed';
    savedFollowup.completedAt = new Date();
    savedFollowup.completionNotes = 'Completed with feedback';
    const updatedFollowup = await savedFollowup.save();

    // Assert
    expect(updatedFollowup.status).toBe('completed');
    expect(updatedFollowup.completedAt).toBeDefined();
    expect(updatedFollowup.completionNotes).toBe('Completed with feedback');
  });
});
