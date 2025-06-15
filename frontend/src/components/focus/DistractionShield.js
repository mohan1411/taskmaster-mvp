import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Slide,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Block as BlockIcon,
  NotificationsOff as NotificationOffIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Psychology as FlowIcon
} from '@mui/icons-material';
import { useFocus } from '../../context/FocusContext';

// Distraction analysis engine
const analyzeDistraction = (distraction) => {
  const { source, content, sender, timestamp } = distraction;
  
  // Urgency detection keywords
  const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately'];
  const importantKeywords = ['important', 'priority', 'deadline', 'meeting'];
  
  // Check for urgency in content
  const hasUrgentKeywords = urgentKeywords.some(keyword => 
    content?.toLowerCase().includes(keyword)
  );
  
  const hasImportantKeywords = importantKeywords.some(keyword => 
    content?.toLowerCase().includes(keyword)
  );
  
  // Sender importance (would be configured by user)
  const vipSenders = ['ceo@', 'manager@', 'boss@', 'director@'];
  const isVipSender = vipSenders.some(vip => sender?.toLowerCase().includes(vip));
  
  // Time-based urgency
  const isWeekend = [0, 6].includes(new Date().getDay());
  const isAfterHours = new Date().getHours() < 8 || new Date().getHours() > 18;
  
  // Calculate urgency score
  let urgencyScore = 0;
  if (hasUrgentKeywords) urgencyScore += 0.4;
  if (hasImportantKeywords) urgencyScore += 0.2;
  if (isVipSender) urgencyScore += 0.3;
  if (isWeekend || isAfterHours) urgencyScore -= 0.1;
  
  // Determine urgency level
  let urgency = 'low';
  if (urgencyScore >= 0.7) urgency = 'critical';
  else if (urgencyScore >= 0.4) urgency = 'high';
  else if (urgencyScore >= 0.2) urgency = 'medium';
  
  return {
    urgency,
    score: urgencyScore,
    reasons: {
      hasUrgentKeywords,
      hasImportantKeywords,
      isVipSender,
      isWeekend,
      isAfterHours
    }
  };
};

