'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Stack,
  Group,
  Text,
  Button,
  TextInput,
  Box,
  Card,
  Badge,
  Alert,
  SimpleGrid,
  Divider,
  ScrollArea,
} from '@mantine/core';
import {
  IconRoute,
  IconUpload,
  IconLink,
  IconSearch,
  IconCheck,
  IconAlertCircle,
  IconFileCode,
  IconTrash,
  IconFileCheck,
  IconWorldSearch,
} from '@tabler/icons-react';
import { CourseData } from '@/lib/forecasting/types';
import type { RaceSearchResult } from '@/lib/data/raceAggregatorSearch';

interface CustomRouteModalProps {
  opened: boolean;
  onClose: () => void;
  activeCustomCourse: CourseData | null;
  onSelectCustomCourse: (course: CourseData, sourceUrl?: string) => void;
  onClearCustomCourse?: () => void;
}

export function CustomRouteModal({
  opened,
  onClose,
  activeCustomCourse,
  onSelectCustomCourse,
  onClearCustomCourse,
}: CustomRouteModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>('search');

  // Search Aggregator State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<RaceSearchResult[]>([]);
  const [loadingResultId, setLoadingResultId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // File Upload State
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // URL State
  const [routeUrl, setRouteUrl] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);

  // Parsed Preview State
  const [parsedCourse, setParsedCourse] = useState<CourseData | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load curated popular races and pre-warm parser chunk on modal open
  useEffect(() => {
    if (opened) {
      import('@/lib/data/customTrackParser').catch(() => {});
      if (searchResults.length === 0 && !hasSearched) {
        import('@/lib/data/raceAggregatorSearch').then(({ CURATED_POPULAR_RACES }) => {
          setSearchResults(CURATED_POPULAR_RACES);
        });
      }
    }
  }, [opened, searchResults.length, hasSearched]);

  // Search public race catalogs with progressive streaming
  const handleSearchCourses = async () => {
    setErrorMsg(null);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const { searchPublicRaceCourses, CURATED_POPULAR_RACES } = await import(
        '@/lib/data/raceAggregatorSearch'
      );
      if (!searchQuery.trim()) {
        setSearchResults(CURATED_POPULAR_RACES);
        setHasSearched(false);
      } else {
        const results = await searchPublicRaceCourses(
          searchQuery.trim(),
          undefined,
          (partialResults) => {
            setSearchResults(partialResults);
          }
        );
        setSearchResults(results);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to search race courses.';
      setErrorMsg(message);
    } finally {
      setIsSearching(false);
    }
  };

  // Load a specific search result into the preview card
  const handleLoadSearchResult = async (item: RaceSearchResult) => {
    setErrorMsg(null);
    setLoadingResultId(item.id);

    try {
      const { fetchAndParseRoute } = await import('@/lib/data/customTrackParser');
      const course = await fetchAndParseRoute(item.routeUrl, item.title);
      setParsedCourse(course);
      setCourseTitle(item.title || course.title);
      setSourceUrl(item.routeUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Failed to load course "${item.title}".`;
      setErrorMsg(message);
      setParsedCourse(null);
    } finally {
      setLoadingResultId(null);
    }
  };

  // File processing (.gpx, .fit, .tcx, .geojson)
  const handleFileProcess = (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);

    const lowerName = file.name.toLowerCase();
    const fallbackName = file.name.replace(/\.[^/.]+$/, '');
    const reader = new FileReader();

    if (lowerName.endsWith('.fit')) {
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer || buffer.byteLength === 0) {
            throw new Error('The selected FIT file is empty.');
          }

          const { parseFitToCourseData } = await import('@/lib/data/customTrackParser');
          const course = parseFitToCourseData(buffer, fallbackName);

          setParsedCourse(course);
          setCourseTitle(course.title);
          setSourceUrl(undefined);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to parse FIT file.';
          setErrorMsg(message);
          setParsedCourse(null);
        }
      };

      reader.onerror = () => {
        setErrorMsg('Could not read the selected file.');
        setParsedCourse(null);
      };

      reader.readAsArrayBuffer(file);
      return;
    }

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          throw new Error('The selected file is empty.');
        }

        const { parseGpxToCourseData, parseGeoJsonToCourseData } = await import(
          '@/lib/data/customTrackParser'
        );

        let course: CourseData;

        if (
          lowerName.endsWith('.geojson') ||
          lowerName.endsWith('.json') ||
          text.trim().startsWith('{')
        ) {
          course = parseGeoJsonToCourseData(text, fallbackName);
        } else if (
          lowerName.endsWith('.gpx') ||
          lowerName.endsWith('.tcx') ||
          text.includes('<gpx') ||
          text.includes('<trk') ||
          text.includes('<TrainingCenterDatabase')
        ) {
          course = parseGpxToCourseData(text, fallbackName);
        } else {
          try {
            course = parseGpxToCourseData(text, file.name);
          } catch {
            course = parseGeoJsonToCourseData(text, file.name);
          }
        }

        setParsedCourse(course);
        setCourseTitle(course.title);
        setSourceUrl(undefined);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to parse track file.';
        setErrorMsg(message);
        setParsedCourse(null);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Could not read the selected file.');
      setParsedCourse(null);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // URL route fetching (dynamic on-demand module loading)
  const handleFetchUrl = async () => {
    if (!routeUrl || routeUrl.trim().length === 0) {
      setErrorMsg('Please enter a valid route URL.');
      return;
    }

    setErrorMsg(null);
    setIsLoadingUrl(true);

    try {
      const { fetchAndParseRoute } = await import('@/lib/data/customTrackParser');
      const course = await fetchAndParseRoute(routeUrl.trim());
      setParsedCourse(course);
      setCourseTitle(course.title);
      setSourceUrl(routeUrl.trim());
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch and parse route from link.';
      setErrorMsg(message);
      setParsedCourse(null);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Apply course
  const handleApplyCourse = () => {
    if (!parsedCourse) return;

    const finalCourse: CourseData = {
      ...parsedCourse,
      title: courseTitle.trim() || parsedCourse.title,
    };

    onSelectCustomCourse(finalCourse, sourceUrl);
    onClose();
  };

  const handleSelectActive = () => {
    if (activeCustomCourse) {
      onSelectCustomCourse(activeCustomCourse);
      onClose();
    }
  };

  const getSourceBadgeColor = (source: RaceSearchResult['source']) => {
    switch (source) {
      case 'curated':
        return 'cyan';
      case 'ridewithgps':
        return 'blue';
      case 'osm':
        return 'teal';
      case 'waymarked':
        return 'grape';
      default:
        return 'gray';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <IconRoute size={20} stroke={2.2} />
          </Box>
          <div>
            <Text fw={700} size="md" style={{ lineHeight: 1.1 }}>
              Search or Import Race Course
            </Text>
            <Text size="xs" c="dimmed">
              Find race courses worldwide, upload a GPX/FIT/TCX/GeoJSON file, or paste a route link
            </Text>
          </div>
        </Group>
      }
      size="lg"
      radius="lg"
      padding="lg"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 4,
      }}
    >
      <Stack gap="md">
        {/* Existing Active Custom Course Card */}
        {activeCustomCourse && (
          <Card
            withBorder
            padding="xs"
            radius="md"
            style={{ background: 'var(--mantine-color-default-hover)' }}
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <IconFileCheck size={20} color="var(--mantine-color-cyan-6)" />
                <div>
                  <Group gap={6} align="center">
                    <Text size="xs" fw={700}>
                      Saved Custom Route: {activeCustomCourse.title}
                    </Text>
                    <Badge size="xs" variant="light" color="cyan">
                      {(activeCustomCourse.distanceM / 1000).toFixed(1)} km
                    </Badge>
                  </Group>
                  <Text size="11px" c="dimmed">
                    {(activeCustomCourse.distanceM / 1609.344).toFixed(1)} mi •{' '}
                    {activeCustomCourse.points.length} points
                  </Text>
                </div>
              </Group>

              <Group gap={4} wrap="nowrap">
                <Button size="xs" variant="light" color="cyan" onClick={handleSelectActive}>
                  Use This Course
                </Button>
                {onClearCustomCourse && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    leftSection={<IconTrash size={12} />}
                    onClick={onClearCustomCourse}
                  >
                    Clear
                  </Button>
                )}
              </Group>
            </Group>
          </Card>
        )}

        <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md">
          <Tabs.List grow mb="sm">
            <Tabs.Tab value="search" leftSection={<IconSearch size={15} />}>
              Search Courses
            </Tabs.Tab>
            <Tabs.Tab value="file" leftSection={<IconUpload size={15} />}>
              Upload File
            </Tabs.Tab>
            <Tabs.Tab value="link" leftSection={<IconLink size={15} />}>
              Paste Link
            </Tabs.Tab>
          </Tabs.List>

          {/* TAB 1: PUBLIC RACE COURSE AGGREGATOR SEARCH */}
          <Tabs.Panel value="search">
            <Stack gap="xs">
              <Group gap="xs" align="flex-end">
                <TextInput
                  placeholder="Search marathon, half, 10K, or city (e.g. Valencia, Paris, Marine Corps)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  leftSection={<IconWorldSearch size={16} />}
                  style={{ flex: 1 }}
                  size="sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchCourses();
                    }
                  }}
                />
                <Button
                  size="sm"
                  color="cyan"
                  onClick={handleSearchCourses}
                  loading={isSearching}
                >
                  Search
                </Button>
              </Group>

              <Group justify="space-between" align="center">
                <Text size="11px" fw={600} c="dimmed">
                  {hasSearched && searchQuery.trim()
                    ? `Search Results (${searchResults.length})`
                    : 'Popular Marathons & Road Races'}
                </Text>
                <Group gap={4}>
                  <Badge size="xs" variant="dot" color="blue">
                    RideWithGPS
                  </Badge>
                  <Badge size="xs" variant="dot" color="teal">
                    OpenStreetMap
                  </Badge>
                  <Badge size="xs" variant="dot" color="grape">
                    Waymarked
                  </Badge>
                </Group>
              </Group>

              <ScrollArea.Autosize mah={220} type="auto" offsetScrollbars>
                <Stack gap={6}>
                  {searchResults.length === 0 && !isSearching ? (
                    <Text size="xs" c="dimmed" ta="center" py="md">
                      No matching courses found. Try another race name, city, or paste a direct route link.
                    </Text>
                  ) : (
                    searchResults.map((item) => {
                      const isLoaded = sourceUrl === item.routeUrl && Boolean(parsedCourse);
                      return (
                        <Card
                          key={item.id}
                          withBorder
                          padding="xs"
                          radius="md"
                          style={{
                            borderColor: isLoaded
                              ? 'var(--mantine-color-cyan-6)'
                              : undefined,
                            backgroundColor: isLoaded
                              ? 'var(--mantine-color-cyan-light)'
                              : undefined,
                          }}
                        >
                          <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <Group gap={6} align="center" wrap="nowrap">
                                <Text size="xs" fw={700} truncate>
                                  {item.title}
                                </Text>
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={getSourceBadgeColor(item.source)}
                                  style={{ flexShrink: 0 }}
                                >
                                  {item.sourceLabel}
                                </Badge>
                              </Group>
                              <Text size="11px" c="dimmed" truncate>
                                {item.subtitle}
                              </Text>
                            </div>

                            <Button
                              size="xs"
                              variant={isLoaded ? 'filled' : 'light'}
                              color="cyan"
                              loading={loadingResultId === item.id}
                              onClick={() => handleLoadSearchResult(item)}
                              style={{ flexShrink: 0 }}
                            >
                              {isLoaded ? 'Loaded' : 'Load'}
                            </Button>
                          </Group>
                        </Card>
                      );
                    })
                  )}
                </Stack>
              </ScrollArea.Autosize>
            </Stack>
          </Tabs.Panel>

          {/* TAB 2: FILE DROP / BROWSE */}
          <Tabs.Panel value="file">
            <input
              type="file"
              ref={fileInputRef}
              accept=".gpx,.fit,.tcx,.geojson,.json"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />

            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${
                  isDragging ? 'var(--mantine-color-cyan-6)' : 'var(--mantine-color-default-border)'
                }`,
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging
                  ? 'var(--mantine-color-cyan-light)'
                  : 'var(--mantine-color-default-hover)',
                transition: 'all 0.15s ease',
              }}
            >
              <Stack align="center" gap="xs">
                <Box
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--mantine-color-cyan-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--mantine-color-cyan-6)',
                  }}
                >
                  <IconFileCode size={24} />
                </Box>
                <div>
                  <Text size="sm" fw={600}>
                    {fileName
                      ? `Selected: ${fileName}`
                      : 'Drop your track file here, or click to browse'}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    Supports GPX (.gpx), Garmin FIT (.fit), TCX (.tcx), and GeoJSON (.geojson, .json) exports from Garmin, Strava, Coros, etc.
                  </Text>
                </div>
              </Stack>
            </Box>
          </Tabs.Panel>

          {/* TAB 3: ROUTE LINK / URL */}
          <Tabs.Panel value="link">
            <Stack gap="xs">
              <Group gap="xs" align="flex-end">
                <TextInput
                  placeholder="https://ridewithgps.com/routes/48882098 or direct .gpx URL"
                  label="Course Web Link"
                  description="RideWithGPS, RunGo, OpenStreetMap Relation, GitHub raw GPX, or any public track URL"
                  value={routeUrl}
                  onChange={(e) => setRouteUrl(e.currentTarget.value)}
                  style={{ flex: 1 }}
                  size="sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFetchUrl();
                    }
                  }}
                />
                <Button
                  size="sm"
                  color="cyan"
                  onClick={handleFetchUrl}
                  loading={isLoadingUrl}
                  disabled={!routeUrl.trim()}
                >
                  Fetch
                </Button>
              </Group>

              <Group gap={6} wrap="wrap">
                <Text size="11px" c="dimmed">
                  Supported platforms:
                </Text>
                <Badge size="xs" variant="dot" color="blue">
                  RideWithGPS
                </Badge>
                <Badge size="xs" variant="dot" color="teal">
                  OpenStreetMap
                </Badge>
                <Badge size="xs" variant="dot" color="grape">
                  Waymarked Trails
                </Badge>
                <Badge size="xs" variant="dot" color="cyan">
                  RunGo
                </Badge>
                <Badge size="xs" variant="dot" color="gray">
                  Direct .gpx / .geojson
                </Badge>
              </Group>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Error Alert */}
        {errorMsg && (
          <Alert icon={<IconAlertCircle size={16} />} title="Import Error" color="red" radius="md">
            {errorMsg}
          </Alert>
        )}

        {/* Parsed Course Preview */}
        {parsedCourse && (
          <Card
            withBorder
            padding="md"
            radius="md"
            style={{ background: 'var(--mantine-color-default-hover)' }}
          >
            <Stack gap="xs">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <TextInput
                    label="Course Name"
                    size="xs"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.currentTarget.value)}
                    placeholder="Enter custom race name"
                    fw={700}
                  />
                </div>
                <Badge
                  color="green"
                  variant="light"
                  size="sm"
                  leftSection={<IconCheck size={12} />}
                  mt={18}
                >
                  Valid Track
                </Badge>
              </Group>

              <Divider my={4} />

              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                <Box>
                  <Text size="11px" c="dimmed">
                    Distance
                  </Text>
                  <Text size="sm" fw={700}>
                    {(parsedCourse.distanceM / 1000).toFixed(1)} km
                  </Text>
                  <Text size="10px" c="dimmed">
                    {(parsedCourse.distanceM / 1609.344).toFixed(1)} mi
                  </Text>
                </Box>

                <Box>
                  <Text size="11px" c="dimmed">
                    Elevation Gain
                  </Text>
                  <Text size="sm" fw={700} c="teal">
                    +{Math.round(parsedCourse.elevationSummary.gainM)} m
                  </Text>
                  <Text size="10px" c="dimmed">
                    +{Math.round(parsedCourse.elevationSummary.gainM * 3.28084)} ft
                  </Text>
                </Box>

                <Box>
                  <Text size="11px" c="dimmed">
                    Elevation Loss
                  </Text>
                  <Text size="sm" fw={700} c="orange">
                    -{Math.round(parsedCourse.elevationSummary.lossM)} m
                  </Text>
                  <Text size="10px" c="dimmed">
                    -{Math.round(parsedCourse.elevationSummary.lossM * 3.28084)} ft
                  </Text>
                </Box>

                <Box>
                  <Text size="11px" c="dimmed">
                    Checkpoints
                  </Text>
                  <Text size="sm" fw={700}>
                    {parsedCourse.timingMats.length} mats
                  </Text>
                  <Text size="10px" c="dimmed">
                    {parsedCourse.points.length} GPS pts
                  </Text>
                </Box>
              </SimpleGrid>

              <Group gap={4} wrap="wrap" mt={4}>
                <Text size="11px" c="dimmed" mr={4}>
                  Auto-generated split checkpoints:
                </Text>
                {parsedCourse.timingMats.map((mat, i) => (
                  <Badge key={i} size="xs" variant="outline" color="cyan">
                    {mat.name}
                  </Badge>
                ))}
              </Group>
            </Stack>
          </Card>
        )}

        <Group justify="flex-end" gap="xs" mt="xs">
          <Button variant="default" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            color="cyan"
            size="sm"
            onClick={handleApplyCourse}
            disabled={!parsedCourse}
            leftSection={<IconCheck size={16} />}
          >
            Apply Course to Map
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
