/**
 * Frontend Task Extraction UI Fix
 * 
 * This file provides fixes for showing appropriate messages and UI state 
 * when tasks have already been extracted from an email.
 */

// Updated EmailDetail.js handleExtractTasks method
const handleExtractTasks = async () => {
  try {
    setIsExtracting(true);
    setError(null);
    setSuccess(null);
    
    const response = await emailService.extractTasksFromEmail(email._id);
    
    if (response.alreadyExtracted) {
      // Handle case where tasks were already extracted
      setSuccess(`This email already has ${response.extractedTasks.length} tasks extracted.`);
      
      // Update the email's taskExtracted flag in the UI
      if (email && !email.taskExtracted) {
        email.taskExtracted = true;
      }
    } else if (response.extractedTasks && response.extractedTasks.length > 0) {
      setSuccess(`Successfully extracted ${response.extractedTasks.length} tasks!`);
      
      // Update the email's taskExtracted flag in the UI
      if (email) {
        email.taskExtracted = true;
      }
      
      if (onRefresh) onRefresh();
    } else {
      setError('No tasks found in this email.');
    }
  } catch (err) {
    console.error('Error extracting tasks:', err);
    setError('Failed to extract tasks. Please try again.');
  } finally {
    setIsExtracting(false);
  }
};

// Updated EmailsPage.js handleExtractTasks method
const handleExtractTasks = async (emailId) => {
  try {
    setIsLoading(true);
    setError(null);
    
    console.log('Starting task extraction for email:', emailId);
    
    // Make the API call with detailed logging
    try {
      console.log('Calling API to extract tasks...');
      const response = await emailService.extractTasksFromEmail(emailId);
      console.log('API response received:', response);
      
      if (response && response.alreadyExtracted) {
        console.log('Tasks were already extracted:', response.extractedTasks);
        
        // Show a different message when tasks are already extracted
        alert(`This email already has ${response.extractedTasks.length} tasks extracted.`);
        
        // Update UI to show email as processed
        await fetchEmails();
      } else if (response && response.extractedTasks && response.extractedTasks.length > 0) {
        console.log('Successfully extracted tasks:', response.extractedTasks);
        
        // Save the extracted tasks
        try {
          console.log('Saving tasks to database...');
          const saveResult = await taskService.saveExtractedTasks(response.extractedTasks, emailId);
          console.log('Save result:', saveResult);
          
          alert(`Successfully extracted ${response.extractedTasks.length} tasks!`);
          
          // Refresh emails to show updated UI state
          await fetchEmails();
        } catch (saveError) {
          console.error('Error saving tasks:', saveError);
          setError('Tasks were extracted but could not be saved. Please try again.');
        }
      } else {
        console.log('No tasks found in response:', response);
        setError('No tasks found in this email.');
      }
    } catch (apiError) {
      console.error('API error details:', apiError);
      
      // Log the full error response if available
      if (apiError.response) {
        console.error('API error status:', apiError.response.status);
        console.error('API error data:', apiError.response.data);
      }
      
      setError('Failed to extract tasks from email. Please try again.');
    }
  } catch (err) {
    console.error('Unexpected error in task extraction:', err);
    setError('An unexpected error occurred. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

// Email List component - Update to show "Tasks Extracted" badge
const getEmailIndicators = (email) => {
  return (
    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
      {email.taskExtracted && (
        <Chip 
          icon={<TaskIcon />}
          label="Tasks Extracted" 
          size="small" 
          color="primary"
          variant="outlined"
        />
      )}
      {email.needsFollowUp && (
        <Chip 
          icon={<FollowUpIcon />}
          label="Needs Follow-up" 
          size="small" 
          color="warning"
          variant="outlined"
        />
      )}
      {/* Other indicators */}
    </Box>
  );
};

/**
 * Integration tips:
 * 
 * 1. Update both the EmailDetail and EmailsPage components with the modified
 *    handleExtractTasks methods.
 * 
 * 2. Make sure Extract Tasks buttons are disabled when email.taskExtracted is true:
 *    disabled={isExtracting || email.taskExtracted}
 * 
 * 3. Add a "Tasks Extracted" badge/chip to emails that have already been processed
 * 
 * 4. Use different messaging for already-extracted emails vs. new extractions
 */
