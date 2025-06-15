import React from 'react';
import { Skeleton, Box, Card, CardContent, Stack } from '@mui/material';

export const TaskSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Stack spacing={1}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="40%" height={20} />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={80} height={24} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const TaskListSkeleton = ({ count = 5 }) => (
  <Box>
    {[...Array(count)].map((_, index) => (
      <TaskSkeleton key={index} />
    ))}
  </Box>
);

export const EmailSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="20%" height={20} />
        </Box>
        <Skeleton variant="text" width="50%" height={20} />
        <Skeleton variant="text" width="100%" height={60} />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Skeleton variant="rounded" width={100} height={32} />
          <Skeleton variant="rounded" width={100} height={32} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const EmailListSkeleton = ({ count = 5 }) => (
  <Box>
    {[...Array(count)].map((_, index) => (
      <EmailSkeleton key={index} />
    ))}
  </Box>
);

export const DashboardStatsSkeleton = () => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
    {[...Array(4)].map((_, index) => (
      <Card key={index}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={32} />
        </CardContent>
      </Card>
    ))}
  </Box>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 2, mb: 2 }}>
      {[...Array(columns)].map((_, index) => (
        <Skeleton key={index} variant="text" height={24} />
      ))}
    </Box>
    {[...Array(rows)].map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 2, mb: 1 }}>
        {[...Array(columns)].map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" height={20} />
        ))}
      </Box>
    ))}
  </Box>
);

export const FormSkeleton = ({ fields = 5 }) => (
  <Stack spacing={2}>
    {[...Array(fields)].map((_, index) => (
      <Box key={index}>
        <Skeleton variant="text" width="30%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="rounded" width="100%" height={40} />
      </Box>
    ))}
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      <Skeleton variant="rounded" width={100} height={36} />
      <Skeleton variant="rounded" width={100} height={36} />
    </Box>
  </Stack>
);

export const DocumentSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Skeleton variant="rounded" width={80} height={28} />
          <Skeleton variant="rounded" width={80} height={28} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);