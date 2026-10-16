import React from 'react';
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
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { HospitalWebsite, WebsiteSection, Doctor, Department } from '../../types';
import { Button } from '../../components/ui/Button';

interface HospitalPublicWebsiteProps {
  hospitalId?: string;
  customSections?: WebsiteSection[];
}

export const HospitalPublicWebsite: React.FC<HospitalPublicWebsiteProps> = ({
  hospitalId: propHospitalId,
  customSections,
}) => {
  const { hospitalSlug } = useParams<{ hospitalSlug?: string }>();

  // Tenant Resolution Layer: Resolve hospital by ID, slug, or subdomain
  const targetIdentifier = propHospitalId || hospitalSlug || 'HOSP-001';
  let website = MockStorage.getWebsiteByDomainOrSlug(targetIdentifier);
  
  if (!website && propHospitalId) {
    website = MockStorage.getWebsiteByHospitalId(propHospitalId);
  }

  const hospId = website?.hospitalId || 'HOSP-001';
  const hospital = MockStorage.getHospitalById(hospId);
  const doctors: Doctor[] = MockStorage.getDoctors(hospId).filter((d) => d.status === 'active');
  const departments: Department[] = MockStorage.getDepartments(hospId).filter((d) => d.status === 'active');

  const rawSections = customSections || MockStorage.getWebsiteSections(hospId);
  const sections = rawSections
    .filter((s) => s.isEnabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);

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
                    <div className="text-2xl font-bold text-slate-900">{hospital.totalBeds}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Beds Capacity</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-teal-600">{hospital.totalDoctors}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Specialists</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">{departments.length}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Departments</div>
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
                <span className="text-xs font-bold text-teal-700 uppercase tracking-widest font-mono">FACULTIES & UNITS</span>
                <h2 className="text-3xl font-bold text-slate-900">{sec.title}</h2>
                <p className="text-slate-600 text-sm">{sec.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {departments.map((dept) => (
                  <div key={dept.id} className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-400 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-4">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mb-1">{dept.name}</h3>
                    <p className="text-xs text-slate-500 mb-3">{dept.description}</p>
                    <div className="text-[11px] font-semibold text-slate-600 border-t border-slate-100 pt-3 flex justify-between">
                      <span>Head: {dept.headDoctorName}</span>
                      <span className="text-teal-600 font-mono">{dept.doctorCount} Doctors</span>
                    </div>
                  </div>
                ))}
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
                      <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
                        <Activity className="w-6 h-6" />
                      </div>
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

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Header Navigation */}
      <nav className="border-b border-slate-200 bg-white/95 sticky top-0 z-40 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-md shadow-teal-600/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">{hospital.name}</span>
              <span className="ml-2 text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200">
                {hospital.type}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-700">
            <a href="#hero" className="hover:text-teal-600 transition-colors">Home</a>
            <a href="#about" className="hover:text-teal-600 transition-colors">About</a>
            <a href="#departments" className="hover:text-teal-600 transition-colors">Departments</a>
            <a href="#doctors" className="hover:text-teal-600 transition-colors">Doctors</a>
            <a href="#contact" className="hover:text-teal-600 transition-colors">Contact</a>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/login">
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
