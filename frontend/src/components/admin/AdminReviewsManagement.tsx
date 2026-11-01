/* @module: AdminReviewsManagement — Platform clinical & user reviews oversight, category analytics & official resolution console */
import React, { useState, useMemo } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import {
  Star,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Users,
  Building2,
  Warehouse,
  Reply,
  Sparkles,
  BarChart3,
  AlertCircle,
  TrendingUp,
  X,
  Send,
  Check,
} from 'lucide-react';
import { FeedbackSubmission, UserRole } from '../../types';

interface AdminReviewsManagementProps {
  onNavigateTab?: (tabId: string) => void;
}

type CategoryTab = 'ALL' | 'USER' | 'HOSPITAL' | 'BLOOD_BANK';

export const AdminReviewsManagement: React.FC<AdminReviewsManagementProps> = () => {
  const { feedbacks, adminReplyToFeedback } = useLifeDrop();

  // Active Category & Filter States
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RESOLVED' | 'PENDING'>('ALL');

  // Reply Modal / Drawer State
  const [activeReplyFeedback, setActiveReplyFeedback] = useState<FeedbackSubmission | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState<'RESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED'>('RESOLVED');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Quick preset messages
  const quickPresets = [
    'We have solved the issue: Priority triage verification has been updated and enforced at this facility.',
    'We have solved the issue: Cold-chain telemetry monitoring and alert thresholds have been re-calibrated.',
    'We have solved the issue: Regional blood emergency dispatch algorithm updated to optimize response time.',
    'Thank you for your valuable feedback! This feature enhancement has been deployed in the latest platform release.',
    'Our clinical supervisor has reviewed this incident and conducted an on-site audit with the facility director.',
  ];

  // --- Analytics Calculations ---
  const totalReviews = feedbacks.length;
  const avgOverallRating =
    totalReviews > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews).toFixed(1)
      : '5.0';

  const resolvedCount = feedbacks.filter((f) => f.adminReply || f.status === 'RESOLVED').length;
  const pendingCount = totalReviews - resolvedCount;
  const resolutionRate = totalReviews > 0 ? Math.round((resolvedCount / totalReviews) * 100) : 100;

  // Breakdown by 3 categories
  const donorFeedbacks = useMemo(() => feedbacks.filter((f) => f.userRole === 'USER'), [feedbacks]);
  const hospitalFeedbacks = useMemo(() => feedbacks.filter((f) => f.userRole === 'HOSPITAL'), [feedbacks]);
  const bloodBankFeedbacks = useMemo(() => feedbacks.filter((f) => f.userRole === 'BLOOD_BANK'), [feedbacks]);

  const donorAvg =
    donorFeedbacks.length > 0
      ? (donorFeedbacks.reduce((sum, f) => sum + f.rating, 0) / donorFeedbacks.length).toFixed(1)
      : '5.0';
  const hospitalAvg =
    hospitalFeedbacks.length > 0
      ? (hospitalFeedbacks.reduce((sum, f) => sum + f.rating, 0) / hospitalFeedbacks.length).toFixed(1)
      : '5.0';
  const bloodBankAvg =
    bloodBankFeedbacks.length > 0
      ? (bloodBankFeedbacks.reduce((sum, f) => sum + f.rating, 0) / bloodBankFeedbacks.length).toFixed(1)
      : '5.0';

  // Star Distribution Data
  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((f) => {
      const r = Math.round(f.rating) as 1 | 2 | 3 | 4 | 5;
      if (counts[r] !== undefined) counts[r]++;
    });
    return counts;
  }, [feedbacks]);

  // Filtered List
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL' && f.userRole !== selectedCategory) {
        return false;
      }

      // 2. Star Rating Filter
      if (ratingFilter !== 'ALL' && Math.round(f.rating) !== parseInt(ratingFilter, 10)) {
        return false;
      }

      // 3. Status Filter
      const isResolved = !!f.adminReply || f.status === 'RESOLVED';
      if (statusFilter === 'RESOLVED' && !isResolved) return false;
      if (statusFilter === 'PENDING' && isResolved) return false;

      // 4. Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = f.userName.toLowerCase().includes(query);
        const matchesComments = f.comments.toLowerCase().includes(query);
        const matchesReply = f.adminReply?.message.toLowerCase().includes(query);
        const matchesBloodGroup = f.userBloodGroup?.toLowerCase().includes(query);
        const matchesEmail = f.userEmail?.toLowerCase().includes(query);
        return matchesName || matchesComments || !!matchesReply || !!matchesBloodGroup || !!matchesEmail;
      }

      return true;
    });
  }, [feedbacks, selectedCategory, ratingFilter, statusFilter, searchQuery]);

  // Open Reply Modal
  const handleOpenReplyModal = (feedback: FeedbackSubmission) => {
    setActiveReplyFeedback(feedback);
    setReplyMessage(feedback.adminReply ? feedback.adminReply.message : '');
    setReplyStatus(feedback.adminReply ? feedback.adminReply.status : 'RESOLVED');
  };

  // Submit Official Reply
  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyFeedback || !replyMessage.trim()) return;

    setIsSubmittingReply(true);

    setTimeout(() => {
      const res = adminReplyToFeedback(activeReplyFeedback.id, replyMessage.trim(), replyStatus);
      setIsSubmittingReply(false);

      if (res.success) {
        setActionSuccessMessage(`Official reply posted! The response will appear on ${activeReplyFeedback.userName}'s profile.`);
        setActiveReplyFeedback(null);
        setReplyMessage('');

        setTimeout(() => {
          setActionSuccessMessage(null);
        }, 5000);
      }
    }, 300);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-slideDown">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{actionSuccessMessage}</span>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="ml-auto text-emerald-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-lifedrop-navy via-slate-900 to-purple-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Reviews &amp; Clinical Quality Control</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Reviews &amp; Feedback Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Supervise ratings, inspect donor and clinical facility experiences across all 3 key categories, and publish signed administrator resolutions directly to user profiles.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-2xl border border-white/15 backdrop-blur-xs self-stretch sm:self-auto justify-between sm:justify-start">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-300">Overall Rating</div>
              <div className="text-2xl font-black text-amber-400 flex items-center gap-1.5 mt-0.5">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>{avgOverallRating}</span>
                <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </div>
            </div>
            <div className="h-8 w-px bg-white/20 mx-2" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-300">Resolution Rate</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {resolutionRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Visual Analytics & Distribution Graphs                       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Rating Breakdown Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-extrabold text-lifedrop-navy">Rating Distribution</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">{totalReviews} Reviews</span>
          </div>

          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = starCounts[stars as keyof typeof starCounts] || 0;
              const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

              return (
                <div key={stars} className="flex items-center gap-2.5 text-xs">
                  <div className="flex items-center gap-1 w-12 shrink-0 font-bold text-slate-700">
                    <span>{stars}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars >= 4
                          ? 'bg-amber-400'
                          : stars === 3
                          ? 'bg-amber-500'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="w-14 text-right text-[11px] font-bold text-slate-500 shrink-0">
                    <span>{count}</span>
                    <span className="text-slate-400 font-normal ml-1">({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 Categories Overview Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Category 1: Donors */}
          <div
            onClick={() => setSelectedCategory('USER')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
              selectedCategory === 'USER'
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20 shadow-md'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-lifedrop-primary flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Category 1
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mt-3">Donors &amp; Users</h4>
              <p className="text-xs text-slate-500 mt-1">
                Phlebotomy comfort, emergency alerts, donor reception
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-rose-700">{donorAvg} ★</div>
                <div className="text-[10px] font-medium text-slate-400">{donorFeedbacks.length} Submissions</div>
              </div>
              <span className="text-xs font-bold text-rose-600">View Category →</span>
            </div>
          </div>

          {/* Category 2: Hospitals */}
          <div
            onClick={() => setSelectedCategory('HOSPITAL')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
              selectedCategory === 'HOSPITAL'
                ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20 shadow-md'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Category 2
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mt-3">Hospitals &amp; Clinics</h4>
              <p className="text-xs text-slate-500 mt-1">
                Donor turnaround time, trauma dispatch, emergency matching
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-blue-700">{hospitalAvg} ★</div>
                <div className="text-[10px] font-medium text-slate-400">{hospitalFeedbacks.length} Submissions</div>
              </div>
              <span className="text-xs font-bold text-blue-600">View Category →</span>
            </div>
          </div>

          {/* Category 3: Blood Banks */}
          <div
            onClick={() => setSelectedCategory('BLOOD_BANK')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
              selectedCategory === 'BLOOD_BANK'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-md'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Warehouse className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Category 3
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mt-3">Blood Banks</h4>
              <p className="text-xs text-slate-500 mt-1">
                Walk-in intake, cold-chain compliance, inventory updates
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-amber-700">{bloodBankAvg} ★</div>
                <div className="text-[10px] font-medium text-slate-400">{bloodBankFeedbacks.length} Submissions</div>
              </div>
              <span className="text-xs font-bold text-amber-600">View Category →</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3 Categories Selector Tabs & Filter Controls                 */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {/* Navigation Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'ALL'
                  ? 'bg-lifedrop-navy text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>All Categories</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {feedbacks.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('USER')}
              className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'USER'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>1. Donors &amp; Users</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'USER' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {donorFeedbacks.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('HOSPITAL')}
              className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'HOSPITAL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>2. Hospitals</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'HOSPITAL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {hospitalFeedbacks.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('BLOOD_BANK')}
              className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'BLOOD_BANK'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>3. Blood Banks</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'BLOOD_BANK' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {bloodBankFeedbacks.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Showing {filteredFeedbacks.length} of {feedbacks.length} reviews</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          {/* Keyword Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by user name, comments, or official reply..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs bg-slate-50 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Ratings (★)</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars only</option>
              <option value="3">3 Stars only</option>
              <option value="2">2 Stars only</option>
              <option value="1">1 Star only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs bg-slate-50 focus:bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Resolution Statuses</option>
              <option value="RESOLVED">Resolved (Admin Replied)</option>
              <option value="PENDING">Pending Reply</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Reviews List & Reply Actions                                */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">No Reviews Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No review matches the current category or filter combination. Reset your search or change the active filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
                setRatingFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredFeedbacks.map((fb) => {
            const hasReply = !!fb.adminReply;

            return (
              <div
                key={fb.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Author Info & Rating Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                        fb.userRole === 'USER'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : fb.userRole === 'HOSPITAL'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {fb.userRole === 'USER' && <Users className="w-4 h-4" />}
                      {fb.userRole === 'HOSPITAL' && <Building2 className="w-4 h-4" />}
                      {fb.userRole === 'BLOOD_BANK' && <Warehouse className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{fb.userName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            fb.userRole === 'USER'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : fb.userRole === 'HOSPITAL'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {fb.userRole === 'USER'
                            ? 'Donor / User'
                            : fb.userRole === 'HOSPITAL'
                            ? 'Hospital'
                            : 'Blood Bank'}
                        </span>
                        {fb.userBloodGroup && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-500 text-white">
                            {fb.userBloodGroup}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>ID: {fb.userId}</span>
                        {fb.userEmail && <span>• {fb.userEmail}</span>}
                        {fb.userPhone && <span>• {fb.userPhone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Stars */}
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-amber-700 font-extrabold text-xs">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span>{fb.rating}.0</span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {fb.createdAt}
                    </div>
                  </div>
                </div>

                {/* Feedback Body */}
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    "{fb.comments}"
                  </p>
                </div>

                {/* Admin Reply Callout (If exists) */}
                {hasReply && fb.adminReply && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-50/40 border border-purple-200 shadow-2xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold text-xs text-purple-950">
                          Official Administrator Resolution (Live in User Profile)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {fb.adminReply.status === 'RESOLVED' ? 'Issue Solved' : 'Under Investigation'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-purple-600 font-mono">
                          {fb.adminReply.repliedAt}
                        </span>
                        <button
                          onClick={() => handleOpenReplyModal(fb)}
                          className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline ml-1 cursor-pointer"
                        >
                          Edit Reply
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-purple-950 font-medium leading-relaxed pl-8">
                      "{fb.adminReply.message}"
                    </p>

                    <div className="text-[11px] text-purple-700 font-semibold pl-8 flex items-center gap-1 pt-1 border-t border-purple-200/50">
                      <span>Signed by:</span>
                      <strong className="text-purple-900">{fb.adminReply.adminName}</strong>
                      {fb.adminReply.adminEmail && (
                        <span className="text-purple-400 font-normal">({fb.adminReply.adminEmail})</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                        hasReply
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {hasReply ? 'Issue Resolved' : 'Awaiting Reply'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReplyModal(fb)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>{hasReply ? 'Update Resolution Reply' : 'Reply & Resolve Issue'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* Official Admin Reply Modal                                   */}
      {/* ============================================================ */}
      {activeReplyFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveReplyFeedback(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-100 relative text-slate-800 space-y-5 animate-scaleUp">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Official Resolution Dispatch</span>
                </div>
                <h3 className="text-lg font-black text-lifedrop-navy">
                  Reply to {activeReplyFeedback.userName}
                </h3>
                <p className="text-xs text-slate-500">
                  Your reply will be published directly to this user's profile under their verified review card.
                </p>
              </div>

              <button
                onClick={() => setActiveReplyFeedback(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Original Feedback Excerpt */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-500 font-bold">
                <span>Original Review ({activeReplyFeedback.rating}.0 ★)</span>
                <span className="font-mono text-[10px]">{activeReplyFeedback.createdAt}</span>
              </div>
              <p className="text-slate-700 italic">
                "{activeReplyFeedback.comments}"
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Quick Resolution Templates:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyMessage(preset)}
                    className="text-[11px] text-left px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition-colors cursor-pointer"
                  >
                    + {preset.slice(0, 45)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Resolution Message to User:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. We have solved the issue: Priority triage and donor verification have been re-calibrated at this facility..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all text-slate-900"
                />
              </div>

              {/* Status Radio / Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Resolution Tag:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyStatus('RESOLVED')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      replyStatus === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Issue Solved</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyStatus('INVESTIGATING')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      replyStatus === 'INVESTIGATING'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Investigating</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyStatus('ACKNOWLEDGED')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      replyStatus === 'ACKNOWLEDGED'
                        ? 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-400/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledged</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReplyFeedback(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingReply || !replyMessage.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReply ? 'Publishing Reply...' : 'Publish Official Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
