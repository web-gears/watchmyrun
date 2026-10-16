import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import 'leaflet/dist/leaflet.css';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';
import { AppUpdateNotifier } from '@/components/Common/AppUpdateNotifier';

export const metadata: Metadata = {
  title: 'WatchMy.Run | Phone-Free Marathon Tracker & Spectator ETAs',
  description:
    'Phone-free marathon progress and live spectator meeting windows for TCS New York City, Boston, Chicago, London, Berlin, and Tokyo marathons with Apple AirTag support.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

const theme = createTheme({
  primaryColor: 'cyan',
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  components: {
    Select: {
      defaultProps: {
        comboboxProps: { zIndex: 10000, withinPortal: true },
      },
    },
    Popover: {
      defaultProps: {
        zIndex: 10000,
      },
    },
    Modal: {
      defaultProps: {
        zIndex: 10000,
      },
    },
    Drawer: {
      defaultProps: {
        zIndex: 10000,
      },
    },
    Tooltip: {
      defaultProps: {
        zIndex: 10000,
      },
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          {children}
          <AppUpdateNotifier />
        </MantineProvider>
      </body>
    </html>
  );
}
