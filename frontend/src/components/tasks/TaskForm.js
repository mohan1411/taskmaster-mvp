import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Stack,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Typography,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CustomDateTimePicker from '../common/CustomDateTimePicker';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Task priority options
const priorityOptions = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'urgent', label: 'Urgent', color: 'error' }
];

// Task status options
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

// Default categories (could be fetched from backend in the future)
const categoryOptions = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'finance', label: 'Finance' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' }
];

// Validation schema
const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string(),
  priority: Yup.string().required('Priority is required'),
  status: Yup.string().required('Status is required'),
  category: Yup.string().required('Category is required'),
  dueDate: Yup.date().nullable()
});

const TaskForm = ({ task, onSubmit, onCancel, isSubmitting, error }) => {
  // Initial form values depending on whether we're editing or creating
  const initialValues = {
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    category: task?.category || 'work',
    dueDate: task?.dueDate ? new Date(task.dueDate) : null,
    labels: task?.labels || []
  };

  // New label input state
  const [newLabel, setNewLabel] = useState('');
  const [labelError, setLabelError] = useState('');

  // Form handling with formik
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  // Add a new label
  const handleAddLabel = () => {
    setLabelError('');
    if (!newLabel) {
      return;
    }

    if (formik.values.labels.includes(newLabel)) {
      setLabelError('Label already exists');
      return;
    }

    formik.setFieldValue('labels', [...formik.values.labels, newLabel]);
    setNewLabel('');
  };

  // Remove a label
  const handleRemoveLabel = (labelToRemove) => {
    formik.setFieldValue(
      'labels', 
      formik.values.labels.filter(label => label !== labelToRemove)
    );
  };

  // Handle Enter key for adding labels
  const handleLabelKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLabel();
    }
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        id="title"
        name="title"
        label="Task Title"
        margin="normal"
        value={formik.values.title}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.title && Boolean(formik.errors.title)}
        helperText={formik.touched.title && formik.errors.title}
      />

      <TextField
        fullWidth
        id="description"
        name="description"
        label="Description"
        margin="normal"
        multiline
        rows={4}
        value={formik.values.description}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.description && Boolean(formik.errors.description)}
        helperText={formik.touched.description && formik.errors.description}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
        <FormControl 
          fullWidth 
          error={formik.touched.priority && Boolean(formik.errors.priority)}
        >
          <InputLabel id="priority-label">Priority</InputLabel>
          <Select
            labelId="priority-label"
            id="priority"
            name="priority"
            value={formik.values.priority}
            label="Priority"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {priorityOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                <Chip 
                  label={option.label} 
                  color={option.color} 
                  size="small" 
                  sx={{ mr: 1 }} 
                />
              </MenuItem>
            ))}
          </Select>
          {formik.touched.priority && formik.errors.priority && (
            <FormHelperText>{formik.errors.priority}</FormHelperText>
          )}
        </FormControl>

        <FormControl 
          fullWidth 
          error={formik.touched.status && Boolean(formik.errors.status)}
        >
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="status"
            name="status"
            value={formik.values.status}
            label="Status"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {statusOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {formik.touched.status && formik.errors.status && (
            <FormHelperText>{formik.errors.status}</FormHelperText>
          )}
        </FormControl>

        <FormControl 
          fullWidth 
          error={formik.touched.category && Boolean(formik.errors.category)}
        >
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            id="category"
            name="category"
            value={formik.values.category}
            label="Category"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {categoryOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {formik.touched.category && formik.errors.category && (
            <FormHelperText>{formik.errors.category}</FormHelperText>
          )}
        </FormControl>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CustomDateTimePicker
            label="Due Date"
            value={formik.values.dueDate}
            onChange={(newValue) => {
              formik.setFieldValue('dueDate', newValue);
            }}
            fullWidth
            error={formik.touched.dueDate && Boolean(formik.errors.dueDate)}
            helperText={formik.touched.dueDate && formik.errors.dueDate}
          />
        </LocalizationProvider>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Labels
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
          {formik.values.labels.map(label => (
            <Chip
              key={label}
              label={label}
              onDelete={() => handleRemoveLabel(label)}
              size="small"
            />
          ))}
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField
            id="new-label"
            label="Add Label"
            variant="outlined"
            size="small"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyPress={handleLabelKeyPress}
            error={Boolean(labelError)}
            helperText={labelError}
            sx={{ flexGrow: 1 }}
          />
          <Button 
            variant="outlined" 
            onClick={handleAddLabel}
            sx={{ minWidth: 100 }}
          >
            Add
          </Button>
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 4, mb: 2, justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          color="inherit" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} /> 
          ) : (
            task ? 'Update Task' : 'Create Task'
          )}
        </Button>
      </Stack>
    </Box>
  );
};

export default TaskForm;
