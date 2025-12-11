'use client';

import React, { useEffect } from 'react';
import { AnnouncementContainer } from './AnnouncementBanner';
import { useAnnouncementStore, useActiveAnnouncements } from '@/store/announcement-store';

export default function AnnouncementProvider() {
  const activeAnnouncements = useActiveAnnouncements();
  const { fetchActiveAnnouncements } = useAnnouncementStore();

  useEffect(() => {
    console.log('AnnouncementProvider mounted, fetching announcements...');
    fetchActiveAnnouncements();
  }, [fetchActiveAnnouncements]);

  console.log('Active announcements in provider:', activeAnnouncements);

  return <AnnouncementContainer announcements={activeAnnouncements} />;
}
