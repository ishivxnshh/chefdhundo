'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, Eye, Calendar, Sparkles, Info, 
  AlertTriangle, CheckCircle2, XCircle, Zap, RefreshCw 
} from 'lucide-react';
import { 
  Announcement, 
  AnnouncementType, 
  AnnouncementStatus,
  announcementTypeStyles 
} from '@/types/announcement';
import { useAnnouncementStore, useAnnouncements, useAnnouncementLoading } from '@/store/announcement-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';

// Icon map for dropdown
const iconOptions = [
  { value: 'Info', label: 'Info', Icon: Info },
  { value: 'AlertTriangle', label: 'Warning', Icon: AlertTriangle },
  { value: 'Sparkles', label: 'Sparkles', Icon: Sparkles },
  { value: 'CheckCircle2', label: 'Check', Icon: CheckCircle2 },
  { value: 'XCircle', label: 'Error', Icon: XCircle },
  { value: 'Zap', label: 'Lightning', Icon: Zap },
  { value: 'RefreshCw', label: 'Refresh', Icon: RefreshCw },
];

export default function AnnouncementManagement() {
  const announcements = useAnnouncements();
  const isLoading = useAnnouncementLoading();
  const { fetchAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncementStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'info' as AnnouncementType,
    title: '',
    message: '',
    tag: '',
    icon: '',
    link_url: '',
    link_text: '',
    status: 'draft' as AnnouncementStatus,
    priority: 5,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: '',
    dismissible: true,
    themed: false,
    bg_color: '',
    text_color: '',
  });

  useEffect(() => {
    fetchAllAnnouncements();
  }, [fetchAllAnnouncements]);

  const resetForm = () => {
    setFormData({
      type: 'info',
      title: '',
      message: '',
      tag: '',
      icon: '',
      link_url: '',
      link_text: '',
      status: 'draft',
      priority: 5,
      start_date: new Date().toISOString().slice(0, 16),
      end_date: '',
      dismissible: true,
      themed: false,
      bg_color: '',
      text_color: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      type: announcement.type,
      title: announcement.title,
      message: announcement.message,
      tag: announcement.tag || '',
      icon: announcement.icon || '',
      link_url: announcement.link_url || '',
      link_text: announcement.link_text || '',
      status: announcement.status,
      priority: announcement.priority,
      start_date: announcement.start_date ? new Date(announcement.start_date).toISOString().slice(0, 16) : '',
      end_date: announcement.end_date ? new Date(announcement.end_date).toISOString().slice(0, 16) : '',
      dismissible: announcement.dismissible,
      themed: announcement.themed,
      bg_color: announcement.bg_color || '',
      text_color: announcement.text_color || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteModal(true);
  };

  const openPreviewModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowPreviewModal(true);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createAnnouncement({
        ...formData,
        end_date: formData.end_date || undefined,
        tag: formData.tag || undefined,
        icon: formData.icon || undefined,
        link_url: formData.link_url || undefined,
        link_text: formData.link_text || undefined,
        bg_color: formData.bg_color || undefined,
        text_color: formData.text_color || undefined,
      });
      toast.success('Announcement created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchAllAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAnnouncement) return;

    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateAnnouncement(selectedAnnouncement.id, {
        ...formData,
        end_date: formData.end_date || undefined,
        tag: formData.tag || undefined,
        icon: formData.icon || undefined,
        link_url: formData.link_url || undefined,
        link_text: formData.link_text || undefined,
        bg_color: formData.bg_color || undefined,
        text_color: formData.text_color || undefined,
      });
      toast.success('Announcement updated successfully');
      setShowEditModal(false);
      setSelectedAnnouncement(null);
      resetForm();
      fetchAllAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    try {
      setIsSubmitting(true);
      await deleteAnnouncement(selectedAnnouncement.id);
      toast.success('Announcement deleted successfully');
      setShowDeleteModal(false);
      setSelectedAnnouncement(null);
      fetchAllAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: AnnouncementStatus) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800',
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  const getTypeBadge = (type: AnnouncementType) => {
    const style = announcementTypeStyles[type];
    return <Badge variant={style.variant}>{type}</Badge>;
  };

  return (
    <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Announcements Management
            </CardTitle>
            <CardDescription>Create and manage site-wide announcements</CardDescription>
          </div>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            New Announcement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No announcements yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeBadge(announcement.type)}
                    {getStatusBadge(announcement.status)}
                    {announcement.tag && (
                      <Badge variant="outline">{announcement.tag}</Badge>
                    )}
                    <span className="text-sm text-gray-500">Priority: {announcement.priority}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{announcement.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{announcement.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(announcement.start_date).toLocaleDateString()}
                    </span>
                    {announcement.end_date && (
                      <span>→ {new Date(announcement.end_date).toLocaleDateString()}</span>
                    )}
                    {announcement.dismissible && <span>• Dismissible</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPreviewModal(announcement)}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(announcement)}
                    className="gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteModal(announcement)}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedAnnouncement(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditModal ? 'Edit Announcement' : 'Create New Announcement'}
            </DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update the announcement details below' : 'Fill in the details to create a new announcement'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(v) => {
                  const newType = v as AnnouncementType;
                  const style = announcementTypeStyles[newType];
                  setFormData(prev => ({ 
                    ...prev, 
                    type: newType,
                    bg_color: style.defaultBgColor || '',
                    text_color: style.defaultTextColor || '',
                    icon: style.defaultIcon
                  }));
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="promo">Promo</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="new">New Feature</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as AnnouncementStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., New Feature Launch!"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="message">Message * (supports **bold** markdown)</Label>
              <Textarea
                id="message"
                placeholder="e.g., Check out our **new dashboard** with amazing features!"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tag">Tag (optional)</Label>
                <Input
                  id="tag"
                  placeholder="e.g., NEW, BETA"
                  value={formData.tag}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(v) => setFormData(prev => ({ ...prev, icon: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(({ value, label, Icon }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="link_url">Link URL (optional)</Label>
                <Input
                  id="link_url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="link_text">Link Text</Label>
                <Input
                  id="link_text"
                  placeholder="Learn more"
                  value={formData.link_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date & Time *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date & Time (optional)</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priority (1-10, higher = more important)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dismissible"
                  checked={formData.dismissible}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dismissible: checked as boolean }))}
                />
                <Label htmlFor="dismissible" className="cursor-pointer">Dismissible</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="themed"
                  checked={formData.themed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, themed: checked as boolean }))}
                />
                <Label htmlFor="themed" className="cursor-pointer">Themed Mode</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bg_color">Background Color (Tailwind class)</Label>
                <Input
                  id="bg_color"
                  placeholder="e.g., bg-purple-50"
                  value={formData.bg_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, bg_color: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="text_color">Text Color (Tailwind class)</Label>
                <Input
                  id="text_color"
                  placeholder="e.g., text-purple-900"
                  value={formData.text_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedAnnouncement(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={showEditModal ? handleUpdate : handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : showEditModal ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteModal(false);
          setSelectedAnnouncement(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedAnnouncement?.title}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteModal(false);
              setSelectedAnnouncement(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {selectedAnnouncement && (
        <Dialog open={showPreviewModal} onOpenChange={(open) => {
          if (!open) {
            setShowPreviewModal(false);
            setSelectedAnnouncement(null);
          }
        }}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Preview</DialogTitle>
              <DialogDescription>
                How this announcement will appear to users (bottom center modal)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 min-h-[200px] flex items-center justify-center bg-gray-50">
              <AnnouncementBanner announcement={selectedAnnouncement} isPreview={true} />
            </div>
            <DialogFooter>
              <Button onClick={() => setShowPreviewModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
