'use client';

import { Center, Title, Text, Button, Stack } from '@mantine/core';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Center style={{ width: '100vw', height: '100vh' }}>
      <Stack align="center" gap="sm">
        <Title order={1}>404</Title>
        <Text c="dimmed">Page not found</Text>
        <Button component={Link} href="/" variant="light" color="cyan">
          Return to Marathon Tracker
        </Button>
      </Stack>
    </Center>
  );
}
