  // Part 2: JSX and remaining functions
  // Error boundary
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              Follow-ups
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your follow-up tasks and track progress
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm('create')}
            >
              Create Follow-up
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Follow-ups
                </Typography>
                <Typography variant="h4">
                  {analytics.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {analytics.byStatus.pending}
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
                  {analytics.overdue}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Due Today
                </Typography>
                <Typography variant="h4" color="info.main">
                  {analytics.dueToday}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs and Filters */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Active" />
            <Tab label="Pending" />
            <Tab label="In Progress" />
            <Tab label="Completed" />
            <Tab label="Ignored" />
          </Tabs>
        </Box>

        {/* Filter Section */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due After"
                  value={dueDateFilter.after}
                  onChange={(date) => setDueDateFilter(prev => ({ ...prev, after: date }))}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due Before"
                  value={dueDateFilter.before}
                  onChange={(date) => setDueDateFilter(prev => ({ ...prev, before: date }))}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                startIcon={<FilterListIcon />}
                onClick={handleClearFilters}
                variant="outlined"
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Follow-ups List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : followups.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No follow-ups found
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {statusFilter.includes('pending') ? 
              'Create your first follow-up to get started' : 
              'No follow-ups with the selected filters'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm('create')}
            sx={{ mt: 2 }}
          >
            Create Follow-up
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {followups.map((followup) => (
            <Paper key={followup._id} sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <IconButton size="small" sx={{ mr: 1 }}>
                      {getPriorityIcon(followup.priority)}
                    </IconButton>
                    <Typography variant="h6">
                      {followup.subject}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                      {followup.contactName || followup.contactEmail}
                    </Typography>
                    {getStatusIcon(followup.status)}
                  </Box>
                  <Chip
                    label={getDueDateText(followup.dueDate).text}
                    color={getDueDateText(followup.dueDate).color}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {followup.linkedEmail && (
                    <Chip
                      icon={<EmailIcon />}
                      label="Linked to Email"
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {followup.linkedTask && (
                    <Chip
                      icon={<AssignmentIcon />}
                      label="Linked to Task"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {followup.status === 'pending' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleStatusChange(followup._id, 'in-progress')}
                      >
                        Start
                      </Button>
                    )}
                    {(followup.status === 'pending' || followup.status === 'in-progress') && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleOpenCompletionDialog(followup._id)}
                        >
                          Complete
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleStatusChange(followup._id, 'ignored')}
                        >
                          Ignore
                        </Button>
                      </>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleOpenForm('edit', followup)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleOpenDeleteDialog(followup._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>

              {/* Expandable content for notes and key points */}
              {(followup.notes || followup.keyPoints?.length > 0) && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 1 }} />
                  {followup.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {followup.notes}
                    </Typography>
                  )}
                  {followup.keyPoints?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Points:
                      </Typography>
                      <List dense>
                        {followup.keyPoints.map((point, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <ChevronRightIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={point} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formType === 'create' ? 'Create Follow-up' : 'Edit Follow-up'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="subject"
              label="Subject"
              fullWidth
              value={formData.subject}
              onChange={handleFormChange}
              required
            />
            <TextField
              name="contactName"
              label="Contact Name"
              fullWidth
              value={formData.contactName}
              onChange={handleFormChange}
            />
            <TextField
              name="contactEmail"
              label="Contact Email"
              fullWidth
              value={formData.contactEmail}
              onChange={handleFormChange}
              type="email"
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                label="Priority"
                onChange={handleFormChange}
              >
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
            {formType === 'edit' && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleFormChange}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="ignored">Ignored</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField
              name="notes"
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleFormChange}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Key Points
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  name="newKeyPoint"
                  value={formData.newKeyPoint}
                  onChange={handleFormChange}
                  placeholder="Add a key point"
                  size="small"
                  fullWidth
                />
                <Button onClick={handleAddKeyPoint} variant="outlined">
                  Add
                </Button>
              </Box>
              <Stack spacing={1}>
                {formData.keyPoints.map((point, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChevronRightIcon fontSize="small" />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {point}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveKeyPoint(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button onClick={handleSubmitForm} variant="contained">
            {formType === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog 
        open={completionDialog.open} 
        onClose={() => setCompletionDialog({ open: false, followupId: null, notes: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Follow-up</DialogTitle>
        <DialogContent>
          <TextField
            label="Completion Notes"
            multiline
            rows={4}
            fullWidth
            value={completionDialog.notes}
            onChange={(e) => setCompletionDialog(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about the completion..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialog({ open: false, followupId: null, notes: '' })}>
            Cancel
          </Button>
          <Button onClick={handleCompleteWithNotes} variant="contained" color="success">
            Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, followupId: null })}
      >
        <DialogTitle>Delete Follow-up</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this follow-up? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, followupId: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteFollowup} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FollowUpsPage;
