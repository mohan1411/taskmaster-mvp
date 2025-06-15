import React, { useState, useEffect } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';
import EditIcon from '@mui/icons-material/Edit';
import documentService from '../../services/documentService';
import './TaskExtractionReview.css';

const TaskExtractionReview = ({ 
  extractedTasks = [], 
  documentId,
  onTasksCreated, 
  onClose 
}) => {
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [creating, setCreating] = useState(false);
  const [filterByConfidence, setFilterByConfidence] = useState(0);

  useEffect(() => {
    // Initialize tasks with extracted data
    const initialTasks = extractedTasks.map((task, index) => ({
      id: task.id || `extracted-${index}`,
      title: task.title || task.description || 'Untitled Task',
      description: task.description || '',
      dueDate: task.dueDate,
      priority: task.priority || 'medium',
      assignee: task.assignee || '',
      confidence: task.confidence || 0,
      source: task.source || '',
      context: task.context || '',
      originalText: task.originalText || '',
      isEdited: false
    }));
    
    setTasks(initialTasks);
    
    // Auto-select high-confidence tasks
    const highConfidenceTasks = new Set(
      initialTasks
        .filter(task => task.confidence >= 70)
        .map(task => task.id)
    );
    setSelectedTasks(highConfidenceTasks);
  }, [extractedTasks]);

  // Handle task selection
  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Select all tasks
  const selectAll = () => {
    setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
  };

  // Deselect all tasks
  const deselectAll = () => {
    setSelectedTasks(new Set());
  };

  // Handle task editing
  const startEditing = (task) => {
    setEditingTask({ ...task });
  };

  const saveEdit = () => {
    setTasks(prev => 
      prev.map(task => 
        task.id === editingTask.id 
          ? { ...editingTask, isEdited: true }
          : task
      )
    );
    setEditingTask(null);
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  // Filter tasks by confidence
  const filteredTasks = tasks.filter(task => task.confidence >= filterByConfidence);

  // Create selected tasks
  const createTasks = async () => {
    if (selectedTasks.size === 0) return;

    setCreating(true);
    try {
      // Get indices of selected tasks from the original extractedTasks array
      const selectedIndices = [];
      tasks.forEach((task, index) => {
        if (selectedTasks.has(task.id)) {
          selectedIndices.push(index);
        }
      });

      console.log('Creating tasks with indices:', selectedIndices);
      const result = await documentService.createTasksFromExtractions(documentId, selectedIndices);
      console.log('Task creation result:', result);
      
      // Call the callback with the result
      if (onTasksCreated && typeof onTasksCreated === 'function') {
        try {
          onTasksCreated(result.data);
        } catch (callbackError) {
          console.error('Error in onTasksCreated callback:', callbackError);
        }
      }
      
      // Submit feedback on extraction quality if documentId is valid
      if (documentId && documentId.length === 24) {
        try {
          const feedback = {
            totalExtracted: tasks.length,
            totalSelected: selectedTasks.size,
            avgConfidence: tasks.reduce((acc, task) => acc + task.confidence, 0) / tasks.length,
            editedTasks: tasks.filter(task => task.isEdited).length,
            qualityRating: selectedTasks.size / tasks.length > 0.7 ? 'good' : 'fair'
          };
          
          await documentService.submitFeedback(documentId, feedback);
        } catch (feedbackError) {
          console.error('Error submitting feedback:', feedbackError);
          // Don't throw, just log - feedback is optional
        }
      }
      
    } catch (error) {
      console.error('Error creating tasks:', error);
      // Check if it's an actual API error
      if (error.response) {
        console.error('API Error:', error.response.data);
        alert(`Failed to create tasks: ${error.response.data.error || error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('Network error:', error.request);
        alert('Network error. Please check your connection and try again.');
      } else {
        console.error('Error details:', error.message);
        // Don't show alert for non-API errors
      }
    } finally {
      setCreating(false);
    }
  };

  // Get confidence badge color
  const getConfidenceBadgeColor = (confidence) => {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    };
    return colors[priority] || colors.medium;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="task-extraction-review">
      <div className="review-header">
        <div className="header-content">
          <h2>Review Extracted Tasks</h2>
          <p>
            Found {tasks.length} potential task{tasks.length !== 1 ? 's' : ''} in your document.
            Review and select which ones to create.
          </p>
        </div>
        <button className="close-btn" onClick={onClose}>
          <CloseIcon sx={{ fontSize: 24 }} />
        </button>
      </div>

      {/* Filter and Selection Controls */}
      <div className="review-controls">
        <div className="confidence-filter">
          <label>Minimum Confidence:</label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={filterByConfidence}
            onChange={(e) => setFilterByConfidence(Number(e.target.value))}
          />
          <span>{filterByConfidence}%</span>
        </div>

        <div className="selection-controls">
          <button 
            className="control-btn"
            onClick={selectAll}
            disabled={filteredTasks.length === 0}
          >
            Select All ({filteredTasks.length})
          </button>
          <button 
            className="control-btn"
            onClick={deselectAll}
          >
            Deselect All
          </button>
        </div>

        <div className="selection-summary">
          <span>
            {selectedTasks.size} of {filteredTasks.length} selected
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks">
            <WarningIcon sx={{ fontSize: 48 }} />
            <h3>No tasks found</h3>
            <p>
              {filterByConfidence > 0 
                ? `No tasks with confidence ≥ ${filterByConfidence}%`
                : 'No tasks were extracted from this document'
              }
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className={`task-card ${selectedTasks.has(task.id) ? 'selected' : ''}`}>
              <div className="task-selection">
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                />
              </div>

              <div className="task-content">
                <div className="task-header">
                  <div className="task-title-section">
                    {editingTask?.id === task.id ? (
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                        className="task-title-input"
                        autoFocus
                      />
                    ) : (
                      <h3 className="task-title">{task.title}</h3>
                    )}
                    
                    <div className="task-badges">
                      <span className={`confidence-badge ${getConfidenceBadgeColor(task.confidence)}`}>
                        {task.confidence}% confidence
                      </span>
                      {task.isEdited && (
                        <span className="edited-badge">Edited</span>
                      )}
                    </div>
                  </div>

                  <div className="task-actions">
                    {editingTask?.id === task.id ? (
                      <>
                        <button className="save-btn" onClick={saveEdit} title="Save">
                          <CheckIcon sx={{ fontSize: 16 }} />
                        </button>
                        <button className="cancel-btn" onClick={cancelEdit} title="Cancel">
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </button>
                      </>
                    ) : (
                      <button 
                        className="edit-btn"
                        onClick={() => startEditing(task)}
                        title="Edit task"
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="task-details">
                  {editingTask?.id === task.id ? (
                    <textarea
                      value={editingTask.description}
                      onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                      className="task-description-input"
                      placeholder="Add a description..."
                      rows="3"
                    />
                  ) : (
                    task.description && (
                      <p className="task-description">{task.description}</p>
                    )
                  )}

                  <div className="task-metadata">
                    <div className="metadata-item">
                      <CalendarTodayIcon sx={{ fontSize: 16 }} />
                      {editingTask?.id === task.id ? (
                        <input
                          type="date"
                          value={editingTask.dueDate?.split('T')[0] || ''}
                          onChange={(e) => setEditingTask(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="task-date-input"
                        />
                      ) : (
                        <span>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                      )}
                    </div>

                    <div className="metadata-item">
                      <FlagIcon sx={{ fontSize: 16, color: getPriorityColor(task.priority) }} />
                      {editingTask?.id === task.id ? (
                        <select
                          value={editingTask.priority}
                          onChange={(e) => setEditingTask(prev => ({ ...prev, priority: e.target.value }))}
                          className="task-priority-select"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      ) : (
                        <span className="priority-text">{task.priority} Priority</span>
                      )}
                    </div>

                    {(task.assignee || editingTask?.id === task.id) && (
                      <div className="metadata-item">
                        <PersonIcon sx={{ fontSize: 16 }} />
                        {editingTask?.id === task.id ? (
                          <input
                            type="text"
                            value={editingTask.assignee}
                            onChange={(e) => setEditingTask(prev => ({ ...prev, assignee: e.target.value }))}
                            className="task-assignee-input"
                            placeholder="Assign to..."
                          />
                        ) : (
                          <span>{task.assignee}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Original context */}
                  {task.originalText && (
                    <details className="task-context">
                      <summary>View Original Text</summary>
                      <div className="context-text">
                        {task.originalText}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Tasks Button */}
      {tasks.length > 0 && (
        <div className="review-footer">
          <button
            className="create-tasks-btn"
            onClick={createTasks}
            disabled={selectedTasks.size === 0 || creating}
          >
            {creating ? (
              <>
                <div className="btn-spinner"></div>
                Creating Tasks...
              </>
            ) : (
              <>
                <Check size={16} />
                Create {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskExtractionReview;
