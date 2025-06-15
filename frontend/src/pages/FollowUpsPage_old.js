                      onClick={() => handleOpenCompletionDialog(followup._id)}
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {followup.status !== 'ignored' && followup.status !== 'completed' && (
                  <Tooltip title="Mark as not needed">
                    <IconButton 
                      size="small" 
                      color="default" 
                      onClick={() => handleStatusChange(followup._id, 'ignored')}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Edit follow-up">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenForm('edit', followup)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete follow-up">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleOpenDeleteDialog(followup._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
          
          {followup.completedAt && followup.status === 'completed' && (
            <Grid item xs={12}>
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Completed on:</strong> {format(new Date(followup.completedAt), 'MMM d, yyyy')}
                </Typography>
                {followup.completionNotes && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Completion notes:</strong> {followup.completionNotes}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button 
            onClick={handleSubmitForm} 
            variant="contained" 
            color="primary"
            disabled={!formData.subject}
          >
            {formType === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Completion Dialog */}
      <Dialog open={completionDialog.open} onClose={() => setCompletionDialog(prev => ({ ...prev, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>
          Mark Follow-up as Completed
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Completion Notes (optional)"
            fullWidth
            variant="outlined"
            value={completionDialog.notes}
            onChange={(e) => setCompletionDialog(prev => ({ ...prev, notes: e.target.value }))}
            multiline
            rows={3}
            placeholder="Add any notes about how this follow-up was addressed..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
          <Button 
            onClick={handleCompleteWithNotes} 
            variant="contained" 
            color="success"
            startIcon={<DoneIcon />}
          >
            Complete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog(prev => ({ ...prev, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>
          Delete Follow-up
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this follow-up? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
          <Button 
            onClick={handleDeleteFollowup} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FollowUpsPage;</Button>
          <Button 
            onClick={handleSubmitForm} 
            variant="contained" 
            color="primary"
            disabled={!formData.subject}
          >
            {formType === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Completion Dialog */}
      <Dialog open={completionDialog.open} onClose={() => setCompletionDialog(prev => ({ ...prev, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>
          Mark Follow-up as Completed
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Completion Notes (optional)"
            fullWidth
            variant="outlined"
            value={completionDialog.notes}
            onChange={(e) => setCompletionDialog(prev => ({ ...prev, notes: e.target.value }))}
            multiline
            rows={3}
            placeholder="Add any notes about how this follow-up was addressed..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
          <Button 
            onClick={handleCompleteWithNotes} 
            variant="contained" 
            color="success"
            startIcon={<DoneIcon />}
          >
            Complete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog(prev => ({ ...prev, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>
          Delete Follow-up
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this follow-up? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
          <Button 
            onClick={handleDeleteFollowup} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FollowUpsPage; => setCompletionDialog(prev => ({ ...prev, notes: e.target.value }))}
            multiline
            rows={3}
            placeholder="Add any notes about how this follow-up was addressed..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
          <Button 
            onClick={handleCompleteWithNotes} 
            variant="contained" 
            color="success"
            startIcon={<DoneIcon />}
          >
            Complete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog(prev => ({ ...prev, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>
          Delete Follow-up
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this follow-up? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
          <Button 
            onClick={handleDeleteFollowup} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FollowUpsPage;Icon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FollowUpsPage;
          )}
        </Grid>
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Header and controls */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                Follow-ups
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenForm('create')}
              >
                New Follow-up
              </Button>
            </Box>
          </Grid>
          
          {/* Analytics summary cards */}
          {analytics && (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="h6" color="text.secondary">Pending</Typography>
                      <Typography variant="h4">{analytics.statusCounts.pending || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="h6" color="text.secondary">Due this week</Typography>
                      <Typography variant="h4">{analytics.dueThisWeek || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="h6" color="text.secondary">Overdue</Typography>
                      <Typography variant="h4" color="error.main">{analytics.overdueCount || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="h6" color="text.secondary">Completion Rate</Typography>
                      <Typography variant="h4">{analytics.completionRate?.toFixed(0) || 0}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          )}
          
          {/* Tab navigation */}
          <Grid item xs={12}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="follow-up status tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="All Active" />
                <Tab label="Pending" />
                <Tab label="In Progress" />
                <Tab label="Completed" />
                <Tab label="Ignored" />
              </Tabs>
            </Box>
          </Grid>
          
          {/* Filters */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="priority-filter-label">Priority</InputLabel>
                    <Select
                      labelId="priority-filter-label"
                      id="priority-filter"
                      value={priorityFilter}
                      label="Priority"
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <MenuItem value="">All Priorities</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Due before"
                      value={dueDateFilter.before}
                      onChange={(date) => setDueDateFilter(prev => ({ ...prev, before: date }))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Due after"
                      value={dueDateFilter.after}
                      onChange={(date) => setDueDateFilter(prev => ({ ...prev, after: date }))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<FilterListIcon />}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Main content */}
          <Grid item xs={12}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            ) : followups.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No follow-ups found
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {statusFilter.includes('pending') ? 
                    "You're all caught up! No pending follow-ups match your filters." : 
                    "No follow-ups match your current filters."}
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenForm('create')}
                >
                  Create a new follow-up
                </Button>
              </Paper>
            ) : (
              <Box>
                {/* Follow-up list */}
                <Stack spacing={2}>
                  {followups.map(followup => renderFollowupCard(followup))}
                </Stack>
                
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination 
                      count={totalPages} 
                      page={page} 
                      onChange={handlePageChange} 
                      color="primary"
                    />
                  </Box>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
      
      {/* Create/Edit Follow-up Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {formType === 'create' ? 'Create New Follow-up' : 'Edit Follow-up'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                name="subject"
                label="Subject"
                fullWidth
                variant="outlined"
                value={formData.subject}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactName"
                label="Contact Name"
                fullWidth
                variant="outlined"
                value={formData.contactName || ''}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactEmail"
                label="Contact Email"
                fullWidth
                variant="outlined"
                value={formData.contactEmail || ''}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined'
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            {formType === 'edit' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    label="Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="ignored">Ignored</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                fullWidth
                variant="outlined"
                value={formData.notes || ''}
                onChange={handleFormChange}
                multiline
                rows={3}
              />
            </Grid>
            
            {/* Key Points Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Key Points to Address
              </Typography>
              
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  name="newKeyPoint"
                  label="Add key point"
                  fullWidth
                  variant="outlined"
                  value={formData.newKeyPoint}
                  onChange={handleFormChange}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddKeyPoint}
                  disabled={!formData.newKeyPoint.trim()}
                >
                  Add
                </Button>
              </Box>
              
              {formData.keyPoints.length > 0 ? (
                <List dense>
                  {formData.keyPoints.map((point, index) => (
                    <ListItem 
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveKeyPoint(index)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <ChevronRightIcon />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No key points added yet. Add points that need to be addressed in this follow-up.
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button 
            onClick={handleSubmitForm} 
            variant="contained" 
            color="primary"
            disabled={!formData.subject}
          >
            {formType === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Completion Dialog */}
      <Dialog open={completionDialog.open} onClose={() => setCompletionDialog(prev => ({ ...prev, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>
          Mark Follow-up as Completed
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Completion Notes (optional)"
            fullWidth
            variant="outlined"
            value={completionDialog.notes}
            onChange={(e) => setCompletionDialog(prev => ({ ...prev, notes: e.target.value }))}
            multiline
            rows={3}
            placeholder="Add any notes about how this follow-up was addressed..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
          <Button 
            onClick={handleCompleteWithNotes} 
            variant="contained" 
            color="success"
            startIcon={<DoneIcon />}
          >
            Complete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog(prev => ({ ...prev, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>
          Delete Follow-up
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this follow-up? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
          <Button 
            onClick={handleDeleteFollowup} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FollowUpsPage;: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FollowUpsPage;