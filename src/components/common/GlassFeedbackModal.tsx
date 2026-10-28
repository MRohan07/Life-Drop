/* @module: GlassFeedbackModal — Simple, elegant feedback modal matching design specification */
import React, { useState, useEffect } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { Star, X, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FeedbackExperienceType } from '../../types';

export const GlassFeedbackModal: React.FC = () => {
  const {
    feedbackModalState,
    closeFeedbackModal,
    submitFeedback,
    markFeedbackPromptAsSeen,
  } = useLifeDrop();

  const {
    isOpen,
    triggerRole,
    triggerUserId,
    triggerUserName,
    triggerUserBloodGroup,
    requestId,
    facilityName,
    isPostDonation,
  } = feedbackModalState;

  const [rating, setRating] = useState<number>(4);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setRating(4);
      setHoverRating(null);
      setComments('');
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleSkipOrDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, triggerUserId]);

  if (!isOpen) return null;

  const handleSkipOrDismiss = () => {
    if (triggerUserId) {
      markFeedbackPromptAsSeen(triggerUserId);
    }
    closeFeedbackModal();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const expType: FeedbackExperienceType = isPostDonation
      ? 'DONATION'
      : triggerRole === 'HOSPITAL'
      ? 'COORDINATION'
      : triggerRole === 'BLOOD_BANK'
      ? 'PLATFORM'
      : 'GENERAL';

    submitFeedback({
      userId: triggerUserId || 'USER-DEFAULT',
      userName: triggerUserName || 'LifeDrop User',
      userRole: triggerRole || 'USER',
      userBloodGroup: triggerUserBloodGroup,
      rating,
      experienceType: expType,
      relatedRequestId: requestId,
      facilityName: facilityName || (triggerRole === 'HOSPITAL' ? 'Clinical Facility' : 'LifeDrop Network'),
      comments: comments.trim() || 'Verified smooth coordination experience.',
    });

    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C1121F', '#E63946', '#16A34A', '#2563EB', '#F59E0B'],
      });
    } catch {}

    setIsSubmitting(false);
    setIsSuccess(true);

    setTimeout(() => {
      closeFeedbackModal();
    }, 1500);
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSkipOrDismiss();
      }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative text-slate-800 space-y-5 animate-scaleUp">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleSkipOrDismiss}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          /* Quick Confirmation */
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Thank You!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your feedback helps us make LifeDrop better for everyone.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3.5 pr-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-lifedrop-primary flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                  Give Feedback
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Your feedback helps us make LifeDrop better for everyone.
                </p>
              </div>
            </div>

            {/* Star Rating Section */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-900">
                How would you rate your experience?
              </label>

              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-115 active:scale-95 focus:outline-hidden cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                        star <= activeDisplayRating
                          ? 'text-lifedrop-primary fill-lifedrop-primary'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="text-center text-xs text-slate-500 font-medium">
                {activeDisplayRating} out of 5
              </div>
            </div>

            {/* Feedback Textarea Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Your Feedback
                </label>
                <span className="text-xs text-slate-400 font-medium">(Optional)</span>
              </div>

              <div className="relative rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-lifedrop-primary focus-within:bg-white transition-all p-3">
                <textarea
                  rows={3}
                  maxLength={500}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us what you liked or what we can improve..."
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden resize-none leading-relaxed"
                />
                <div className="text-[11px] text-slate-400 text-right mt-1 font-mono">
                  {comments.length}/500
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkipOrDismiss}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-2xl bg-lifedrop-primary hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GlassFeedbackModal;
