import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Activity,
  PhoneCall,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Stethoscope,
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  Star,
  ArrowRight,
  HeartPulse,
  Mail,
  Video,
  Play,
  User,
  ChevronLeft,
  ChevronRight,
  Microscope,
  Pill,
  Sparkles,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { HospitalWebsite, WebsiteSection, Doctor, Department, PatientTestimonial } from '../../types';
import { Button } from '../../components/ui/Button';

interface HospitalPublicWebsiteProps {
  hospitalId?: string;
  customSections?: WebsiteSection[];
  customWebsite?: HospitalWebsite;
}

const getHeroThemePalette = (themeName?: string, primaryColor?: string) => {
  const norm = (themeName || '').toLowerCase();

  // 1. Nordic Mint / Modern Teal / Emerald
  if (norm.includes('mint') || norm.includes('teal') || norm.includes('emerald') || (!themeName && primaryColor?.toLowerCase() === '#0d9488')) {
    const primary = primaryColor || '#0d9488';
    return {
      baseBg: '#021811', // Deep clinical pine/emerald black instead of slate-950 blue
      ambientGlow: `radial-gradient(circle at 50% 35%, rgba(13, 148, 136, 0.38) 0%, rgba(4, 47, 35, 0.18) 50%, transparent 75%)`,
      vignetteGradient: `linear-gradient(to bottom, rgba(2, 24, 17, 0.45) 0%, rgba(2, 24, 17, 0.18) 40%, rgba(2, 24, 17, 0.35) 75%, rgba(2, 24, 17, 0.72) 100%)`,
      accentColor: primary,
      pillBg: 'rgba(2, 24, 17, 0.70)',
      pillBorder: 'rgba(13, 148, 136, 0.45)',
    };
  }

  // 2. Monaco Crimson & Rose
  if (norm.includes('crimson') || norm.includes('rose') || norm.includes('monaco')) {
    const primary = primaryColor || '#e11d48';
    return {
      baseBg: '#180306', // Deep velvet crimson black
      ambientGlow: `radial-gradient(circle at 50% 35%, rgba(225, 29, 72, 0.38) 0%, rgba(58, 7, 14, 0.18) 50%, transparent 75%)`,
      vignetteGradient: `linear-gradient(to bottom, rgba(24, 3, 6, 0.45) 0%, rgba(24, 3, 6, 0.18) 40%, rgba(24, 3, 6, 0.35) 75%, rgba(24, 3, 6, 0.72) 100%)`,
      accentColor: primary,
      pillBg: 'rgba(24, 3, 6, 0.70)',
      pillBorder: 'rgba(225, 29, 72, 0.45)',
    };
  }

  // 3. Amethyst Orchid Elegance
  if (norm.includes('amethyst') || norm.includes('orchid')) {
    const primary = primaryColor || '#9333ea';
    return {
      baseBg: '#10031f', // Deep royal amethyst violet black
      ambientGlow: `radial-gradient(circle at 50% 35%, rgba(147, 51, 234, 0.38) 0%, rgba(45, 10, 80, 0.18) 50%, transparent 75%)`,
      vignetteGradient: `linear-gradient(to bottom, rgba(16, 3, 31, 0.45) 0%, rgba(16, 3, 31, 0.18) 40%, rgba(16, 3, 31, 0.35) 75%, rgba(16, 3, 31, 0.72) 100%)`,
      accentColor: primary,
      pillBg: 'rgba(16, 3, 31, 0.70)',
      pillBorder: 'rgba(147, 51, 234, 0.45)',
    };
  }

  // 4. Midnight Obsidian Luxe
  if (norm.includes('midnight') || norm.includes('obsidian')) {
    const primary = primaryColor || '#f59e0b';
    return {
      baseBg: '#0e0a02', // Deep obsidian warm amber black
      ambientGlow: `radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.35) 0%, rgba(45, 30, 5, 0.18) 50%, transparent 75%)`,
      vignetteGradient: `linear-gradient(to bottom, rgba(14, 10, 2, 0.45) 0%, rgba(14, 10, 2, 0.18) 40%, rgba(14, 10, 2, 0.35) 75%, rgba(14, 10, 2, 0.72) 100%)`,
      accentColor: primary,
      pillBg: 'rgba(14, 10, 2, 0.70)',
      pillBorder: 'rgba(245, 158, 11, 0.45)',
    };
  }

  // 5. Swiss Royal Sapphire / Deep Ocean / Healthcare Classic
  const primary = primaryColor || '#2563eb';
  return {
    baseBg: '#050f24', // Deep sapphire navy black
    ambientGlow: `radial-gradient(circle at 50% 35%, rgba(37, 99, 235, 0.38) 0%, rgba(9, 27, 56, 0.18) 50%, transparent 75%)`,
    vignetteGradient: `linear-gradient(to bottom, rgba(5, 15, 36, 0.45) 0%, rgba(5, 15, 36, 0.18) 40%, rgba(5, 15, 36, 0.35) 75%, rgba(5, 15, 36, 0.72) 100%)`,
    accentColor: primary,
    pillBg: 'rgba(5, 15, 36, 0.70)',
    pillBorder: 'rgba(37, 99, 235, 0.45)',
  };
};

