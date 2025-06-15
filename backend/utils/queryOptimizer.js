const mongoose = require('mongoose');

/**
 * Query optimization utilities
 */
class QueryOptimizer {
  /**
   * Add explain to a query to analyze performance
   */
  static async explainQuery(model, query, options = {}) {
    const explanation = await model
      .find(query)
      .limit(options.limit || 10)
      .explain('executionStats');
    
    return {
      executionTime: explanation.executionStats.executionTimeMillis,
      documentsExamined: explanation.executionStats.totalDocsExamined,
      documentsReturned: explanation.executionStats.nReturned,
      indexUsed: explanation.executionStats.executionStages.indexName || 'COLLSCAN',
      efficiency: explanation.executionStats.nReturned / 
        (explanation.executionStats.totalDocsExamined || 1)
    };
  }
  
  /**
   * Common optimized queries with proper indexing
   */
  static getOptimizedQueries() {
    return {
      // Task queries
      tasks: {
        // Get user's pending tasks sorted by priority and due date
        pendingByPriority: (userId) => ({
          query: { user: userId, status: 'pending' },
          sort: { priority: -1, dueDate: 1 },
          select: 'title description priority dueDate category',
          lean: true
        }),
        
        // Get overdue tasks
        overdue: (userId) => ({
          query: { 
            user: userId, 
            status: { $ne: 'completed' },
            dueDate: { $lt: new Date() }
          },
          sort: { dueDate: 1 },
          lean: true
        }),
        
        // Search tasks by text
        search: (userId, searchTerm) => ({
          query: { 
            user: userId,
            $text: { $search: searchTerm }
          },
          select: 'title description priority status dueDate',
          lean: true
        })
      },
      
      // Email queries
      emails: {
        // Get unread emails
        unread: (userId) => ({
          query: { user: userId, isRead: false },
          sort: { receivedAt: -1 },
          limit: 50,
          select: 'subject sender receivedAt snippet',
          lean: true
        }),
        
        // Get emails needing follow-up
        needsFollowUp: (userId) => ({
          query: { user: userId, needsFollowUp: true },
          sort: { followUpDueDate: 1 },
          select: 'subject sender receivedAt followUpDueDate',
          lean: true
        })
      },
      
      // Follow-up queries
      followups: {
        // Get due follow-ups
        due: (userId, days = 7) => ({
          query: { 
            user: userId,
            status: 'pending',
            dueDate: { 
              $gte: new Date(),
              $lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
            }
          },
          sort: { dueDate: 1 },
          lean: true
        }),
        
        // Get follow-ups by contact
        byContact: (userId, contactEmail) => ({
          query: { user: userId, contactEmail },
          sort: { createdAt: -1 },
          lean: true
        })
      },
      
      // Focus session queries
      focusSessions: {
        // Get active session
        active: (userId) => ({
          query: { user: userId, active: true },
          select: 'startTime duration tasks sessionType',
          lean: true
        }),
        
        // Get session history
        history: (userId, days = 30) => ({
          query: { 
            user: userId,
            startTime: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
          },
          sort: { startTime: -1 },
          select: 'startTime endTime duration focusScore sessionType',
          lean: true
        })
      }
    };
  }
  
  /**
   * Apply common query optimizations
   */
  static optimizeQuery(query) {
    // Always use lean() for read operations
    if (query.lean) {
      query = query.lean();
    }
    
    // Add query timeout
    if (!query.options.maxTimeMS) {
      query = query.maxTimeMS(10000); // 10 second timeout
    }
    
    // Use projection to limit fields
    if (!query.options.projection && query.options.select) {
      query = query.select(query.options.select);
    }
    
    return query;
  }
  
  /**
   * Batch operations for better performance
   */
  static async batchOperation(model, operations, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await model.bulkWrite(batch, { ordered: false });
      results.push(batchResults);
    }
    
    return results;
  }
  
  /**
   * Cache frequently accessed data
   */
  static createCache(ttlSeconds = 300) {
    const cache = new Map();
    
    return {
      get: (key) => {
        const item = cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
          cache.delete(key);
          return null;
        }
        
        return item.value;
      },
      
      set: (key, value) => {
        cache.set(key, {
          value,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      },
      
      delete: (key) => cache.delete(key),
      
      clear: () => cache.clear(),
      
      size: () => cache.size
    };
  }
  
  /**
   * Aggregation pipeline optimizations
   */
  static getOptimizedAggregations() {
    return {
      // Task analytics
      taskAnalytics: (userId) => [
        { $match: { user: mongoose.Types.ObjectId(userId) } },
        {
          $facet: {
            statusCounts: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            priorityCounts: [
              { $group: { _id: '$priority', count: { $sum: 1 } } }
            ],
            categoryCounts: [
              { $group: { _id: '$category', count: { $sum: 1 } } }
            ],
            completionRate: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                  }
                }
              }
            ]
          }
        }
      ],
      
      // Email analytics
      emailAnalytics: (userId, days = 30) => [
        { 
          $match: { 
            user: mongoose.Types.ObjectId(userId),
            receivedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
          } 
        },
        {
          $facet: {
            volumeByDay: [
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ],
            topSenders: [
              {
                $group: {
                  _id: '$sender.email',
                  name: { $first: '$sender.name' },
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]
    };
  }
}

module.exports = QueryOptimizer;