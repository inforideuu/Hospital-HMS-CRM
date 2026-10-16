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
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { HospitalWebsite, WebsiteSection, Doctor, Department } from '../../types';
import { Button } from '../../components/ui/Button';

interface HospitalPublicWebsiteProps {
  hospitalId?: string;
  customSections?: WebsiteSection[];
  customWebsite?: HospitalWebsite;
}

const Testimonials3DCarousel: React.FC<{ hospitalId: string; sec: WebsiteSection }> = ({ hospitalId, sec }) => {
  const [testimonials, setTestimonials] = useState(() => MockStorage.getTestimonials(hospitalId));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const update = () => setTestimonials(MockStorage.getTestimonials(hospitalId));
    update();
    window.addEventListener('pulse_storage_updated', update);
    return () => window.removeEventListener('pulse_storage_updated', update);
  }, [hospitalId]);

  if (!testimonials || testimonials.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex] || testimonials[0];

  return (
    <section id="testimonials" key={sec.id} className="py-20 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800 font-sans">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-widest border border-teal-500/30 backdrop-blur-md">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Patient Experience & Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{sec.title || 'Loved by Thousands of Patients'}</h2>
          <p className="text-slate-400 text-sm">{sec.subtitle || 'Real verified stories from individuals and families cared for at our medical center.'}</p>
        </div>

        {/* 3D Carousel Perspective Stage */}
        <div className="relative max-w-4xl mx-auto min-h-[360px] flex items-center justify-center">
          <div className="w-full flex items-center justify-center relative">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute -left-2 sm:-left-12 z-30 p-3 rounded-full bg-slate-800/90 hover:bg-teal-500 text-white border border-slate-700 hover:border-teal-400 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
              aria-label="Previous Testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Active 3D Testimonial Card */}
            <div className="w-full max-w-2xl bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-950/95 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-teal-500/10 backdrop-blur-xl relative transition-all duration-500 transform hover:scale-[1.01]">
              <div className="absolute top-6 right-8 text-slate-700/40 text-7xl font-serif leading-none select-none pointer-events-none">
                “
              </div>

              <div className="space-y-6">
                {/* Rating Stars & Verified Badge */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-1">
                    {[...Array(current.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  {current.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 bg-teal-950/80 border border-teal-700/60 px-3 py-1 rounded-full shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Verified Patient Review
                    </span>
                  )}
                </div>

                {/* Review Headline & Body */}
                <div className="space-y-2.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">{current.headline}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed italic">"{current.reviewText}"</p>
                </div>

                {/* Patient Profile Footer */}
                <div className="pt-5 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={current.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
                      alt={current.patientName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-teal-500/60 shadow-md shrink-0 bg-white"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{current.patientName}</h4>
                      <p className="text-xs text-teal-400 font-semibold">{current.patientRole || 'Patient'}</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">{current.date}</span>
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              className="absolute -right-2 sm:-right-12 z-30 p-3 rounded-full bg-slate-800/90 hover:bg-teal-500 text-white border border-slate-700 hover:border-teal-400 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
              aria-label="Next Testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center space-x-2 pt-8">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx ? 'w-8 bg-teal-400' : 'w-2.5 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
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

  const hospitalLogo = website?.logoUrl || website?.draftConfig?.logoUrl || hospital?.logoUrl || hospital?.image;

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

        return (
          <section id="hero" key={sec.id} className="relative min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
            {/* Background Image / Video Layer configured by Super Admin */}
            {isVideo ? (
              <video
                src={bgSource}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover scale-105"
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                style={{ backgroundImage: `url('${bgSource}')` }}
              />
            )}

            {/* Dark Tint Overlay for crystal-clear readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90 backdrop-blur-[1px]" />

            {/* Hero Centered Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider border border-teal-500/30 backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                {hospital.name} • Official Healthcare Portal
              </span>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md max-w-4xl mx-auto">
                {sec.title || website.heroTitle}
              </h1>

              <p className="text-slate-200 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal drop-shadow-sm">
                {sec.content || website.heroDescription}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link to="/login">
                  <Button variant="primary" size="lg" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-8 py-4 rounded-full shadow-xl shadow-teal-500/20 cursor-pointer">
                    Sign In to Portal <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <a href="#doctors">
                  <Button variant="outline" size="lg" className="border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md cursor-pointer">
                    View Specialists Roster
                  </Button>
                </a>
              </div>

              {/* Quick Bar Pill */}
              <div className="pt-8 max-w-xl mx-auto">
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md flex items-center justify-around text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-2"><PhoneCall className="w-4 h-4 text-teal-400" /> Emergency: {hospital.phone}</span>
                  <span className="text-white/30">|</span>
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-teal-400" /> 24/7 OPD & ICU</span>
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

      case 'appointment_cta':
        return (
          <section id="booking" key={sec.id} className="py-20 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white">
            <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold">{sec.title || 'Need Immediate Medical Consultation?'}</h2>
              {sec.subtitle && <p className="text-teal-300 font-semibold text-sm sm:text-base">{sec.subtitle}</p>}
              <p className="text-slate-300 text-sm max-w-xl mx-auto">{sec.content || 'Choose your preferred specialist, select convenient timeslots, and receive digital appointment confirmations.'}</p>
              <div className="pt-3">
                <Link to={sec.settings?.buttonLink || "/login"}>
                  <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-8 py-4 rounded-full shadow-xl">
                    {sec.settings?.buttonText || 'Sign In to Portal'} <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        );

      case 'services':
        return (
          <section id="services" key={sec.id} className="py-20 bg-slate-900 text-white border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest font-mono">CLINICAL SERVICES</span>
                <h2 className="text-3xl font-bold text-white">{sec.title || 'Comprehensive Medical & Surgical Services'}</h2>
                <p className="text-slate-300 text-sm">{sec.subtitle || 'Advanced diagnostic, therapeutic, and emergency healthcare solutions.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: (sec.settings as any)?.serviceCardCount || 6 }, (_, idx) => {
                  const id = idx + 1;
                  const defaultServices = [
                    { defaultTitle: 'Emergency Trauma & ICU', defaultDesc: 'Round-the-clock level 1 emergency care and critical ICU beds.', icon: Activity },
                    { defaultTitle: 'Advanced Pathology & Imaging', defaultDesc: 'High-speed MRI, CT Scans, digital X-Rays and automated lab diagnostics.', icon: Stethoscope },
                    { defaultTitle: 'Robotic & Minimally Invasive Surgery', defaultDesc: 'Precision surgical procedures with faster recovery times.', icon: Award },
                    { defaultTitle: 'Cardiovascular Interventions', defaultDesc: 'Cath lab angioplasty, pacemaker installations, and cardiac rehab.', icon: HeartPulse },
                    { defaultTitle: 'Mother & Child Care (NICU)', defaultDesc: 'Comprehensive maternity suites and neonatal intensive care.', icon: Users },
                    { defaultTitle: 'Tele-Consultation & Home Visits', defaultDesc: 'Virtual doctor appointments and emergency home care visits.', icon: Video },
                  ];
                  const srv = defaultServices[idx % defaultServices.length];
                  const cardTitle = (sec.settings as any)?.[`serviceCard${id}Title`] || srv.defaultTitle;
                  const cardDesc = (sec.settings as any)?.[`serviceCard${id}Desc`] || srv.defaultDesc;
                  const IconComp = srv.icon;

                  return (
                    <div key={id} className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-md hover:border-teal-400 transition-all">
                      <IconComp className="w-8 h-8 text-teal-400 mb-4" />
                      <h3 className="font-bold text-base text-white mb-2">{cardTitle}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{cardDesc}</p>
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
        return <Testimonials3DCarousel key={sec.id} hospitalId={hospId} sec={sec} />;

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
                  <p className="text-xs text-slate-600">{(sec.settings as any)?.address || `${hospital.address}, ${hospital.city}, ${hospital.state}`}</p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 hover:border-teal-400 transition-all shadow-xs">
                  <PhoneCall className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                  <h4 className="font-bold text-slate-900 text-sm">{(sec.settings as any)?.contactCard2Title || 'Emergency & Reception'}</h4>
                  <p className="text-xs text-slate-600">{(sec.settings as any)?.phone || hospital.phone} • {(sec.settings as any)?.email || hospital.email}</p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 hover:border-teal-400 transition-all shadow-xs">
                  <Clock className="w-8 h-8 text-teal-600 mx-auto mb-1" />
                  <h4 className="font-bold text-slate-900 text-sm">{(sec.settings as any)?.contactCard3Title || 'Operating Hours'}</h4>
                  <p className="text-xs text-slate-600">{(sec.settings as any)?.hours || '24/7 Emergency & ICU • OPD: Mon-Sat 8:00 AM - 6:00 PM'}</p>
                </div>
              </div>
            </div>
          </section>
        );

      case 'footer':
        return (
          <footer key={sec.id} className="bg-white pt-10 pb-6 text-white font-sans w-full">
            {/* Rounded Top Container with Red/Crimson/Teal primary background */}
            <div className="w-full max-w-[98%] mx-auto px-2 sm:px-4">
              <div
                className="rounded-t-[2.5rem] p-10 sm:p-14 shadow-2xl relative overflow-hidden text-white"
                style={{
                  backgroundColor: website.primaryColor || '#dc2626',
                  backgroundImage: `linear-gradient(135deg, ${website.primaryColor || '#dc2626'}, ${website.secondaryColor || '#991b1b'})`
                }}
              >
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

                    <p className="text-xs text-white/90 leading-relaxed font-normal max-w-sm">
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
                      <li><a href="#about" className="hover:underline text-white/90">About Us</a></li>
                      <li><a href="#departments" className="hover:underline text-white/90">Services & Departments</a></li>
                      <li><a href="#doctors" className="hover:underline text-white/90">Medical Specialists</a></li>
                      <li><a href="#contact" className="hover:underline text-white/90">Contact & Operating Hours</a></li>
                      <li><Link to="/login" className="hover:underline text-white/90">Staff & Patient Login</Link></li>
                    </ul>
                  </div>

                  {/* Column 3: Contact & Hours */}
                  <div className="lg:col-span-3 space-y-4 text-xs font-medium">
                    <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">CONTACT & HOURS</h4>
                    <div className="space-y-3 text-white/90">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                        <span>{(sec.settings as any)?.address || `${hospital.address}, ${hospital.city}, ${hospital.state}`}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <PhoneCall className="w-4 h-4 shrink-0 text-white" />
                        <span>{(sec.settings as any)?.phone || hospital.phone}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 shrink-0 text-white" />
                        <span>{(sec.settings as any)?.hours || '08:00 AM – 08:00 PM (OPD) • 24/7 ICU'}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 shrink-0 text-white" />
                        <span>{(sec.settings as any)?.email || hospital.email}</span>
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
                      <div className="bg-white text-slate-900 px-3 py-2 rounded-xl font-serif text-center shadow-md font-bold tracking-widest text-xs uppercase">
                        {(sec.settings as any)?.poweredBy || 'HEALTHCORE'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Copyright Bar */}
              <div className="py-4 px-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-medium">
                <p>{(sec.settings as any)?.copyrightText || sec.subtitle || `© ${new Date().getFullYear()} ${hospital.name}. All rights reserved.`}</p>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                  <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
                  <span>•</span>
                  <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>
        );

      default:
        return null;
    }
  };

  // Dynamic Theme Palette Map
  const themeClassMap: Record<string, string> = {
    'Modern Teal': 'theme-modern-teal bg-white text-slate-900',
    'Deep Ocean': 'theme-deep-ocean bg-slate-950 text-slate-100',
    'Healthcare Classic': 'theme-classic bg-blue-50/40 text-slate-900',
    'Clean Minimal': 'theme-minimal bg-neutral-50 text-neutral-900 font-serif',
  };

  // Dynamic Template Map
  const templateClassMap: Record<string, string> = {
    'premium-healthcare': 'template-premium-healthcare',
    'modern-hospital': 'template-modern-hospital border-t-4 border-teal-600',
    'luxury-medical': 'template-luxury-medical font-serif tracking-wide',
  };

  const currentThemeClass = themeClassMap[website?.theme || 'Modern Teal'] || themeClassMap['Modern Teal'];
  const currentTemplateClass = templateClassMap[website?.templateId || 'premium-healthcare'] || templateClassMap['premium-healthcare'];

  return (
    <div
      className={`min-h-screen ${currentThemeClass} ${currentTemplateClass} transition-colors duration-300 font-sans selection:bg-teal-500 selection:text-white`}
      style={{ '--primary-accent': website?.primaryColor || '#0d9488' } as React.CSSProperties}
    >
      {/* Top Header Navigation */}
      <nav className="border-b border-slate-200 bg-white/95 sticky top-0 z-40 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
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
              <span className="font-extrabold text-xl text-slate-900 tracking-tight leading-tight">{hospital.name}</span>
              <span className="inline-block mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200/80 w-max">
                {hospital.type}
              </span>
            </div>
          </div>

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
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full text-xs shadow-md shadow-teal-600/20">
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