// Blocked distraction display component
const BlockedDistraction = ({ distraction, onView, onAllow, minimal = false }) => {
  const analysis = analyzeDistraction(distraction);
  
  const getSourceIcon = (source) => {
    switch (source) {
      case 'email': return <EmailIcon />;
      case 'slack': return <MessageIcon />;
      case 'notification': return <NotificationOffIcon />;
      default: return <BlockIcon />;
    }
  };
  
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };
  
  if (minimal) {
    return (
      <Chip
        icon={getSourceIcon(distraction.source)}
        label={`${distraction.source}: ${distraction.title || 'New message'}`}
        size="small"
        color={getUrgencyColor(analysis.urgency)}
        onDelete={onView}
        deleteIcon={<ViewIcon />}
        sx={{ m: 0.5 }}
      />
    );
  }
  
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            {getSourceIcon(distraction.source)}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {distraction.title || `New ${distraction.source} message`}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                From: {distraction.sender}
              </Typography>
            </Box>
            <Chip 
              label={analysis.urgency} 
              size="small" 
              color={getUrgencyColor(analysis.urgency)}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            <Button size="small" onClick={onView}>
              View
            </Button>
            {analysis.urgency === 'critical' && (
              <Button size="small" color="error" onClick={onAllow}>
                Allow
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const DistractionShield = ({ compact = false }) => {
  const {
    focusSession,
    distractionState,
    userMetrics,
    handleDistraction,
    focusPreferences
  } = useFocus();
  
  const [recentBlocks, setRecentBlocks] = useState([]);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [blockAnimation, setBlockAnimation] = useState(false);
  
  // Simulate incoming distractions for demo
  useEffect(() => {
    if (!focusSession.active) return;
    
    const distractionTypes = [
      {
        source: 'email',
        title: 'Re: Q4 Budget Review',
        sender: 'sarah@company.com',
        content: 'Can you review this by EOD?'
      },
      {
        source: 'slack',
        title: 'mentioned you in #general',
        sender: 'John Doe',
        content: 'Hey team, quick question about the project'
      },
      {
        source: 'notification',
        title: 'Your AWS bill is ready',
        sender: 'aws-billing@amazon.com',
        content: 'Your monthly AWS bill for December is now available'
      }
    ];
    
    const simulateDistraction = () => {
      const randomDistraction = distractionTypes[Math.floor(Math.random() * distractionTypes.length)];
      const distraction = {
        ...randomDistraction,
        id: `dist_${Date.now()}`,
        timestamp: Date.now()
      };
      
      const decision = handleDistraction(distraction);
      
      if (decision.action === 'block') {
        setRecentBlocks(prev => [distraction, ...prev.slice(0, 9)]);
        setBlockAnimation(true);
        setTimeout(() => setBlockAnimation(false), 2000);
      }
    };
    
    // Simulate random distractions every 2-5 minutes during focus
    const interval = setInterval(simulateDistraction, Math.random() * 180000 + 120000);
    
    return () => clearInterval(interval);
  }, [focusSession.active, handleDistraction]);
  
  const totalBlockedToday = userMetrics.weeklyStats?.distractionsBlocked || 0;
  const queuedCount = distractionState.queuedNotifications?.length || 0;
  
  // If not in focus mode, show minimal stats
  if (!focusSession.active) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShieldIcon color="action" />
            <Box>
              <Typography variant="body2">
                Distraction Shield: Inactive
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalBlockedToday} distractions blocked today
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  // Compact mode for active session
  if (compact) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Slide direction="left" in={blockAnimation}>
          <Alert
            severity="info"
            icon={<ShieldIcon />}
            sx={{ minWidth: 200 }}
          >
            Distraction blocked!
          </Alert>
        </Slide>
        
        <Tooltip title={`${queuedCount} notifications queued`}>
          <IconButton
            onClick={() => setShowBlockedList(!showBlockedList)}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'background.paper' }
            }}
          >
            <Badge badgeContent={queuedCount} color="error">
              <ShieldIcon color="primary" />
            </Badge>
          </IconButton>
        </Tooltip>
        
        <Collapse in={showBlockedList}>
          <Card sx={{ maxWidth: 300, maxHeight: 400, overflow: 'auto' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Queued Notifications
              </Typography>
              {queuedCount === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No queued notifications
                </Typography>
              ) : (
                <List dense>
                  {distractionState.queuedNotifications.map((distraction, index) => (
                    <ListItem key={index} disablePadding>
                      <BlockedDistraction
                        distraction={distraction}
                        minimal
                        onView={() => {/* View logic */}}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Collapse>
      </Box>
    );
  }
  
  // Full dashboard view
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShieldIcon color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6">
                Distraction Shield Active
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Protecting your focus session
              </Typography>
            </Box>
          </Box>
          
          {focusSession.flowState && (
            <Chip
              icon={<FlowIcon />}
              label="Flow Protection"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
        
        {/* Protection Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {recentBlocks.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Blocked This Session
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {queuedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Queued for Later
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {totalBlockedToday}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Blocked Today
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {Math.round((totalBlockedToday * 2.5) / 60)}h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Time Saved
            </Typography>
          </Box>
        </Box>
        
        {/* Protection Level */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Protection Level: {focusPreferences.blockLevel}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={
              focusPreferences.blockLevel === 'light' ? 25 :
              focusPreferences.blockLevel === 'balanced' ? 50 :
              focusPreferences.blockLevel === 'strict' ? 75 : 100
            }
            color={
              focusPreferences.blockLevel === 'light' ? 'info' :
              focusPreferences.blockLevel === 'balanced' ? 'warning' : 'error'
            }
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        
        {/* Recent Blocks */}
        {recentBlocks.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Recently Blocked
            </Typography>
            {recentBlocks.slice(0, 3).map((distraction, index) => (
              <BlockedDistraction
                key={index}
                distraction={distraction}
                onView={() => {/* View logic */}}
                onAllow={() => {/* Allow logic */}}
              />
            ))}
            
            {recentBlocks.length > 3 && (
              <Button
                size="small"
                onClick={() => setShowBlockedList(!showBlockedList)}
              >
                View All ({recentBlocks.length})
              </Button>
            )}
          </Box>
        )}
        
        {/* Emergency Override */}
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Need to check something urgent? 
          </Typography>
          <Button
            size="small"
            color="warning"
            sx={{ mt: 1 }}
            onClick={() => {
              // Emergency override logic
              console.log('Emergency override activated');
            }}
          >
            Emergency Override (Breaks Streak)
          </Button>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default DistractionShield;