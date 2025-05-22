// tests/controllers/followupController.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const followupController = require('../../controllers/followupController');
const Followup = require('../../models/followupModel');
const Email = require('../../models/emailModel');
const config = require('../../config/config');

// Mock dependencies
jest.mock('../../models/followupModel');
jest.mock('../../models/emailModel');
jest.mock('openai');
jest.mock('../../config/config');
jest.mock('../../utils/emailUtils');

describe('Follow-up Controller Tests', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock request object
    mockRequest = {
      user: { _id: 'mock-user-id' },
      params: { id: 'mock-followup-id' },
      body: {
        emailId: 'mock-email-id',
        threadId: 'mock-thread-id',
        subject: 'Test Subject',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        priority: 'medium',
        dueDate: new Date(),
        notes: 'Test notes',
        reason: 'Test reason',
        keyPoints: ['Point 1', 'Point 2']
      },
      query: {}
    };

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('getFollowUps', () => {
    it('should return follow-ups with pagination', async () => {
      // Mock data
      const mockFollowups = [
        { _id: 'followup-1', subject: 'Test 1' },
        { _id: 'followup-2', subject: 'Test 2' }
      ];
      const mockCount = 2;

      // Setup mocks
      mockRequest.query = { page: '1', limit: '10' };
      Followup.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockFollowups)
      });
      Followup.countDocuments.mockResolvedValue(mockCount);

      // Execute
      await followupController.getFollowUps(mockRequest, mockResponse);

      // Verify
      expect(Followup.find).toHaveBeenCalledWith({
        user: 'mock-user-id',
        status: { $in: ['pending', 'in-progress'] }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        followups: mockFollowups,
        page: 1,
        pages: 1,
        total: mockCount
      });
    });

    it('should handle filtering by priority', async () => {
      // Mock data
      mockRequest.query = { priority: 'high,urgent' };
      
      // Setup mocks
      Followup.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      Followup.countDocuments.mockResolvedValue(0);

      // Execute
      await followupController.getFollowUps(mockRequest, mockResponse);

      // Verify
      expect(Followup.find).toHaveBeenCalledWith({
        user: 'mock-user-id',
        status: { $in: ['pending', 'in-progress'] },
        priority: { $in: ['high', 'urgent'] }
      });
    });

    it('should handle server errors', async () => {
      // Setup mock to throw error
      const error = new Error('Database error');
      Followup.find.mockRejectedValue(error);

      // Execute
      await followupController.getFollowUps(mockRequest, mockResponse);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: error.message
      });
    });
  });

  describe('getFollowUpById', () => {
    it('should return a follow-up by id', async () => {
      // Mock data
      const mockFollowup = { _id: 'mock-followup-id', subject: 'Test' };
      
      // Setup mock
      Followup.findOne.mockResolvedValue(mockFollowup);

      // Execute
      await followupController.getFollowUpById(mockRequest, mockResponse);

      // Verify
      expect(Followup.findOne).toHaveBeenCalledWith({
        _id: 'mock-followup-id',
        user: 'mock-user-id'
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockFollowup);
    });

    it('should return 404 if follow-up not found', async () => {
      // Setup mock
      Followup.findOne.mockResolvedValue(null);

      // Execute
      await followupController.getFollowUpById(mockRequest, mockResponse);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Follow-up not found' });
    });
  });

  describe('createFollowUp', () => {
    it('should create a new follow-up', async () => {
      // Mock data
      const mockCreatedFollowup = { _id: 'new-followup-id', ...mockRequest.body };
      
      // Setup mocks
      Followup.create.mockResolvedValue(mockCreatedFollowup);
      Email.findOneAndUpdate.mockResolvedValue({});

      // Execute
      await followupController.createFollowUp(mockRequest, mockResponse);

      // Verify
      expect(Followup.create).toHaveBeenCalledWith({
        user: 'mock-user-id',
        emailId: 'mock-email-id',
        threadId: 'mock-thread-id',
        subject: 'Test Subject',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        priority: 'medium',
        dueDate: expect.any(Date),
        notes: 'Test notes',
        reason: 'Test reason',
        keyPoints: ['Point 1', 'Point 2'],
        status: 'pending',
        aiGenerated: false
      });
      expect(Email.findOneAndUpdate).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedFollowup);
    });

    it('should handle creation failure', async () => {
      // Setup mock
      Followup.create.mockResolvedValue(null);

      // Execute
      await followupController.createFollowUp(mockRequest, mockResponse);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid follow-up data' });
    });
  });

  describe('updateFollowUp', () => {
    it('should update a follow-up', async () => {
      // Mock data
      const mockFollowup = {
        _id: 'mock-followup-id',
        status: 'pending',
        save: jest.fn().mockResolvedValue({ _id: 'mock-followup-id', status: 'completed' })
      };
      
      // Setup mocks
      Followup.findOne.mockResolvedValue(mockFollowup);
      mockRequest.body = { status: 'completed' };

      // Execute
      await followupController.updateFollowUp(mockRequest, mockResponse);

      // Verify
      expect(Followup.findOne).toHaveBeenCalledWith({
        _id: 'mock-followup-id',
        user: 'mock-user-id'
      });
      expect(mockFollowup.status).toBe('completed');
      expect(mockFollowup.completedAt).toBeInstanceOf(Date);
      expect(mockFollowup.save).toHaveBeenCalled();
      expect(Email.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should return 404 if follow-up not found', async () => {
      // Setup mock
      Followup.findOne.mockResolvedValue(null);

      // Execute
      await followupController.updateFollowUp(mockRequest, mockResponse);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Follow-up not found' });
    });
  });

  describe('deleteFollowUp', () => {
    it('should delete a follow-up', async () => {
      // Mock data
      const mockFollowup = {
        _id: 'mock-followup-id',
        emailId: 'mock-email-id',
        remove: jest.fn().mockResolvedValue({})
      };
      
      // Setup mocks
      Followup.findOne.mockResolvedValue(mockFollowup);

      // Execute
      await followupController.deleteFollowUp(mockRequest, mockResponse);

      // Verify
      expect(Followup.findOne).toHaveBeenCalledWith({
        _id: 'mock-followup-id',
        user: 'mock-user-id'
      });
      expect(mockFollowup.remove).toHaveBeenCalled();
      expect(Email.findOneAndUpdate).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Follow-up removed' });
    });

    it('should return 404 if follow-up not found', async () => {
      // Setup mock
      Followup.findOne.mockResolvedValue(null);

      // Execute
      await followupController.deleteFollowUp(mockRequest, mockResponse);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Follow-up not found' });
    });
  });

  describe('detectFollowUp', () => {
    it('should detect follow-up needs in an email', async () => {
      // Mock data
      const mockEmail = { _id: 'mock-email-id', save: jest.fn() };
      const mockEmailWithBody = { 
        success: true, 
        email: { 
          _id: 'mock-email-id',
          sender: { name: 'John', email: 'john@example.com' },
          subject: 'Test',
          messageId: 'msg123',
          threadId: 'thread123',
          save: jest.fn()
        } 
      };
      const mockResult = { 
        success: true, 
        followUpAnalysis: {
          needsFollowUp: true,
          reason: 'Needs response',
          suggestedDate: '2023-01-15',
          keyPoints: ['Point 1', 'Point 2']
        }
      };
      const mockCreatedFollowup = { _id: 'new-followup-id' };
      
      // Setup mocks
      Email.findOne.mockResolvedValue(mockEmail);
      const emailUtils = require('../../utils/emailUtils');
      emailUtils.getEmailWithBody.mockResolvedValue(mockEmailWithBody);
      
      // Mock the internal method
      const originalDetectFollowUpNeeds = followupController.detectFollowUpNeeds;
      followupController.detectFollowUpNeeds = jest.fn().mockResolvedValue(mockResult);
      
      Followup.create.mockResolvedValue(mockCreatedFollowup);

      // Execute
      await followupController.detectFollowUp(mockRequest, mockResponse);

      // Verify
      expect(Email.findOne).toHaveBeenCalledWith({
        _id: 'mock-followup-id',
        user: 'mock-user-id'
      });
      expect(emailUtils.getEmailWithBody).toHaveBeenCalled();
      expect(followupController.detectFollowUpNeeds).toHaveBeenCalledWith(mockEmailWithBody.email);
      expect(Followup.create).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        ...mockResult.followUpAnalysis,
        followup: mockCreatedFollowup
      });

      // Restore original function
      followupController.detectFollowUpNeeds = originalDetectFollowUpNeeds;
    });

    it('should handle when follow-up is not needed', async () => {
      // Mock data
      const mockEmail = { _id: 'mock-email-id', save: jest.fn() };
      const mockEmailWithBody = { 
        success: true, 
        email: { 
          _id: 'mock-email-id',
          save: jest.fn()
        } 
      };
      const mockResult = { 
        success: true, 
        followUpAnalysis: {
          needsFollowUp: false,
          reason: 'No response needed'
        }
      };
      
      // Setup mocks
      Email.findOne.mockResolvedValue(mockEmail);
      const emailUtils = require('../../utils/emailUtils');
      emailUtils.getEmailWithBody.mockResolvedValue(mockEmailWithBody);
      
      // Mock the internal method
      const originalDetectFollowUpNeeds = followupController.detectFollowUpNeeds;
      followupController.detectFollowUpNeeds = jest.fn().mockResolvedValue(mockResult);

      // Execute
      await followupController.detectFollowUp(mockRequest, mockResponse);

      // Verify
      expect(mockEmail.needsFollowUp).toBe(false);
      expect(mockEmail.save).toHaveBeenCalled();
      expect(Followup.create).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult.followUpAnalysis);

      // Restore original function
      followupController.detectFollowUpNeeds = originalDetectFollowUpNeeds;
    });

    it('should return 404 if email not found', async () => {
      // Setup mock
      Email.findOne.mockResolvedValue(null);

      // Execute
      await followupController.detectFollowUp(mockRequest, mockResponse);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Email not found' });
    });

    it('should handle missing OpenAI API key', async () => {
      // Mock data
      const mockEmail = { _id: 'mock-email-id' };
      
      // Setup mocks
      Email.findOne.mockResolvedValue(mockEmail);
      config.openaiApiKey = null;

      // Execute
      await followupController.detectFollowUp(mockRequest, mockResponse);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'OpenAI API key is not configured. Follow-up detection is unavailable.'
      });

      // Restore config
      config.openaiApiKey = 'mock-api-key';
    });
  });

  describe('checkDueFollowUps', () => {
    it('should return due follow-ups', async () => {
      // Mock data
      const mockDueFollowups = [
        { _id: 'followup-1', dueDate: new Date() },
        { _id: 'followup-2', dueDate: new Date() }
      ];
      
      // Setup mocks
      Followup.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDueFollowups)
      });

      // Execute
      await followupController.checkDueFollowUps(mockRequest, mockResponse);

      // Verify
      expect(Followup.find).toHaveBeenCalledWith({
        user: 'mock-user-id',
        status: { $in: ['pending', 'in-progress'] },
        dueDate: { $lte: expect.any(Date) }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        count: 2,
        followups: mockDueFollowups
      });
    });
  });

  describe('getFollowUpAnalytics', () => {
    it('should return analytics data', async () => {
      // Mock data
      const mockStatusCounts = [
        { _id: 'pending', count: 5 },
        { _id: 'completed', count: 10 }
      ];
      const mockCompletionTimes = [
        { _id: null, avgDays: 2.5, minDays: 1, maxDays: 5 }
      ];
      
      // Setup mocks
      Followup.aggregate.mockImplementation((pipeline) => {
        if (pipeline[0].$match && pipeline[0].$match.user) {
          return Promise.resolve(mockStatusCounts);
        } else {
          return Promise.resolve(mockCompletionTimes);
        }
      });
      Followup.countDocuments.mockResolvedValue(15);

      // Execute
      await followupController.getFollowUpAnalytics(mockRequest, mockResponse);

      // Verify
      expect(Followup.aggregate).toHaveBeenCalled();
      expect(Followup.countDocuments).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCounts: {
          pending: 5,
          completed: 10
        },
        dueThisWeek: expect.any(Number),
        overdueCount: expect.any(Number),
        completionRate: expect.any(Number),
        avgCompletionTime: 2.5,
        totalFollowUps: 15
      });
    });

    it('should handle empty results', async () => {
      // Setup mocks
      Followup.aggregate.mockResolvedValue([]);
      Followup.countDocuments.mockResolvedValue(0);

      // Execute
      await followupController.getFollowUpAnalytics(mockRequest, mockResponse);

      // Verify
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCounts: {},
        dueThisWeek: expect.any(Number),
        overdueCount: expect.any(Number),
        completionRate: 0,
        avgCompletionTime: 0,
        totalFollowUps: 0
      });
    });
  });
});