const getTestimonialThemeStyles = (themeName?: string, primaryColor?: string) => {
  switch (themeName) {
    case 'Nordic Mint & Jade':
    case 'Modern Teal':
    case 'Emerald Luxury':
      return {
        bgGradient: 'from-[#021d15] via-[#042f23] to-[#021d15]',
        borderSection: 'border-emerald-950',
        glow1: 'bg-emerald-500/20',
        glow2: 'bg-teal-500/15',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
        badgeIcon: 'text-emerald-400 fill-emerald-400',
        titleColor: 'text-white',
        subtitleColor: 'text-emerald-200/90',
        centerCard: 'bg-gradient-to-br from-[#064e3b]/98 via-[#065f46]/95 to-[#022c22]/98 border-emerald-400/50 shadow-emerald-500/20',
        sideCard: 'bg-[#03281d]/85 border-emerald-900/60 text-emerald-100/70',
        sideCardHead: 'text-emerald-100',
        sideCardDesc: 'text-emerald-300/60',
        quoteColor: 'text-emerald-400/20',
        roleColor: 'text-emerald-300 font-semibold',
        avatarRing: 'border-emerald-400',
        starColor: 'text-amber-400 fill-amber-400',
        dotActive: 'bg-emerald-400',
        arrowBtn: 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-800/80 hover:border-emerald-600',
      };
    case 'Midnight Obsidian Luxe':
    case 'Deep Ocean':
      return {
        bgGradient: 'from-[#1c1303] via-[#2d1e05] to-[#1c1303]',
        borderSection: 'border-amber-900/60',
        glow1: 'bg-amber-500/25',
        glow2: 'bg-yellow-500/20',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        badgeIcon: 'text-amber-400 fill-amber-400',
        titleColor: 'text-white',
        subtitleColor: 'text-amber-200/90',
        centerCard: 'bg-gradient-to-br from-[#78350f]/98 via-[#92400e]/95 to-[#451a03]/98 border-amber-400/50 shadow-amber-500/20',
        sideCard: 'bg-[#291705]/85 border-amber-900/60 text-amber-100/70',
        sideCardHead: 'text-amber-100',
        sideCardDesc: 'text-amber-200/60',
        quoteColor: 'text-amber-400/20',
        roleColor: 'text-amber-300 font-semibold',
        avatarRing: 'border-amber-400',
        starColor: 'text-amber-400 fill-amber-400',
        dotActive: 'bg-amber-400',
        arrowBtn: 'bg-amber-950/80 hover:bg-amber-900 text-amber-200 border-amber-800/80 hover:border-amber-600',
      };
    case 'Amethyst Orchid Elegance':
      return {
        bgGradient: 'from-[#120524] via-[#21093d] to-[#120524]',
        borderSection: 'border-purple-950',
        glow1: 'bg-purple-600/20',
        glow2: 'bg-fuchsia-500/15',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
        badgeIcon: 'text-purple-400 fill-purple-400',
        titleColor: 'text-white',
        subtitleColor: 'text-purple-200/90',
        centerCard: 'bg-gradient-to-br from-[#3b0764]/98 via-[#4c1d95]/95 to-[#1e0836]/98 border-purple-400/50 shadow-purple-500/20',
        sideCard: 'bg-[#1b0833]/85 border-purple-900/60 text-purple-100/70',
        sideCardHead: 'text-purple-100',
        sideCardDesc: 'text-purple-300/60',
        quoteColor: 'text-purple-400/20',
        roleColor: 'text-purple-300 font-semibold',
        avatarRing: 'border-purple-400',
        starColor: 'text-amber-400 fill-amber-400',
        dotActive: 'bg-purple-400',
        arrowBtn: 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border-purple-800/80 hover:border-purple-600',
      };
    case 'Monaco Crimson & Rose':
    case 'Crimson Vitality':
      return {
        bgGradient: 'from-[#220404] via-[#3a0707] to-[#220404]',
        borderSection: 'border-red-950',
        glow1: 'bg-red-600/20',
        glow2: 'bg-rose-500/15',
        badgeBg: 'bg-red-500/20 text-red-300 border-red-400/40',
        badgeIcon: 'text-red-400 fill-red-400',
        titleColor: 'text-white',
        subtitleColor: 'text-red-200/90',
        centerCard: 'bg-gradient-to-br from-[#450a0a]/98 via-[#5c0f0f]/95 to-[#2b0505]/98 border-red-400/50 shadow-red-500/20',
        sideCard: 'bg-[#250505]/85 border-red-900/60 text-red-100/70',
        sideCardHead: 'text-red-100',
        sideCardDesc: 'text-red-300/60',
        quoteColor: 'text-red-400/20',
        roleColor: 'text-rose-300 font-semibold',
        avatarRing: 'border-red-400',
        starColor: 'text-amber-400 fill-amber-400',
        dotActive: 'bg-red-500',
        arrowBtn: 'bg-red-950/80 hover:bg-red-900 text-red-200 border-red-800/80 hover:border-red-600',
      };
    case 'Swiss Royal Sapphire':
    default:
      return {
        bgGradient: 'from-[#051124] via-[#091b38] to-[#051124]',
        borderSection: 'border-blue-950',
        glow1: 'bg-blue-600/20',
        glow2: 'bg-cyan-500/15',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
        badgeIcon: 'text-blue-400 fill-blue-400',
        titleColor: 'text-white',
        subtitleColor: 'text-blue-200/90',
        centerCard: 'bg-gradient-to-br from-[#0c2340]/98 via-[#0f2d52]/95 to-[#07172b]/98 border-blue-400/50 shadow-blue-500/20',
        sideCard: 'bg-[#0a192f]/85 border-blue-900/60 text-blue-100/70',
        sideCardHead: 'text-blue-100',
        sideCardDesc: 'text-blue-300/60',
        quoteColor: 'text-blue-400/20',
        roleColor: 'text-blue-300 font-semibold',
        avatarRing: 'border-blue-400',
        starColor: 'text-amber-400 fill-amber-400',
        dotActive: 'bg-blue-500',
        arrowBtn: 'bg-blue-950/80 hover:bg-blue-900 text-blue-200 border-blue-800/80 hover:border-blue-600',
      };
  }
};

