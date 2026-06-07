'use client';

import React, { useEffect } from 'react';
import { AnnouncementContainer } from './AnnouncementBanner';
import { useAnnouncementStore, useActiveAnnouncements } from '@/store/announcement-store';

export default function AnnouncementProvider() {
  const activeAnnouncements = useActiveAnnouncements();
  const { fetchActiveAnnouncements } = useAnnouncementStore();

  useEffect(() => {
    fetchActiveAnnouncements();
  }, [fetchActiveAnnouncements]);

  return <AnnouncementContainer announcements={activeAnnouncements} />;
}
