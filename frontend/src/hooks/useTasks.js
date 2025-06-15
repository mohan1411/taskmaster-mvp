import { useState, useEffect } from 'react';
import taskService from '../services/taskService';
import { useAuth } from '../context/AuthContext';

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getTasks();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await taskService.createTask(taskData);
      const newTask = response.task;
      setTasks([newTask, ...tasks]);
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const response = await taskService.updateTask(taskId, updates);
      const updatedTask = response.task;
      setTasks(tasks.map(task => task._id === taskId ? updatedTask : task));
      return updatedTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const completeTask = async (taskId) => {
    return updateTask(taskId, { status: 'completed', completedAt: new Date() });
  };

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask
  };
};