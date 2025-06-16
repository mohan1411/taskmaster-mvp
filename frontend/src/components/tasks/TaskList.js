import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Stack,
  IconButton,
  Grid,
  Menu,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Priority colors
const priorityColors = {
  'low': 'success',
  'medium': 'info',
  'high': 'warning',
  'urgent': 'error'
};

// Status colors
const statusColors = {
  'pending': 'default',
  'in-progress': 'primary',
  'completed': 'success',
  'archived': 'error'
};

// Task categories
const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'finance', label: 'Finance' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' }
];

// Priority options
const priorities = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

// Status options
const statuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

// Sort options
const sortOptions = [
  { value: 'dueDate_asc', label: 'Due Date (Ascending)' },
  { value: 'dueDate_desc', label: 'Due Date (Descending)' },
  { value: 'priority_asc', label: 'Priority (Low to High)' },
  { value: 'priority_desc', label: 'Priority (High to Low)' },
  { value: 'createdAt_desc', label: 'Recently Created' },
  { value: 'createdAt_asc', label: 'Oldest Created' }
];

const TaskList = ({ 
  tasks = [], 
  loading = false, 
  error = null,
  onEdit, 
  onDelete, 
  onStatusChange,
  onFilterChange
}) => {
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate_asc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Task action menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Handle opening task menu
  const handleOpenMenu = (event, task) => {
    event.stopPropagation(); // Prevent event bubbling
    console.log('Opening menu for task:', task); // Debug logging
    setMenuAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  // Handle closing task menu
  const handleCloseMenu = () => {
    console.log('Closing menu'); // Debug logging
    setMenuAnchorEl(null);
    setSelectedTask(null);
  };

  // Handle task edit from menu
  const handleEditTask = () => {
    console.log('Edit task requested for:', selectedTask); // Debug logging
    if (selectedTask && onEdit) {
      onEdit(selectedTask);
    }
    handleCloseMenu();
  };

  // Handle task delete from menu
  const handleDeleteTask = () => {
    console.log('Delete task requested for:', selectedTask); // Debug logging
    if (selectedTask && onDelete) {
      // Ensure we have a valid task with required properties
      if (selectedTask._id && selectedTask.title) {
        onDelete(selectedTask);
      } else {
        console.error('Invalid task object for deletion:', selectedTask);
      }
    }
    handleCloseMenu();
  };

  // Handle status change
  const handleStatusChange = (task, newStatus) => {
    if (onStatusChange) {
      onStatusChange(task, newStatus);
    }
  };

  // Handle filter changes
  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        searchTerm,
        category: categoryFilter,
        priority: priorityFilter,
        status: statusFilter,
        sortBy
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
    setSortBy('dueDate_asc');
    
    if (onFilterChange) {
      onFilterChange({
        searchTerm: '',
        category: 'all',
        priority: 'all',
        status: 'all',
        sortBy: 'dueDate_asc'
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return format(date, 'PPp'); // Format as "Apr 29, 2022, 5:00 PM"
  };

  // Check if a task is overdue
  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'completed' || task.status === 'archived') return false;
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < now;
  };

  // Function to get status badge color
  const getStatusColor = (status, task) => {
    if (isOverdue(task) && (status === 'pending' || status === 'in-progress')) {
      return 'error';
    }
    return statusColors[status] || 'default';
  };

  return (
    <Box>
      {/* Search and filter section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" mb={2}>
            <TextField
              fullWidth
              placeholder="Search tasks..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              sx={{ minWidth: 120 }}
            >
              Filters
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={applyFilters}
              sx={{ minWidth: 120 }}
            >
              Apply
            </Button>
          </Stack>
          
          {filtersOpen && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-filter-label">Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    id="category-filter"
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {categories.map(category => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="priority-filter-label">Priority</InputLabel>
                  <Select
                    labelId="priority-filter-label"
                    id="priority-filter"
                    value={priorityFilter}
                    label="Priority"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    {priorities.map(priority => (
                      <MenuItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statuses.map(status => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="sort-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-label"
                    id="sort"
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <SortIcon fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    {sortOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="text" 
                  color="inherit" 
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tasks found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or create a new task
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Task list */}
      {tasks.length > 0 && (
        <Stack spacing={2}>
          {tasks.map(task => (
            <Card 
              key={task._id} 
              sx={{ 
                borderLeft: 4, 
                borderColor: `${priorityColors[task.priority]}.main`,
                opacity: task.status === 'completed' || task.status === 'archived' ? 0.8 : 1
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" component="div" sx={{ 
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
                      <Chip 
                        label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} 
                        color={priorityColors[task.priority]} 
                        size="small" 
                      />
                      <Chip 
                        label={task.category} 
                        variant="outlined" 
                        size="small" 
                      />
                      <Chip 
                        label={isOverdue(task) && task.status !== 'completed' ? 
                          `${task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} (Overdue)` : 
                          task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        } 
                        color={getStatusColor(task.status, task)} 
                        size="small" 
                      />
                    </Stack>
                    
                    {task.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        {task.description}
                      </Typography>
                    )}
                    
                    {task.labels && task.labels.length > 0 && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {task.labels.map(label => (
                          <Chip key={label} label={label} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    )}
                    
                    <Typography variant="caption" color={isOverdue(task) ? "error" : "text.secondary"}>
                      {task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'No due date'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <IconButton 
                      aria-label="task actions"
                      onClick={(e) => handleOpenMenu(e, task)}
                      sx={{ color: theme => theme.palette.text.primary }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
              
              {/* Quick action buttons */}
              {task.status !== 'completed' && task.status !== 'archived' && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                  {task.status === 'pending' && (
                    <Button
                      size="small"
                      variant="text"
                      color="primary"
                      onClick={() => handleStatusChange(task, 'in-progress')}
                    >
                      Start
                    </Button>
                  )}
                  {task.status === 'in-progress' && (
                    <Button
                      size="small"
                      variant="text"
                      color="success"
                      onClick={() => handleStatusChange(task, 'completed')}
                    >
                      Complete
                    </Button>
                  )}
                </Box>
              )}
            </Card>
          ))}
        </Stack>
      )}

      {/* Task action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleEditTask}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        
        {selectedTask && selectedTask.status !== 'completed' && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedTask, 'completed');
            handleCloseMenu();
          }}>
            <Chip label="✓" size="small" color="success" sx={{ mr: 1 }} />
            Mark as Completed
          </MenuItem>
        )}
        
        {selectedTask && selectedTask.status === 'completed' && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedTask, 'pending');
            handleCloseMenu();
          }}>
            <Chip label="↻" size="small" color="primary" sx={{ mr: 1 }} />
            Reopen Task
          </MenuItem>
        )}
        
        <Divider />
        
        <MenuItem onClick={handleDeleteTask} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskList;
