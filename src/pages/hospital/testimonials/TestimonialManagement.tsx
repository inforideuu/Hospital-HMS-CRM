import React, { useState, useEffect } from 'react';
import {
  MessageSquareHeart,
  Plus,
  Star,
  Search,
  Filter,
  Trash2,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Globe,
  ExternalLink,
  Sparkles,
  User,
  HeartPulse,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { PatientTestimonial } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Textarea } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Badge } from '../../../components/ui/Badge';

export const TestimonialManagement: React.FC = () => {
  const { currentHospital, user } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [testimonials, setTestimonials] = useState<PatientTestimonial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<PatientTestimonial | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    patientName: '',
    patientRole: 'Outpatient Care',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    headline: '',
    reviewText: '',
    verified: true,
    date: new Date().toISOString().split('T')[0],
  });

  const loadData = () => {
    const list = MockStorage.getTestimonials(hospId);
    setTestimonials(list);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pulse_storage_updated', loadData);
    return () => window.removeEventListener('pulse_storage_updated', loadData);
  }, [hospId]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTestimonial(null);
    setFormData({
      patientName: '',
      patientRole: 'Outpatient / Specialist Consultation',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      headline: '',
      reviewText: '',
      verified: true,
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (t: PatientTestimonial) => {
    setEditingTestimonial(t);
    setFormData({
      patientName: t.patientName,
      patientRole: t.patientRole || 'Patient',
      avatarUrl: t.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      rating: t.rating || 5,
      headline: t.headline || '',
      reviewText: t.reviewText || '',
      verified: t.verified ?? true,
      date: t.date || new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      showToast('Validation Error', 'Please enter the patient name.', 'error');
      return;
    }
    if (!formData.reviewText.trim()) {
      showToast('Validation Error', 'Please enter the testimonial review text.', 'error');
      return;
    }

    const newId = editingTestimonial ? editingTestimonial.id : `TEST-${Date.now()}`;
    const payload: PatientTestimonial = {
      id: newId,
      hospitalId: hospId,
      patientName: formData.patientName.trim(),
      patientRole: formData.patientRole.trim() || 'Verified Patient',
      avatarUrl: formData.avatarUrl.trim(),
      rating: Number(formData.rating) || 5,
      headline: formData.headline.trim() || 'Compassionate Care & Excellent Clinical Outcome',
      reviewText: formData.reviewText.trim(),
      verified: formData.verified,
      date: formData.date,
    };

    MockStorage.saveTestimonial(payload);
    showToast(
      editingTestimonial ? 'Testimonial Updated' : 'Testimonial Created',
      `Review from ${payload.patientName} has been saved and synced to the public 3D carousel.`
    );
    setIsModalOpen(false);
  };

  // Handle Delete
  const handleDelete = () => {
    if (!confirmDeleteId) return;
    MockStorage.deleteTestimonial(confirmDeleteId);
    showToast('Testimonial Deleted', 'Review removed from hospital public website.');
    setConfirmDeleteId(null);
  };

  // Filters
  const filteredTestimonials = testimonials.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.patientName.toLowerCase().includes(q) ||
      (t.patientRole && t.patientRole.toLowerCase().includes(q)) ||
      t.headline.toLowerCase().includes(q) ||
      t.reviewText.toLowerCase().includes(q);

    const matchesRating =
      ratingFilter === 'all' || String(t.rating) === ratingFilter;

    return matchesSearch && matchesRating;
  });

  // Analytics Metrics
  const totalCount = testimonials.length;
  const avgRating =
    totalCount > 0
      ? (testimonials.reduce((acc, t) => acc + (t.rating || 5), 0) / totalCount).toFixed(1)
      : '5.0';
  const fiveStarCount = testimonials.filter((t) => t.rating === 5).length;
  const fiveStarPct = totalCount > 0 ? Math.round((fiveStarCount / totalCount) * 100) : 100;

  // Preset Avatar Photos
  const presetAvatars = [
    { label: 'Patient Female 1', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
    { label: 'Patient Male 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { label: 'Patient Female 2', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { label: 'Patient Male 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { label: 'Patient Senior', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Patient Testimonials & 3D Carousel Reviews"
        subtitle="Create, edit, and curate verified patient feedback showcased on your hospital's public landing page in interactive 3D."
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Patient Testimonials' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`/hospital/${hospId}#testimonials`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Globe className="w-4 h-4 text-teal-600" />
              <span>Preview 3D Carousel</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
            >
              Add New Testimonial
            </Button>
          </div>
        }
      />

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reviews</span>
            <MessageSquareHeart className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalCount} Stories</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Live in Website 3D Carousel</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Rating</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{avgRating} / 5.0</p>
          <p className="text-xs text-slate-500 font-medium mt-1">From verified discharged patients</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">5-Star Satisfaction</span>
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{fiveStarPct}%</p>
          <p className="text-xs text-indigo-600 font-medium mt-1">{fiveStarCount} perfect score reviews</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">3D Carousel Status</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-emerald-700 mt-2">Active & Auto-Rotating</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Rotates every 5s with 3D perspective</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, headline, role..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Ratings (1 - 5 Stars)</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTestimonials.map((t) => (
          <Card
            key={t.id}
            className="p-6 rounded-2xl border border-slate-200/80 hover:shadow-lg transition-all flex flex-col justify-between bg-white group"
          >
            <div className="space-y-4">
              {/* Header: Stars & Verified Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {[...Array(t.rating || 5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                {t.verified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Unverified</span>
                )}
              </div>

              {/* Headline */}
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                {t.headline}
              </h3>

              {/* Review Text Quote */}
              <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-4">
                "{t.reviewText}"
              </p>
            </div>

            {/* Footer Profile & Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={t.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
                  alt={t.patientName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">{t.patientName}</p>
                  <p className="text-[10px] text-teal-600 font-medium">{t.patientRole || 'Patient'}</p>
                  <p className="text-[9px] text-slate-400 font-mono">{t.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(t)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit Testimonial"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(t.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Testimonial"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}

        {filteredTestimonials.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <MessageSquareHeart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Testimonials Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your first patient review or adjust your search filter to curate feedback for your public portal.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
              className="mt-4"
            >
              Add First Testimonial
            </Button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTestimonial ? 'Edit Patient Testimonial' : 'Add New Patient Testimonial'}
        subtitle="This review will automatically display in the 3D rotating carousel on your hospital landing page."
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Patient Full Name *
              </label>
              <Input
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Patient Role / Procedure Treated
              </label>
              <Input
                value={formData.patientRole}
                onChange={(e) => setFormData({ ...formData, patientRole: e.target.value })}
                placeholder="e.g. Cardiac Angioplasty Patient"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Star Rating
              </label>
              <div className="flex items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: starVal })}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        starVal <= formData.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {formData.rating} of 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Review Date
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Review Headline *
            </label>
            <Input
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder="e.g. Exceptional Cardiac Care and Fast Recovery"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Patient Story / Review Text *
            </label>
            <Textarea
              rows={4}
              value={formData.reviewText}
              onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
              placeholder="Describe the medical treatment, doctors, staff support, and hospital stay experience..."
              required
            />
          </div>

          {/* Avatar URL & Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Patient Photo URL
            </label>
            <Input
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              placeholder="https://..."
            />
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Quick Presets:</span>
              {presetAvatars.map((av, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatarUrl: av.url })}
                  className={`p-1 rounded-full border-2 transition-all shrink-0 ${
                    formData.avatarUrl === av.url ? 'border-teal-500 scale-110' : 'border-transparent hover:border-slate-300'
                  }`}
                  title={av.label}
                >
                  <img src={av.url} alt={av.label} className="w-7 h-7 rounded-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Verified Toggle */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="verified-checkbox"
              checked={formData.verified}
              onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="verified-checkbox" className="text-xs font-medium text-slate-700 cursor-pointer">
              Mark as <strong>Verified Patient Review</strong> (displays green verification badge in 3D carousel)
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingTestimonial ? 'Update Testimonial' : 'Publish Testimonial'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Patient Testimonial"
        message="Are you sure you want to delete this patient review? It will be removed from your hospital's public 3D carousel immediately."
        confirmText="Delete Review"
        variant="danger"
      />
    </div>
  );
};
