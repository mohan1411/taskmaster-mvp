// @desc    Get task count for an email
// @route   GET /api/tasks/count
// @access  Private
const getTaskCountByEmail = async (req, res) => {
  try {
    const { emailSource } = req.query;
    
    if (!emailSource) {
      return res.status(400).json({ message: 'Email ID is required' });
    }
    
    // Count tasks that are linked to this email
    const count = await Task.countDocuments({
      user: req.user._id,
      emailSource: emailSource
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting task count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};