const Testimonials3DCarousel: React.FC<{ hospitalId: string; sec: WebsiteSection; website?: HospitalWebsite }> = ({ hospitalId, sec, website }) => {
  const [testimonials, setTestimonials] = useState<PatientTestimonial[]>(() => {
    const list = MockStorage.getTestimonials(hospitalId);
    if (list && list.length > 0) return list;
    return [
      {
        id: `TEST-DEF-1-${hospitalId}`,
        hospitalId,
        patientName: 'Kavitha Ramachandran',
        patientRole: 'Cardiac Bypass Patient',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        headline: 'Exceptional Cardiothoracic Care & Compassionate Nursing',
        reviewText: 'The emergency angioplasty and post-operative ICU attention I received saved my life. Dr. Reed and the cardiac nursing staff were exceptionally skilled, communicative, and compassionate throughout my stay.',
        verified: true,
        date: '2026-10-18',
      },
      {
        id: `TEST-DEF-2-${hospitalId}`,
        hospitalId,
        patientName: 'Suresh Menon',
        patientRole: 'Robotic Orthopedic Surgery',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        headline: 'Walked Pain-Free Within 48 Hours of Procedure',
        reviewText: 'State-of-the-art robotic surgical suite and dedicated physiotherapy rehabilitation. I was discharged in two days and can walk comfortably. Follow-up scheduling was seamless.',
        verified: true,
        date: '2026-10-12',
      },
      {
        id: `TEST-DEF-3-${hospitalId}`,
        hospitalId,
        patientName: 'Dr. Priya Sundaram',
        patientRole: 'Maternity & Neonatal Care (NICU)',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        headline: 'World-Class Birthing Suites and Dedicated Pediatricians',
        reviewText: 'The birthing suites and round-the-clock neonatologists provided our family with complete peace of mind. Every nurse treated our newborn with the gentlest clinical care.',
        verified: true,
        date: '2026-10-04',
      },
    ];
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const update = () => {
      const list = MockStorage.getTestimonials(hospitalId);
      if (list && list.length > 0) setTestimonials(list);
    };
    update();
    window.addEventListener('pulse_storage_updated', update);
    return () => window.removeEventListener('pulse_storage_updated', update);
  }, [hospitalId]);

  // Automatic gentle rotation every 5 seconds when not paused
  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, testimonials.length]);

  if (!testimonials || testimonials.length === 0) return null;

  const count = testimonials.length;
  const prevIndex = (currentIndex - 1 + count) % count;
  const nextIndex = (currentIndex + 1) % count;

  const prevItem = testimonials[prevIndex];
  const current = testimonials[currentIndex];
  const nextItem = testimonials[nextIndex];

  const themeStyles = getTestimonialThemeStyles(website?.theme || 'Swiss Royal Sapphire', website?.primaryColor);

  return (
    <section
      id="testimonials"
      key={sec.id}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`py-24 text-white relative overflow-hidden border-b font-sans select-none bg-gradient-to-b ${themeStyles.bgGradient} ${themeStyles.borderSection}`}
    >
      {/* Background Ambient Glows */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${themeStyles.glow1}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${themeStyles.glow2}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest border backdrop-blur-md ${themeStyles.badgeBg}`}>
            <Star className={`w-3.5 h-3.5 ${themeStyles.starColor}`} />
            Patient Experience & Verified Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">{sec.title || 'Loved by Thousands of Patients'}</h2>
          <p className={`text-sm ${themeStyles.subtitleColor}`}>{sec.subtitle || 'Real verified recovery journeys and experiences cared for at our hospital.'}</p>
        </div>

        {/* 3D Perspective Stage Container */}
        <div className="relative max-w-5xl mx-auto min-h-[380px] flex items-center justify-center [perspective:1200px]">
          {/* Navigation Arrow Left */}
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + count) % count)}
            className={`absolute left-0 sm:-left-6 z-30 p-3 rounded-full shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95 border ${themeStyles.arrowBtn}`}
            aria-label="Previous Review"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Cards 3D Stage */}
          <div className="w-full flex items-center justify-center relative min-h-[360px]">
            {/* 1. Left Card (Perspective Back Left) - Visible on tablet/desktop */}
            {count > 1 && (
              <div
                onClick={() => setCurrentIndex(prevIndex)}
                className={`hidden md:block absolute left-4 lg:left-12 w-[340px] lg:w-[380px] p-6 rounded-3xl cursor-pointer shadow-xl backdrop-blur-sm transition-all duration-700 ease-out transform -rotate-y-12 scale-85 opacity-40 hover:opacity-75 z-10 hover:scale-90 border ${themeStyles.sideCard}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(prevItem.rating || 5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${themeStyles.starColor}`} />
                  ))}
                </div>
                <h4 className={`font-bold text-sm line-clamp-1 mb-2 ${themeStyles.sideCardHead}`}>{prevItem.headline}</h4>
                <p className={`text-xs line-clamp-3 italic ${themeStyles.sideCardDesc}`}>"{prevItem.reviewText}"</p>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <img src={prevItem.avatarUrl} alt={prevItem.patientName} className={`w-8 h-8 rounded-full object-cover border ${themeStyles.avatarRing}`} />
                  <div>
                    <p className={`text-xs font-bold ${themeStyles.sideCardHead}`}>{prevItem.patientName}</p>
                    <p className={`text-[10px] ${themeStyles.sideCardDesc}`}>{prevItem.patientRole}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Center Card (Focused 3D Elevated Card) */}
            <div
              className={`w-full max-w-xl mx-auto rounded-3xl p-7 sm:p-10 shadow-2xl backdrop-blur-2xl relative transition-all duration-700 ease-out z-20 transform hover:scale-[1.02] border ${themeStyles.centerCard}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className={`absolute top-6 right-8 text-7xl font-serif leading-none select-none pointer-events-none ${themeStyles.quoteColor}`}>
                “
              </div>

              <div className="space-y-6 relative z-10">
                {/* Rating Stars & Verified Badge */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-1">
                    {[...Array(current.rating || 5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${themeStyles.starColor}`} />
                    ))}
                  </div>
                  {current.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-full shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Patient Review
                    </span>
                  )}
                </div>

                {/* Review Headline & Body */}
                <div className="space-y-2.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight drop-shadow-xs">{current.headline}</h3>
                  <p className="text-slate-200 text-sm leading-relaxed italic">"{current.reviewText}"</p>
                </div>

                {/* Patient Profile Footer */}
                <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={current.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
                      alt={current.patientName}
                      className={`w-12 h-12 rounded-full object-cover border-2 shadow-md shrink-0 bg-white ${themeStyles.avatarRing}`}
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{current.patientName}</h4>
                      <p className={`text-xs ${themeStyles.roleColor}`}>{current.patientRole || 'Patient'}</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">{current.date}</span>
                </div>
              </div>
            </div>

            {/* 3. Right Card (Perspective Back Right) - Visible on tablet/desktop */}
            {count > 1 && (
              <div
                onClick={() => setCurrentIndex(nextIndex)}
                className={`hidden md:block absolute right-4 lg:right-12 w-[340px] lg:w-[380px] p-6 rounded-3xl cursor-pointer shadow-xl backdrop-blur-sm transition-all duration-700 ease-out transform rotate-y-12 scale-85 opacity-40 hover:opacity-75 z-10 hover:scale-90 border ${themeStyles.sideCard}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(nextItem.rating || 5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${themeStyles.starColor}`} />
                  ))}
                </div>
                <h4 className={`font-bold text-sm line-clamp-1 mb-2 ${themeStyles.sideCardHead}`}>{nextItem.headline}</h4>
                <p className={`text-xs line-clamp-3 italic ${themeStyles.sideCardDesc}`}>"{nextItem.reviewText}"</p>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <img src={nextItem.avatarUrl} alt={nextItem.patientName} className={`w-8 h-8 rounded-full object-cover border ${themeStyles.avatarRing}`} />
                  <div>
                    <p className={`text-xs font-bold ${themeStyles.sideCardHead}`}>{nextItem.patientName}</p>
                    <p className={`text-[10px] ${themeStyles.sideCardDesc}`}>{nextItem.patientRole}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Arrow Right */}
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % count)}
            className={`absolute right-0 sm:-right-6 z-30 p-3 rounded-full shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95 border ${themeStyles.arrowBtn}`}
            aria-label="Next Review"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center space-x-2 pt-8">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx ? `w-8 ${themeStyles.dotActive}` : 'w-2.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const getServiceCardIcon = (iconKey?: string, title?: string, fallbackIndex = 0) => {
  switch (iconKey) {
    case 'stethoscope': return Stethoscope;
    case 'heart-pulse': return HeartPulse;
    case 'activity': return Activity;
    case 'microscope': return Microscope;
    case 'shield-check': return ShieldCheck;
    case 'sparkles': return Sparkles;
    case 'pill': return Pill;
    case 'building': return Building2;
    case 'users': return Users;
    case 'award': return Award;
    case 'video': return Video;
  }

  // Automatic smart detection when title is replaced with any clinical service
  const t = (title || '').toLowerCase();
  if (t.includes('heart') || t.includes('cardio') || t.includes('vascular') || t.includes('pulse')) return HeartPulse;
  if (t.includes('emergency') || t.includes('trauma') || t.includes('icu') || t.includes('critical') || t.includes('acute')) return Activity;
  if (t.includes('pathology') || t.includes('lab') || t.includes('diagnostic') || t.includes('mri') || t.includes('scan') || t.includes('x-ray') || t.includes('blood') || t.includes('test')) return Microscope;
  if (t.includes('pharmacy') || t.includes('medicine') || t.includes('drug') || t.includes('pill') || t.includes('dose')) return Pill;
  if (t.includes('robotic') || t.includes('surgery') || t.includes('surgical') || t.includes('laser') || t.includes('precision') || t.includes('advanced')) return Sparkles;
  if (t.includes('prevent') || t.includes('safety') || t.includes('checkup') || t.includes('wellness') || t.includes('care') || t.includes('mother') || t.includes('child')) return ShieldCheck;
  if (t.includes('consult') || t.includes('doctor') || t.includes('opd') || t.includes('physician') || t.includes('clinic') || t.includes('health')) return Stethoscope;

  // Universal medical icons list - completely suitable for any replaced clinical service
  const universalIcons = [Activity, Microscope, Sparkles, HeartPulse, ShieldCheck, Stethoscope];
  return universalIcons[fallbackIndex % universalIcons.length];
};

export const HospitalPublicWebsite: React.FC<HospitalPublicWebsiteProps> = ({
  hospitalId: propHospitalId,
  customSections,
  customWebsite,
}) => {
  const { hospitalSlug } = useParams<{ hospitalSlug?: string }>();

  // Tenant Resolution Layer: Resolve hospital by ID, slug, or subdomain
  const targetIdentifier = propHospitalId || hospitalSlug || 'HOSP-001';
  let website = customWebsite || MockStorage.getWebsiteByDomainOrSlug(targetIdentifier);
  
  if (!website && propHospitalId) {
    website = MockStorage.getWebsiteByHospitalId(propHospitalId);
  }

  const hospId = website?.hospitalId || 'HOSP-001';
  const hospital = MockStorage.getHospitalById(hospId);
  const hospitalSettings = MockStorage.getHospitalSettings(hospId);
  
  let rawDoctors = MockStorage.getDoctors(hospId).filter((d) => d.status === 'active');
  if (rawDoctors.length === 0) {
    rawDoctors = MockStorage.getDoctors('HOSP-001').filter((d) => d.status === 'active');
  }
  const doctors: Doctor[] = rawDoctors;

  let rawDepartments = MockStorage.getDepartments(hospId).filter((d) => d.status === 'active');
  if (rawDepartments.length === 0) {
    rawDepartments = MockStorage.getDepartments('HOSP-001').filter((d) => d.status === 'active');
  }
  const departments: Department[] = rawDepartments;

  const rawSections = customSections || MockStorage.getWebsiteSections(hospId);
  const sections = rawSections
    .filter((s) => s.isEnabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const dedicatedLogo = customWebsite?.logoUrl || website?.logoUrl || website?.draftConfig?.logoUrl || hospital?.logoUrl;
  const hospitalLogo = dedicatedLogo || hospital?.image;
  const isLogoOnly = (customWebsite?.navbarLogoOnly !== undefined
    ? customWebsite.navbarLogoOnly
    : website?.navbarLogoOnly !== undefined
    ? website.navbarLogoOnly
    : Boolean(dedicatedLogo));

  const logoHeight = customWebsite?.navbarLogoHeight || website?.navbarLogoHeight || website?.draftConfig?.navbarLogoHeight || 44;
  const logoWidth = customWebsite?.navbarLogoWidth || website?.navbarLogoWidth || website?.draftConfig?.navbarLogoWidth || 0;

  if (!hospital || !website) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center text-slate-700 font-sans">
        <Building2 className="w-16 h-16 text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Hospital Website Not Found</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          The requested hospital subdomain or tenant website identifier is not provisioned.
        </p>
      </div>
    );
  }

  const renderSection = (sec: WebsiteSection) => {
    switch (sec.sectionType) {
      case 'hero': {
        const isVideo = sec.settings?.heroBgType === 'video' || website.heroBgType === 'video';
        const bgSource = sec.settings?.heroBgUrl || website.heroBgUrl || sec.imageUrl || website.heroImage || '/hero_bg_banner_1790314222005.jpg';
        const heroPalette = getHeroThemePalette(website.theme, website.primaryColor);
        const activePrimary = heroPalette.accentColor;

        return (
          <section
            id="hero"
            key={sec.id}
            className="relative min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden text-white"
            style={{ backgroundColor: heroPalette.baseBg }}
          >
            {/* Background Image / Video Layer configured by Super Admin */}
            {isVideo ? (
              <video
                src={bgSource}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover scale-105 brightness-105"
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105 brightness-105 contrast-[1.02]"
                style={{ backgroundImage: `url('${bgSource}')` }}
              />
            )}

            {/* Clear, High-Visibility Theme-Adaptive Vignette: Keeps background image crisp and vibrant while ensuring readable text */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: heroPalette.vignetteGradient }}
            />

            {/* Theme-Based Ambient Glow Overlay (Adapts dynamically to hospital's chosen brand theme) */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
              style={{ background: heroPalette.ambientGlow }}
            />

            {/* Hero Centered Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 space-y-6">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm transition-all"
                style={{
                  backgroundColor: `${activePrimary}25`,
                  borderColor: `${activePrimary}55`,
                  color: '#ffffff',
                }}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: activePrimary }} />
                <span>{hospitalSettings?.hospitalName || hospital.name} • Official Healthcare Portal</span>
              </span>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md max-w-4xl mx-auto">
                {sec.title || website.heroTitle}
              </h1>

              <p className="text-slate-100 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium drop-shadow-sm">
                {sec.content || hospitalSettings?.tagline || website.heroDescription}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link to={`/login?targetHospital=${hospId}`}>
                  <button
                    type="button"
                    className="font-extrabold text-white px-8 py-4 rounded-full cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
                    style={{
                      backgroundColor: activePrimary,
                      boxShadow: `0 14px 28px -4px ${activePrimary}66`,
                    }}
                  >
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </button>
                </Link>
                <a href="#doctors">
                  <Button variant="outline" size="lg" className="border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md cursor-pointer">
                    View Specialists Roster
                  </Button>
                </a>
              </div>

              {/* Quick Bar Pill */}
              <div className="pt-8 max-w-xl mx-auto">
                <div
                  className="border rounded-2xl p-4 backdrop-blur-md flex items-center justify-around text-xs font-semibold text-slate-100 shadow-lg"
                  style={{
                    backgroundColor: heroPalette.pillBg,
                    borderColor: heroPalette.pillBorder,
                  }}
                >
                  <span className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 shrink-0" style={{ color: activePrimary }} />
                    Emergency: {hospitalSettings?.emergencyHelpline || hospital.phone}
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" style={{ color: activePrimary }} />
                    {hospitalSettings?.operatingHours || '24/7 OPD & ICU'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case 'about':
        return (
          <section id="about" key={sec.id} className="py-20 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src={sec.imageUrl || '/card_hospital_hms_1790313910509.jpg'}
                  alt="About Hospital"
                  className="rounded-2xl border border-slate-200 shadow-xl w-full h-80 object-cover"
                />
              </div>
              <div className="space-y-4">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-widest font-mono">ABOUT US</span>
                <h2 className="text-3xl font-bold text-slate-900">{sec.title}</h2>
                {sec.subtitle && <p className="text-sm font-semibold text-teal-600">{sec.subtitle}</p>}
                <p className="text-slate-600 text-sm leading-relaxed">{sec.content}</p>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{sec.settings?.stat1Value || hospital.totalBeds}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{sec.settings?.stat1Label || 'Beds Capacity'}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-teal-600">{sec.settings?.stat2Value || hospital.totalDoctors}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{sec.settings?.stat2Label || 'Specialists'}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">{sec.settings?.stat3Value || departments.length}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{sec.settings?.stat3Label || 'Departments'}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'departments':
        return (
          <section id="departments" key={sec.id} className="py-20 bg-slate-50/70 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-widest font-mono">SPECIALIZED CLINICAL UNITS</span>
                <h2 className="text-3xl font-bold text-slate-900">{sec.title || 'Tailored Medical Care for Every Department'}</h2>
                <p className="text-slate-600 text-sm">{sec.subtitle || 'Dedicated clinical faculties equipped with specialized doctors, advanced technology, and compassionate patient care.'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: (sec.settings as any)?.deptCardCount || 6 }, (_, idx) => {
                  const defaultList = [
                    { name: 'Cardiology & Cardiovascular Sciences', desc: 'Comprehensive non-invasive & catheterization labs for acute heart care.', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80' },
                    { name: 'Neurology & Neurosurgery', desc: 'Advanced brain, spinal cord, stroke rehabilitation, and neuro ICU units.', img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80' },
                    { name: 'Pediatric & Neonatal Care', desc: 'Dedicated neonatal intensive care (NICU) and pediatric emergency care.', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80' },
                    { name: 'Orthopedics & Joint Reconstruction', desc: 'Arthroscopic surgery, joint replacements, and trauma reconstruction.', img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80' },
                    { name: 'General Internal Medicine & OPD', desc: 'Preventive health checkups, chronic disease management, and outpatient clinics.', img: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&auto=format&fit=crop&q=80' },
                    { name: 'Emergency & Trauma Bay', desc: '24/7 Level-1 trauma response, resuscitations, and stroke code activations.', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80' },
                  ];
                  const fallback = defaultList[idx % defaultList.length];
                  const dept = departments[idx] || fallback;

                  const img = (sec.settings as any)?.[`deptCard${idx + 1}Img`] || fallback.img;
                  const cardTitle = (sec.settings as any)?.[`deptCard${idx + 1}Title`] || dept.name || fallback.name;
                  const cardDesc = (sec.settings as any)?.[`deptCard${idx + 1}Desc`] || dept.description || fallback.desc;

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="p-6 space-y-4">
                        {/* Top Icon Badge */}
                        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold">
                          <Building2 className="w-5 h-5 text-teal-600" />
                        </div>

                        {/* Title & Desc */}
                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-teal-600 transition-colors leading-tight">
                          {cardTitle}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                          {cardDesc}
                        </p>

                        {/* Explore Link */}
                        <div className="pt-2">
                          <span className="inline-flex items-center text-xs font-bold text-teal-600 group-hover:text-teal-700 cursor-pointer">
                            Explore Department <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>

                      {/* Bottom Banner Image */}
                      <div className="h-36 overflow-hidden border-t border-slate-100">
                        <img
                          src={img}
                          alt={cardTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'doctors': {
        const docCount = (sec.settings as any)?.docCardCount || Math.max(doctors.length, 3);
        const fallbackDoctors = [
          { name: 'Dr. Evelyn Reed, MD', spec: 'Senior Interventional Cardiologist', fee: '₹1,200', dept: 'Cardiology', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80' },
          { name: 'Dr. Christopher Shaw, MD', spec: 'Neurologist & Neuro-Oncologist', fee: '₹1,500', dept: 'Neurology', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
          { name: 'Dr. Ananya Roy, MD', spec: 'Pediatric Specialist', fee: '₹800', dept: 'Pediatrics', img: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?w=150&auto=format&fit=crop&q=80' },
          { name: 'Dr. Rajesh Sharma, MS', spec: 'Orthopedic & Joint Surgeon', fee: '₹1,000', dept: 'Orthopedics', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80' },
          { name: 'Dr. Priya Nair, MD', spec: 'Consultant Dermatologist', fee: '₹700', dept: 'Dermatology', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80' },
          { name: 'Dr. Vikramaditya Singh, DM', spec: 'Gastroenterologist', fee: '₹1,400', dept: 'Gastroenterology', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
        ];

        return (
          <section id="doctors" key={sec.id} className="py-20 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-widest font-mono">MEDICAL FACULTY</span>
                <h2 className="text-3xl font-bold text-slate-900">{sec.title}</h2>
                <p className="text-slate-600 text-sm">{sec.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: docCount }, (_, idx) => {
                  const actualDoc = doctors[idx];
                  const fallbackDoc = fallbackDoctors[idx % fallbackDoctors.length];
                  
                  const docName = (sec.settings as any)?.[`docCard${idx + 1}Name`] || actualDoc?.name || fallbackDoc.name;
                  const docSpec = (sec.settings as any)?.[`docCard${idx + 1}Spec`] || actualDoc?.specialization || fallbackDoc.spec;
                  const rawFee = (sec.settings as any)?.[`docCard${idx + 1}Fee`] || (actualDoc?.consultationFee ? `₹${actualDoc.consultationFee}` : fallbackDoc.fee);
                  const docFee = rawFee.startsWith('₹') ? rawFee : `₹${rawFee.replace(/[^0-9,]/g, '') || '800'}`;
                  const docImg = (sec.settings as any)?.[`docCard${idx + 1}Img`] || actualDoc?.avatarUrl || fallbackDoc.img;
                  const docDept = actualDoc?.departmentName || fallbackDoc.dept;

                  return (
                    <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex gap-4 items-center hover:border-teal-400 transition-all shadow-xs">
                      <img
                        src={docImg}
                        alt={docName}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-transparent"
                      />
                      <div className="space-y-1 text-xs">
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">{docName}</h4>
                        <p className="text-teal-700 font-semibold">{docSpec}</p>
                        <p className="text-slate-500 text-[11px]">{docDept}</p>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100/80 text-teal-800 text-[10px] font-bold border border-teal-200">
                          OPD Fee: {docFee}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }

      case 'appointment_cta': {
        const themeStyles = getTestimonialThemeStyles(website?.theme || 'Swiss Royal Sapphire', website?.primaryColor);
        return (
          <section
            id="booking"
            key={sec.id}
            className={`py-20 text-white relative overflow-hidden border-b bg-gradient-to-r ${themeStyles.bgGradient} ${themeStyles.borderSection}`}
          >
            {/* Themed ambient background glow */}
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${website.primaryColor || '#2563eb'} 0%, transparent 70%)`
              }}
            />
            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-4">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${themeStyles.badgeBg}`}>
                <HeartPulse className="w-3.5 h-3.5" style={{ color: website.primaryColor || '#38bdf8' }} />
                Instant Specialist Booking
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                {sec.title || 'Need Immediate Medical Consultation?'}
              </h2>
              {sec.subtitle && (
                <p className={`booking-subtitle text-base sm:text-lg font-semibold drop-shadow-xs ${themeStyles.subtitleColor}`}>
                  {sec.subtitle}
                </p>
              )}
              <p className="text-slate-200 text-sm max-w-xl mx-auto leading-relaxed drop-shadow-xs">
                {sec.content || 'Choose your preferred specialist, select convenient timeslots, and receive digital appointment confirmations.'}
              </p>
              <div className="pt-4 flex justify-center">
                <Link to={sec.settings?.buttonLink || "/login"}>
                  <Button
                    size="lg"
                    className="font-bold text-white px-8 py-3.5 rounded-full shadow-xl hover:opacity-95 transition-all cursor-pointer flex items-center gap-2"
                    style={{ backgroundColor: website.primaryColor || '#2563eb' }}
                  >
                    <span>{sec.settings?.buttonText || 'Book Appointment Now'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        );
      }

      case 'services':
        return (
          <section id="services" key={sec.id} className="py-20 service-section border-b transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest font-mono service-badge">CLINICAL SERVICES</span>
                <h2 className="text-3xl font-bold service-title">{sec.title || 'Comprehensive Medical & Surgical Services'}</h2>
                <p className="text-sm service-subtitle">{sec.subtitle || 'Advanced diagnostic, therapeutic, and emergency healthcare solutions.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: (sec.settings as any)?.serviceCardCount || 6 }, (_, idx) => {
                  const id = idx + 1;
                  const defaultServices = [
                    { defaultTitle: 'Emergency Trauma & ICU', defaultDesc: 'Round-the-clock level 1 emergency care and critical ICU beds.', defaultIcon: 'activity' },
                    { defaultTitle: 'Advanced Pathology & Imaging', defaultDesc: 'High-speed MRI, CT Scans, digital X-Rays and automated lab diagnostics.', defaultIcon: 'microscope' },
                    { defaultTitle: 'Robotic & Minimally Invasive Surgery', defaultDesc: 'Precision surgical procedures with faster recovery times.', defaultIcon: 'sparkles' },
                    { defaultTitle: 'Cardiovascular Interventions', defaultDesc: 'Cath lab angioplasty, pacemaker installations, and cardiac rehab.', defaultIcon: 'heart-pulse' },
                    { defaultTitle: 'Mother & Child Care (NICU)', defaultDesc: 'Comprehensive maternity suites and neonatal intensive care.', defaultIcon: 'shield-check' },
                    { defaultTitle: 'Tele-Consultation & Home Visits', defaultDesc: 'Virtual doctor appointments and emergency home care visits.', defaultIcon: 'stethoscope' },
                  ];
                  const srv = defaultServices[idx % defaultServices.length];
                  const cardTitle = (sec.settings as any)?.[`serviceCard${id}Title`] || srv.defaultTitle;
                  const cardDesc = (sec.settings as any)?.[`serviceCard${id}Desc`] || srv.defaultDesc;
                  const cardIcon = (sec.settings as any)?.[`serviceCard${id}Icon`];
                  const IconComp = getServiceCardIcon(cardIcon, cardTitle, idx);

                  return (
                    <div key={id} className="p-6 rounded-2xl border shadow-md transition-all service-card flex flex-col justify-between">
                      <div>
                        <div className="service-icon-box w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                          <IconComp className="w-6 h-6 service-icon" />
                        </div>
                        <h3 className="font-bold text-base mb-2 service-card-title">{cardTitle}</h3>
                        <p className="text-xs leading-relaxed service-card-desc">{cardDesc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'facilities':
        return (
          <section id="facilities" key={sec.id} className="py-20 bg-slate-50 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-widest font-mono">WORLD-CLASS INFRASTRUCTURE</span>
                <h2 className="text-3xl font-bold text-slate-900">{sec.title || 'Hospital Infrastructure & Facilities'}</h2>
                <p className="text-slate-600 text-sm">{sec.subtitle || 'State-of-the-art medical equipment and patient comfort.'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: 1, defaultTitle: 'Modular Operation Theatres', defaultCount: '12 OTs' },
                  { id: 2, defaultTitle: 'ICU & CCU Ventilator Beds', defaultCount: `${hospital.totalBeds || 50}+ Beds` },
                  { id: 3, defaultTitle: '24/7 Ambulance Fleet', defaultCount: 'GPS Tracked' },
                  { id: 4, defaultTitle: 'Blood Bank & In-House Pharmacy', defaultCount: '24/7 Ready' },
                ].map((fac) => {
                  const title = (sec.settings as any)?.[`facilityCard${fac.id}Title`] || fac.defaultTitle;
                  const count = (sec.settings as any)?.[`facilityCard${fac.id}Count`] || fac.defaultCount;
                  return (
                    <div key={fac.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center hover:border-teal-400 transition-all">
                      <Building2 className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{title}</h4>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        return <Testimonials3DCarousel key={sec.id} hospitalId={hospId} sec={sec} website={website} />;

      case 'branches': {
        const cardCount = Number((sec.settings as any)?.branchCardCount) || 3;
        const defaultBranchCards = [
          {
            title: 'ABC Chennai Hospital (Flagship Campus)',
            location: '45 Anna Salai, T. Nagar, Chennai, Tamil Nadu',
            desc: 'Flagship tertiary hospital featuring 24/7 Level-1 trauma care, interventional cardiology, neurology, and 60 inpatient beds.',
            img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
            link: '/hospital/abc-chennai',
            phone: '+91 44 2834 9000',
          },
          {
            title: 'ABC Bangalore Hospital',
            location: '88 Hosur Road, Koramangala 5th Block, Bengaluru, Karnataka',
            desc: 'Comprehensive multispecialty hospital with robotic surgery, pediatric ICU, specialized oncology, and high-tech day surgery suites.',
            img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
            link: '/hospital/abc-bangalore',
            phone: '+91 80 4123 4567',
          },
          {
            title: 'ABC Hyderabad Medical Center',
            location: '12 Cyber Hills, HITEC City, Hyderabad, Telangana',
            desc: 'Specialized digital diagnostic center and orthopedic institute providing advanced joint replacement and rehabilitation therapies.',
            img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
            link: '/hospital/abc-hyderabad',
            phone: '+91 40 6789 1234',
          },
        ];

        const cards = Array.from({ length: cardCount }, (_, idx) => {
          const id = idx + 1;
          const d = defaultBranchCards[idx % defaultBranchCards.length];
          const title = (sec.settings as any)?.[`branchCard${id}Title`] || d.title;
          const location = (sec.settings as any)?.[`branchCard${id}Location`] || d.location;
          const desc = (sec.settings as any)?.[`branchCard${id}Desc`] || d.desc;
          const img = (sec.settings as any)?.[`branchCard${id}Img`] || d.img;
          const link = (sec.settings as any)?.[`branchCard${id}Link`] || d.link;
          const phone = (sec.settings as any)?.[`branchCard${id}Phone`] || d.phone;
          return { id, title, location, desc, img, link, phone };
        });

        return (
          <section id="branches" key={sec.id} className="py-20 bg-slate-50/80 border-b border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-teal-800 text-xs font-bold uppercase tracking-widest font-mono border border-teal-200">
                  <Building2 className="w-3.5 h-3.5 text-teal-700" />
                  Regional Healthcare Network
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {sec.title || 'Our Hospital Branches & Healthcare Network'}
                </h2>
                {sec.subtitle && (
                  <p className="text-base font-semibold text-teal-700">
                    {sec.subtitle}
                  </p>
                )}
                {sec.content && (
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
                    {sec.content}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-400 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    {/* Branch Facility Photo (img) */}
                    <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                      <img
                        src={card.img}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/60 shadow-xs flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-teal-600" />
                        Branch #{card.id}
                      </div>
                    </div>

                    {/* Card Content: Title, Branch Location, Description */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-teal-700 transition-colors">
                          {card.title}
                        </h3>

                        {/* Branch Location */}
                        <div className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          <span className="font-medium leading-snug">{card.location}</span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        {card.phone ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                            {card.phone}
                          </span>
                        ) : <span />}

                        {card.link ? (
                          <Link
                            to={card.link}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 group-hover:translate-x-0.5 transition-all"
                          >
                            Visit Branch <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">
                            Active Campus <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'contact':
        return (
          <section id="contact" key={sec.id} className="py-20 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-widest font-mono">REACH OUT TO US</span>
                <h2 className="text-3xl font-bold text-slate-900">{sec.title || 'Contact & Location'}</h2>
                <p className="text-slate-600 text-sm">{sec.subtitle || '24/7 Emergency & Outpatient Department Services'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 hover:border-teal-400 transition-all shadow-xs">
                  <MapPin className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                  <h4 className="font-bold text-slate-900 text-sm">{(sec.settings as any)?.contactCard1Title || 'Hospital Address'}</h4>
                  <p className="text-xs text-slate-600">{(sec.settings as any)?.address || hospitalSettings?.address || `${hospital.address}, ${hospital.city}, ${hospital.state}`}</p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 hover:border-teal-400 transition-all shadow-xs">
                  <PhoneCall className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                  <h4 className="font-bold text-slate-900 text-sm">{(sec.settings as any)?.contactCard2Title || 'Emergency & Reception'}</h4>
                  <p className="text-xs text-slate-600">
                    {hospitalSettings?.emergencyHelpline ? `Emergency: ${hospitalSettings.emergencyHelpline}` : (sec.settings as any)?.phone || hospital.phone}
                    {hospitalSettings?.receptionPhone ? ` • OPD: ${hospitalSettings.receptionPhone}` : ''}
                    {(hospitalSettings?.email || (sec.settings as any)?.email || hospital.email) ? ` • ${hospitalSettings?.email || (sec.settings as any)?.email || hospital.email}` : ''}
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 hover:border-teal-400 transition-all shadow-xs">
                  <Clock className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                  <h4 className="font-bold text-slate-900 text-sm">{(sec.settings as any)?.contactCard3Title || 'Operating Hours'}</h4>
                  <p className="text-xs text-slate-600">{hospitalSettings?.operatingHours || (sec.settings as any)?.hours || '24/7 Emergency & ICU • OPD: Mon-Sat 8:00 AM - 6:00 PM'}</p>
                </div>
              </div>
            </div>
          </section>
        );

      case 'footer':
        return (
          <footer
            key={sec.id}
            id="footer"
            className="w-full text-white font-sans relative overflow-hidden border-t-4"
            style={{
              borderColor: website.primaryColor || '#2563eb',
              backgroundColor: '#070b14',
              backgroundImage: 'linear-gradient(180deg, #0d1527 0%, #060911 100%)'
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 items-start">
                {/* Column 1: Brand & Logo */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="inline-flex items-center gap-3 text-white font-bold">
                    {hospitalLogo ? (
                      <img
                        src={hospitalLogo}
                        alt={hospital.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/30 shadow-lg shrink-0 bg-transparent"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
                        <Activity className="w-7 h-7" />
                      </div>
                    )}
                    <span className="text-xl font-extrabold tracking-tight">{sec.title || hospital.name}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal max-w-sm">
                    {sec.content || `The trusted healthcare partner providing advanced, world-class medical treatment, compassionate clinical care, and 24/7 emergency response.`}
                  </p>

                  <div className="flex items-center space-x-3 pt-2">
                    <a href="#" className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                      <span className="font-bold text-xs">in</span>
                    </a>
                    <a href={`mailto:${hospital.email}`} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Column 2: Quick Links */}
                <div className="lg:col-span-3 space-y-4 text-xs font-medium">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">QUICK LINKS</h4>
                  <ul className="space-y-2.5">
                    <li><a href="#about" className="hover:underline text-slate-300 hover:text-white transition-colors">About Us</a></li>
                    <li><a href="#departments" className="hover:underline text-slate-300 hover:text-white transition-colors">Services & Departments</a></li>
                    <li><a href="#doctors" className="hover:underline text-slate-300 hover:text-white transition-colors">Medical Specialists</a></li>
                    <li><a href="#contact" className="hover:underline text-slate-300 hover:text-white transition-colors">Contact & Operating Hours</a></li>
                    <li><Link to={`/login?targetHospital=${hospId}`} className="hover:underline text-slate-300 hover:text-white transition-colors">Staff & Patient Login</Link></li>
                  </ul>
                </div>

                {/* Column 3: Contact & Hours */}
                <div className="lg:col-span-3 space-y-4 text-xs font-medium">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">CONTACT & HOURS</h4>
                  <div className="space-y-3 text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                      <span>{(sec.settings as any)?.address || hospitalSettings?.address || `${hospital.address}, ${hospital.city}, ${hospital.state}`}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-4 h-4 shrink-0 text-white" />
                      <span>
                        {hospitalSettings?.emergencyHelpline
                          ? `Emergency: ${hospitalSettings.emergencyHelpline}${hospitalSettings.receptionPhone ? ` • OPD: ${hospitalSettings.receptionPhone}` : ''}`
                          : (sec.settings as any)?.phone || hospital.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 shrink-0 text-white" />
                      <span>{hospitalSettings?.operatingHours || (sec.settings as any)?.hours || '08:00 AM – 08:00 PM (OPD) • 24/7 ICU'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 shrink-0 text-white" />
                      <span>{hospitalSettings?.email || (sec.settings as any)?.email || hospital.email}</span>
                    </div>
                  </div>
                </div>

                {/* Column 4: Location Map & Powered By */}
                <div className="lg:col-span-2 space-y-5 text-xs">
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-white mb-2">OUR LOCATION</h4>
                    <div className="rounded-xl overflow-hidden bg-white/20 border border-white/30 p-2 shadow-sm text-center relative group">
                      <img
                        src={(sec.settings as any)?.mapImg || 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=300&auto=format&fit=crop&q=80'}
                        alt="Hospital Location Map"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                        <span className="bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-600" /> Maps ↗
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-white/80 mb-1.5">POWERED BY</h4>
                    <div className="bg-white px-3 py-2 rounded-xl shadow-md flex items-center justify-center">
                      <img
                        src="/zenelaitinfotech_logo.png"
                        alt="Zenelait Infotech"
                        className="h-8 max-w-[150px] object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Copyright Bar inside the footer */}
              <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-medium gap-3">
                <p>{(sec.settings as any)?.copyrightText || sec.subtitle || `© ${new Date().getFullYear()} ${hospital.name}. All rights reserved.`}</p>
                <div className="flex items-center space-x-4">
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                  <span className="text-slate-600">•</span>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>
        );

      default:
        return null;
    }
  };

  // Dynamic Theme Palette Map (5 Luxury Hospital Themes)
  const themeClassMap: Record<string, string> = {
    'Swiss Royal Sapphire': 'theme-swiss-sapphire',
    'Nordic Mint & Jade': 'theme-nordic-mint',
    'Midnight Obsidian Luxe': 'theme-midnight-luxe',
    'Amethyst Orchid Elegance': 'theme-amethyst-orchid',
    'Monaco Crimson & Rose': 'theme-monaco-crimson',
    // Backward compatibility aliases
    'Modern Teal': 'theme-nordic-mint',
    'Deep Ocean': 'theme-swiss-sapphire',
    'Healthcare Classic': 'theme-swiss-sapphire',
    'Emerald Luxury': 'theme-nordic-mint',
    'Crimson Vitality': 'theme-monaco-crimson',
    'Clean Minimal': 'theme-swiss-sapphire',
  };

  const currentThemeClass = themeClassMap[website?.theme || 'Swiss Royal Sapphire'] || themeClassMap['Swiss Royal Sapphire'];

  return (
    <div
      className={`min-h-screen ${currentThemeClass} transition-colors duration-300 font-sans selection:bg-teal-500 selection:text-white`}
      style={{ '--primary-accent': website?.primaryColor || '#0d9488' } as React.CSSProperties}
    >
      {/* Top Header Navigation */}
      <nav className="border-b border-slate-200 bg-white/95 sticky top-0 z-40 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {isLogoOnly && dedicatedLogo ? (
            <a href="#hero" className="flex items-center shrink-0 py-1 transition-opacity hover:opacity-90">
              <img
                src={dedicatedLogo}
                alt={hospital.name}
                style={{
                  height: `${logoHeight}px`,
                  width: logoWidth > 0 ? `${logoWidth}px` : 'auto',
                }}
                className="max-h-[68px] max-w-[340px] object-contain shrink-0"
              />
            </a>
          ) : (
            <div className="flex items-center space-x-3">
              {hospitalLogo ? (
                <img
                  src={hospitalLogo}
                  alt={hospital.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200/80 shadow-md shrink-0 bg-transparent"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-md shadow-teal-600/20 shrink-0">
                  <Activity className="w-8 h-8" />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight leading-tight">{hospitalSettings?.hospitalName || hospital.name}</span>
                <span className="inline-block mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200/80 w-max">
                  {hospital.type}
                </span>
              </div>
            </div>
          )}

          <div className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-700">
            <a href="#hero" className="hover:text-teal-600 transition-colors">Home</a>
            <a href="#about" className="hover:text-teal-600 transition-colors">About</a>
            <a href="#departments" className="hover:text-teal-600 transition-colors">Departments</a>
            <a href="#doctors" className="hover:text-teal-600 transition-colors">Doctors</a>
            {sections.some((s) => s.sectionType === 'branches' && s.isEnabled) && (
              <a href="#branches" className="hover:text-teal-600 transition-colors flex items-center gap-1 text-teal-700 font-extrabold">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                Branches
              </a>
            )}
            <a href="#contact" className="hover:text-teal-600 transition-colors">Contact</a>
          </div>

          <div className="flex items-center space-x-3">
            <Link to={`/login?targetHospital=${hospId}`}>
              <Button
                size="sm"
                style={{ backgroundColor: website.primaryColor || '#0d9488' }}
                className="text-white font-bold rounded-full text-xs shadow-md hover:brightness-110 border-0"
              >
               Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Render Dynamic Website Sections */}
      {sections.map((sec) => renderSection(sec))}
    </div>
  );
};
