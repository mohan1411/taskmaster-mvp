                    Due Today
                  </Typography>
                  <Chip 
                    label={taskData.dueTasks.length} 
                    size="small" 
                    sx={{ ml: 1, height: 20, fontSize: '0.688rem' }}
                  />
                </Box>
                <IconButton size="small">
                  {expandedSections.dueTasks ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>
              
              <Divider />
              
              <Collapse in={expandedSections.dueTasks}>
                {taskData.dueTasks.length > 0 ? (
                  <List dense sx={{ py: 0 }}>
                    {taskData.dueTasks.map((task) => (
                      <ListItem 
                        key={task._id} 
                        button
                        onClick={() => navigate('/tasks')}
                        sx={{ 
                          py: 1, 
                          px: 1.5,
                          '&:hover': {
                            bgcolor: 'action.hover',
                            '& .task-actions': { opacity: 1 }
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleOutline sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" noWrap sx={{ fontSize: '0.813rem' }}>
                              {task.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                              <Chip 
                                size="small" 
                                label={task.priority} 
                                color={priorityColors[task.priority]} 
                                sx={{ height: 16, fontSize: '0.625rem' }}
                              />
                              {task.dueDate && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.688rem' }}>
                                  {new Date(task.dueDate).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Box className="task-actions" sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                      No tasks due today
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/tasks')}
                      sx={{ mt: 1, fontSize: '0.75rem' }}
                    >
                      View All Tasks
                    </Button>
                  </Box>
                )}
              </Collapse>
              
              {taskData.dueTasks.length > 0 && expandedSections.dueTasks && (
                <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
                  <Button 
                    size="small" 
                    fullWidth
                    endIcon={<ArrowForward fontSize="small" />}
                    onClick={() => navigate('/tasks')}
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                  >
                    View All Tasks
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Follow-ups Widget */}
          <Grid item xs={12} md={6}>
            <FollowUpWidget compact />
          </Grid>
        </Grid>
        
        {/* Recent Tasks - Compact List View */}
        <Paper sx={{ mt: 2 }}>
          <Box 
            sx={{ 
              p: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              bgcolor: 'grey.50',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => toggleSection('recentTasks')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="subtitle1" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                Recent Tasks
              </Typography>
              <Chip 
                label={taskData.recentTasks.length} 
                size="small" 
                sx={{ ml: 1, height: 20, fontSize: '0.688rem' }}
              />
            </Box>
            <IconButton size="small">
              {expandedSections.recentTasks ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          
          <Divider />
          
          <Collapse in={expandedSections.recentTasks}>
            {taskData.recentTasks.length > 0 ? (
              <List dense sx={{ py: 0 }}>
                {taskData.recentTasks.map((task) => (
                  <ListItem 
                    key={task._id}
                    button
                    onClick={() => navigate('/tasks')}
                    sx={{ 
                      py: 1, 
                      px: 1.5,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 },
                      '&:hover': {
                        bgcolor: 'action.hover',
                        '& .task-actions': { opacity: 1 }
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontSize: '0.813rem', fontWeight: 500 }}>
                          {task.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip 
                            size="small" 
                            label={task.priority} 
                            color={priorityColors[task.priority]} 
                            sx={{ height: 16, fontSize: '0.625rem' }}
                          />
                          {task.dueDate && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.688rem' }}>
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </Typography>
                          )}
                          {task.email && (
                            <Tooltip title="From email">
                              <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      <Box className="task-actions" sx={{ opacity: 0, transition: 'opacity 0.2s', ml: 2 }}>
                        <IconButton size="small">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                  No recent tasks
                </Typography>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => navigate('/tasks')}
                  sx={{ mt: 1, fontSize: '0.75rem' }}
                >
                  Create Your First Task
                </Button>
              </Box>
            )}
          </Collapse>
          
          {taskData.recentTasks.length > 3 && expandedSections.recentTasks && (
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                size="small" 
                fullWidth
                endIcon={<ArrowForward fontSize="small" />}
                onClick={() => navigate('/tasks')}
                sx={{ fontSize: '0.75rem', py: 0.5 }}
              >
                View All Tasks
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardPageCompact;
