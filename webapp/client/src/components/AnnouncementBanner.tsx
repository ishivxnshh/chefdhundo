'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Announcement as AnnouncementType, announcementTypeStyles } from '@/types/announcement';
import { cn } from '@/lib/utils';

interface AnnouncementBannerProps {
  announcement: AnnouncementType;
  onDismiss?: (id: string) => void;
  isPreview?: boolean;
}

export function AnnouncementBanner({ announcement, onDismiss, isPreview = false }: AnnouncementBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  // Check if dismissed in sessionStorage (per tab/session)
  useEffect(() => {
    if (announcement.dismissible && !isPreview) {
      const dismissed = sessionStorage.getItem(`announcement-dismissed-${announcement.id}`);
      if (dismissed) {
        console.log(`Announcement ${announcement.id} was previously dismissed. Clear sessionStorage to see it again.`);
        setIsVisible(false);
      } else {
        console.log(`Showing announcement: ${announcement.title} (ID: ${announcement.id})`);
      }
    }
  }, [announcement.id, announcement.dismissible, isPreview, announcement.title]);

  const handleDismiss = () => {
    if (announcement.dismissible) {
      // Use sessionStorage instead of localStorage
      // This persists only for the current browser tab/session
      // When user opens a new tab or closes and reopens browser, it shows again
      sessionStorage.setItem(`announcement-dismissed-${announcement.id}`, 'true');
      setIsVisible(false);
      if (onDismiss) {
        onDismiss(announcement.id);
      }
    }
  };

  if (!isVisible) return null;

  const typeStyle = announcementTypeStyles[announcement.type];
  
  // Get the icon component dynamically
  const IconComponent = announcement.icon 
    ? (LucideIcons[announcement.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>) 
    : (LucideIcons[typeStyle.defaultIcon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>);

  // Simple markdown-like rendering for bold and links
  const renderMessage = (text: string) => {
    // Support **bold**
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);
    
    return parts.map((part, index) => {
      // Odd indices are the content inside **
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold">{part}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // For preview mode, show inline card
  if (isPreview) {
    return (
      <div 
        className={cn(
          "rounded-2xl shadow-2xl border-2 transition-all duration-300 max-w-md w-full p-6",
          announcement.bg_color || typeStyle.defaultBgColor || 'bg-white',
          "relative overflow-hidden"
        )}
      >
        {/* Glossy texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent opacity-30 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent className={cn("w-6 h-6 shrink-0", announcement.text_color || typeStyle.defaultTextColor)} />
              )}
              {announcement.tag && (
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-full",
                  announcement.text_color || typeStyle.defaultTextColor,
                  "bg-black/10"
                )}>
                  {announcement.tag}
                </span>
              )}
            </div>
            {announcement.dismissible && (
              <button className="p-1 hover:bg-black/5 rounded-md transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <h3 className={cn(
            "text-lg font-bold mb-2",
            announcement.text_color || typeStyle.defaultTextColor
          )}>
            {announcement.title}
          </h3>
          
          <p className={cn(
            "text-sm mb-4",
            announcement.text_color || typeStyle.defaultTextColor,
            "opacity-90"
          )}>
            {renderMessage(announcement.message)}
          </p>
          
          {announcement.link_url && (
            <a 
              href={announcement.link_url}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold hover:underline",
                announcement.text_color || typeStyle.defaultTextColor
              )}
            >
              {announcement.link_text || 'Learn more'}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-[200%] opacity-0"
      )}
    >
      <div 
        className={cn(
          "rounded-2xl shadow-2xl border-2 transition-all duration-300 max-w-md w-[90vw] sm:w-[400px] p-6",
          announcement.bg_color || typeStyle.defaultBgColor || 'bg-white',
          "relative overflow-hidden hover:shadow-3xl hover:scale-105"
        )}
      >
        {/* Glossy texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent opacity-30 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent className={cn("w-6 h-6 shrink-0", announcement.text_color || typeStyle.defaultTextColor)} />
              )}
              {announcement.tag && (
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-full",
                  announcement.text_color || typeStyle.defaultTextColor,
                  "bg-black/10"
                )}>
                  {announcement.tag}
                </span>
              )}
            </div>
            {announcement.dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-black/5 rounded-md transition-colors shrink-0"
                aria-label="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <h3 className={cn(
            "text-lg font-bold mb-2",
            announcement.text_color || typeStyle.defaultTextColor
          )}>
            {announcement.title}
          </h3>
          
          <p className={cn(
            "text-sm mb-4",
            announcement.text_color || typeStyle.defaultTextColor,
            "opacity-90"
          )}>
            {renderMessage(announcement.message)}
          </p>
          
          {announcement.link_url && (
            <a 
              href={announcement.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold hover:underline",
                announcement.text_color || typeStyle.defaultTextColor
              )}
            >
              {announcement.link_text || 'Learn more'}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Multi-announcement container
interface AnnouncementContainerProps {
  announcements: AnnouncementType[];
}

export function AnnouncementContainer({ announcements }: AnnouncementContainerProps) {
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<AnnouncementType[]>([]);

  console.log('AnnouncementContainer received:', announcements);

  useEffect(() => {
    console.log('Processing announcements, count:', announcements.length);
    // Filter announcements based on date and status
    const now = new Date();
    const active = announcements.filter(ann => {
      if (ann.status !== 'active') return false;
      
      const startDate = new Date(ann.start_date);
      if (startDate > now) return false;
      
      if (ann.end_date) {
        const endDate = new Date(ann.end_date);
        if (endDate < now) return false;
      }
      
      return true;
    }).sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

    setVisibleAnnouncements(active);
  }, [announcements]);

  const handleDismiss = (id: string) => {
    setVisibleAnnouncements(prev => prev.filter(ann => ann.id !== id));
  };

  if (visibleAnnouncements.length === 0) return null;

  // Only show the highest priority announcement (first one after sorting)
  const topAnnouncement = visibleAnnouncements[0];

  return (
    <AnnouncementBanner
      announcement={topAnnouncement}
      onDismiss={handleDismiss}
    />
  );
}
