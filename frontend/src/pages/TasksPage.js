import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Button, 
  Fab, 
  Snackbar, 
  Alert,
  LinearProgress,
  Divider,
  Paper,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import TaskList from '../components/tasks/TaskList';
import TaskModal from '../components/tasks/TaskModal';
import DeleteConfirmationDialog from '../components/common/DeleteConfirmationDialog';
import taskService from '../services/taskService';
import '../styles/GlobalPages.css';

const TasksPage = () => {
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    sortBy: 'dueDate_asc',
    page: 1,
    limit: 20
  });
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  
  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load tasks on initial render and when filters change
  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Load completed tasks count separately
  useEffect(() => {
    fetchCompletedCount();
  }, []);

  // Add debugging logging function to see overdue counts
  useEffect(() => {
    // Calculate overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed' || task.status === 'archived') return false;
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      return dueDate < now;
    });
    
    console.log('[DEBUG] Tasks Page - Overdue tasks:', overdueTasks.length);
    console.log('[DEBUG] Tasks Page - Overdue task details:', overdueTasks);
    
    // Log the API filter used
    console.log('[DEBUG] Tasks Page - API filters:', filters);
  }, [tasks]);

  // Fetch completed tasks count
  const fetchCompletedCount = async () => {
    try {
      // Specifically fetch completed tasks
      const response = await taskService.getTasks({ 
        status: 'completed',
        limit: 1000
      });
      
      console.log('Fetched completed tasks:', response);
      setCompletedTasksCount(response.total || response.tasks.length);
    } catch (err) {
      console.error('Error fetching completed count:', err);
    }
  };

  // Fetch tasks with current filters
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare API filter params
      const apiFilters = {
        ...filters,
        search: filters.searchTerm
      };
      
      // Handle sort
      if (filters.sortBy) {
        const [field, direction] = filters.sortBy.split('_');
        apiFilters.sort = field;
        apiFilters.order = direction;
      }
      
      const response = await taskService.getTasks(apiFilters);
      setTasks(response.tasks);
      setTotalTasks(response.total);
      
      console.log('Fetched tasks:', response.tasks.length, 'Total:', response.total);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open task creation modal
  const handleCreateTask = () => {
    setCurrentTask(null);
    setSubmitError(null);
    setTaskModalOpen(true);
  };

  // Open task edit modal
  const handleEditTask = (task) => {
    setCurrentTask(task);
    setSubmitError(null);
    setTaskModalOpen(true);
  };

  // Handle task creation or update
  const handleSubmitTask = async (taskData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      let result;
      let message;
      
      if (currentTask) {
        // Update existing task
        result = await taskService.updateTask(currentTask._id, taskData);
        message = 'Task updated successfully';
        
        // Update task in state
        setTasks((prevTasks) => 
          prevTasks.map((task) => 
            task._id === currentTask._id ? result : task
          )
        );
      } else {
        // Create new task
        result = await taskService.createTask(taskData);
        message = 'Task created successfully';
        
        // Add new task to state
        setTasks((prevTasks) => [result, ...prevTasks]);
        
        // Update total tasks count
        setTotalTasks((prevTotal) => prevTotal + 1);
      }
      
      // Close modal and show success notification
      setTaskModalOpen(false);
      setNotification({
        open: true,
        message,
        severity: 'success'
      });
      
      // Refresh completed count
      fetchCompletedCount();
      
    } catch (err) {
      console.error('Error submitting task:', err);
      setSubmitError('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeletePrompt = (task) => {
    console.log('Delete prompt for task:', task); // Debug logging
    
    // Validate task object
    if (!task || !task._id || !task.title) {
      console.error('Invalid task object for deletion:', task);
      setNotification({
        open: true,
        message: 'Invalid task selected. Please try again.',
        severity: 'error'
      });
      return;
    }

    // Prevent multiple dialogs by checking if one is already open
    if (deleteDialogOpen) {
      console.warn('Delete dialog already open, ignoring duplicate request');
      return;
    }

    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete || !taskToDelete._id) {
      console.error('No valid task to delete');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      return;
    }
    
    try {
      setIsDeleting(true);
      
      console.log('Deleting task:', taskToDelete._id); // Debug logging
      const result = await taskService.deleteTask(taskToDelete._id);
      console.log('Delete result:', result); // Debug logging
      
      // Remove deleted task from state
      setTasks((prevTasks) => 
        prevTasks.filter((task) => task._id !== taskToDelete._id)
      );
      
      // Update total tasks count
      setTotalTasks((prevTotal) => Math.max(0, prevTotal - 1));
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Task deleted successfully',
        severity: 'success'
      });
      
      // Refresh completed count
      fetchCompletedCount();
      
    } catch (err) {
      console.error('Error deleting task:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      // More specific error messages
      let errorMessage = 'Failed to delete task. Please try again.';
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Task not found. It may have already been deleted.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to delete this task.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error occurred while deleting the task.';
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = `Network error: ${err.message}`;
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    console.log('Closing delete dialog'); // Debug logging
    if (!isDeleting) { // Prevent closing while deletion is in progress
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  // Handle task status change
  const handleStatusChange = async (task, newStatus) => {
    try {
      setLoading(true);
      
      const updatedTask = await taskService.updateTaskStatus(task._id, newStatus);
      
      // Update task in state
      setTasks((prevTasks) => 
        prevTasks.map((t) => 
          t._id === task._id ? updatedTask : t
        )
      );
      
      setNotification({
        open: true,
        message: `Task marked as ${newStatus.replace('-', ' ')}`,
        severity: 'success'
      });
      
      // Refresh completed count when status changes
      fetchCompletedCount();
      
    } catch (err) {
      console.error('Error updating task status:', err);
      setNotification({
        open: true,
        message: 'Failed to update task status. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Tasks
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateTask}
          >
            Create Task
          </Button>
        </Box>
        
        {/* Summary Cards - Consistent with Follow-ups page */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Tasks
                </Typography>
                <Typography variant="h4">
                  {totalTasks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Tasks
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {tasks.filter(task => 
                    task.status !== 'completed' && task.status !== 'archived'
                  ).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {completedTasksCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overdue
                </Typography>
                <Typography variant="h4" color="error.main">
                  {tasks.filter(task => {
                    if (!task.dueDate || task.status === 'completed' || task.status === 'archived') return false;
                    const now = new Date();
                    const dueDate = new Date(task.dueDate);
                    return dueDate < now;
                  }).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Global loading indicator */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {/* Task list */}
        <TaskList
          tasks={tasks}
          loading={loading}
          error={error}
          onEdit={handleEditTask}
          onDelete={handleDeletePrompt}
          onStatusChange={handleStatusChange}
          onFilterChange={handleFilterChange}
        />
        
        {/* Floating action button for mobile */}
        <Box sx={{ display: { sm: 'none' } }}>
          <Fab
            color="primary"
            aria-label="add"
            sx={{ position: 'fixed', bottom: 20, right: 20 }}
            onClick={handleCreateTask}
          >
            <AddIcon />
          </Fab>
        </Box>
        
        {/* Task Modal */}
        <TaskModal
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          task={currentTask}
          onSubmit={handleSubmitTask}
          isSubmitting={isSubmitting}
          error={submitError}
        />
        
        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleDeleteTask}
          title="Delete Task"
          content={`Are you sure you want to delete "${taskToDelete?.title || 'this task'}"? This action cannot be undone.`}
          isDeleting={isDeleting}
        />
        
        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default TasksPage;
