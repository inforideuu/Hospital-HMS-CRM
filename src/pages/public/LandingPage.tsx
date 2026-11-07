import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Building2,
  Users,
  Ambulance,
  Play,
  ArrowRight,
  Crown,
  UserCheck,
  Headphones,
  LineChart,
  Server,
  Zap,
  Calendar,
  X,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { MockStorage } from '../../services/mockStorage';
import { useNotification } from '../../context/NotificationContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  // Demo Request Form Modal State
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    hospitalName: '',
    contactPerson: '',
    designation: 'Medical Director',
    email: '',
    phone: '',
    city: '',
    state: '',
    bedCapacity: '150 - 500 Beds',
    hospitalType: 'Multi-Specialty Hospital',
    preferredDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    preferredTime: '11:00 AM',
    message: '',
  });

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hospitalName.trim() || !formData.contactPerson.trim() || !formData.email.trim() || !formData.phone.trim()) {
      showToast('Required Fields Missing', 'Please fill in Hospital Name, Contact Person, Email and Phone Number.', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      MockStorage.createDemoRequest({
        hospitalName: formData.hospitalName.trim(),
        contactPerson: formData.contactPerson.trim(),
        designation: formData.designation,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim() || 'New Delhi',
        state: formData.state.trim() || 'Delhi',
        bedCapacity: formData.bedCapacity,
        hospitalType: formData.hospitalType,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        message: formData.message.trim(),
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
      showToast('Demo Request Scheduled', `Thank you! Demo request logged for ${formData.hospitalName}. Super Admin will review your application.`, 'success');
    }, 600);
  };

  const handleCloseModal = () => {
    setIsDemoModalOpen(false);
    setIsSubmitted(false);
    setFormData({
      hospitalName: '',
      contactPerson: '',
      designation: 'Medical Director',
      email: '',
      phone: '',
      city: '',
      state: '',
      bedCapacity: '150 - 500 Beds',
      hospitalType: 'Multi-Specialty Hospital',
      preferredDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      preferredTime: '11:00 AM',
      message: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-[#FF3030] selection:text-white font-sans">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-md shadow-slate-200/50">
              <img src="/logo.png" alt="Zenelait Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">Zenelait</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF3030]/10 text-[#FF3030] border border-[#FF3030]/25 font-semibold">
                HMS & CRM
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#" className="text-[#FF3030] font-semibold border-b-2 border-[#FF3030] pb-1">Home</a>
            <a href="#features" className="hover:text-[#FF3030] transition-colors">Features</a>
            <a href="#portals" className="hover:text-[#FF3030] transition-colors">Portals</a>
            <a href="#about" className="hover:text-[#FF3030] transition-colors">About</a>
            <a href="#contact" className="hover:text-[#FF3030] transition-colors">Contact</a>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/superadmin-login')}
              className="border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs px-4 py-2 rounded-full font-bold"
            >
              Super Admin Panel
            </Button>
            <Button
              variant="coral"
              style={{ backgroundColor: '#FF3030', borderColor: '#FF3030', color: '#ffffff' }}
              onClick={() => navigate('/select-hospital')}
              className="bg-[#FF3030] hover:bg-[#e62222] text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md shadow-[#FF3030]/25 border-none flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/hero_bg_banner_1790314222005.jpg')" }}>
        {/* White / Coral Overlay for High Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/60 backdrop-blur-[2px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[#FF3030] text-xs font-bold tracking-widest uppercase font-mono bg-[#FF3030]/10 px-3.5 py-1.5 rounded-full border border-[#FF3030]/30 inline-block shadow-sm">
                NEXT-GEN HEALTHCARE TECHNOLOGY
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold text-slate-900 tracking-tight leading-[1.15]">
                Unified Healthcare CRM & <br />
                <span className="bg-gradient-to-r from-[#FF3030] via-rose-600 to-[#221F1F] bg-clip-text text-transparent italic font-normal">
                  Hospital Management
                </span> <br />
                Operating System
              </h1>

              <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
                Streamline operations, enhance patient experiences, and connect your entire healthcare ecosystem — all in one powerful, secure and scalable platform.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button
                  variant="coral"
                  style={{ backgroundColor: '#FF3030', borderColor: '#FF3030', color: '#ffffff' }}
                  onClick={() => navigate('/select-hospital')}
                  className="bg-[#FF3030] hover:bg-[#e62222] text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-lg shadow-[#FF3030]/30 border-none flex items-center gap-2"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="px-6 py-3.5 rounded-full border-2 border-[#FF3030]/40 bg-white/95 hover:bg-red-50 text-slate-800 text-sm font-semibold flex items-center gap-2.5 transition-all shadow-sm hover:border-[#FF3030] hover:text-[#FF3030]"
                >
                  <Calendar className="w-4 h-4 text-[#FF3030]" />
                  Request Demo
                </button>
              </div>
            </div>

            {/* Right Side Glass Feature Badge */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="backdrop-blur-md bg-white/80 border border-[#FF3030]/30 rounded-3xl p-8 shadow-xl max-w-sm ml-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FF3030]/10 border border-[#FF3030]/25 text-[#FF3030] flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  Better Care Through Smarter Technology
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time clinical management, automated bed occupancy tracking, emergency ambulance fleet dispatching, and multi-tenant SaaS control.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#FF3030]">
                  <span>99.9% Uptime SLA</span> • <span>HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Stat Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-slate-200 pt-10">
            <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">500+</div>
                <div className="text-xs text-slate-500 font-medium">Hospitals & Clinics</div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">1M+</div>
                <div className="text-xs text-slate-500 font-medium">Patients Served</div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">99.9%</div>
                <div className="text-xs text-slate-500 font-medium">System Uptime</div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">24/7</div>
                <div className="text-xs text-slate-500 font-medium">Dedicated Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholder Portals Section */}
      <section id="portals" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[#FF3030] text-xs font-bold tracking-widest uppercase font-mono bg-[#FF3030]/10 px-3 py-1 rounded-full border border-[#FF3030]/25 inline-block">
              STAKEHOLDER PORTALS
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-slate-900">
              Tailored Portals for Every Stakeholder
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xl mx-auto">
              Different roles. Same goal — better healthcare. Our platform provides dedicated portals for each stakeholder, with the right tools, access and experience.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Super Admin */}
            <div
              onClick={() => navigate('/login')}
              className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden hover:border-[#FF3030] hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5">
                  <Crown className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Super Admin Portal</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Manage hospitals, monitor operations, configure settings and ensure seamless platform performance.
                </p>
                <span className="text-xs font-semibold text-[#FF3030] inline-flex items-center group-hover:translate-x-1 transition-transform">
                  Explore Portal <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <div className="h-36 bg-slate-100 overflow-hidden relative border-t border-slate-200">
                <img
                  src="/card_superadmin_1790313871998.jpg"
                  alt="Super Admin Command Dashboard"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Hospital HMS */}
            <div
              onClick={() => navigate('/login')}
              className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden hover:border-[#FF3030] hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-[#FF3030]/10 border border-[#FF3030]/25 text-[#FF3030] flex items-center justify-center mb-5">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Hospital HMS Portal</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Handle daily operations, staff management, appointments, records and clinical workflows — all in one place.
                </p>
                <span className="text-xs font-semibold text-[#FF3030] inline-flex items-center group-hover:translate-x-1 transition-transform">
                  Explore Portal <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <div className="h-36 bg-slate-100 overflow-hidden relative border-t border-slate-200">
                <img
                  src="/card_hospital_hms_1790313910509.jpg"
                  alt="Hospital Reception HMS System"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Patient Portal */}
            <div
              onClick={() => navigate('/login')}
              className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden hover:border-[#FF3030] hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-5">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Patient Health Portal</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Book appointments, view records, consult with doctors and manage your health, anytime, anywhere.
                </p>
                <span className="text-xs font-semibold text-[#FF3030] inline-flex items-center group-hover:translate-x-1 transition-transform">
                  Explore Portal <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <div className="h-36 bg-slate-100 overflow-hidden relative border-t border-slate-200">
                <img
                  src="/card_patient_portal_1790313954717.jpg"
                  alt="Patient Mobile App Screen"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Ambulance Dispatch */}
            <div
              onClick={() => navigate('/login')}
              className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden hover:border-[#FF3030] hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5">
                  <Ambulance className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Ambulance Fleet Portal</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Track vehicles, manage dispatches, monitor live location and ensure faster, safer emergency response.
                </p>
                <span className="text-xs font-semibold text-[#FF3030] inline-flex items-center group-hover:translate-x-1 transition-transform">
                  Explore Portal <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <div className="h-36 bg-slate-100 overflow-hidden relative border-t border-slate-200">
                <img
                  src="/card_ambulance_fleet_1790314007471.jpg"
                  alt="Emergency Ambulance Dispatch"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Showcase / Tools Section */}
      <section id="features" className="py-24 relative overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[#FF3030] text-xs font-bold tracking-widest uppercase font-mono bg-[#FF3030]/10 px-3 py-1 rounded-full border border-[#FF3030]/25 inline-block">
                PLATFORM SHOWCASE
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-slate-900 leading-tight">
                Powerful Tools for <br />
                <span className="bg-gradient-to-r from-[#FF3030] to-rose-600 bg-clip-text text-transparent">
                  Smarter Healthcare
                </span>
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Our integrated platform brings together advanced technology, real-time data and intelligent automation to help hospitals deliver better care and operate more efficiently.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Real-time Insights & Analytics</h4>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Seamless Department Integration</h4>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Secure & Compliant (HIPAA Ready)</h4>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Scalable for Growing Healthcare Networks</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Light Laptop Mockup */}
            <div className="lg:col-span-7 relative">
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white p-2">
                <img
                  src="/light_laptop_mockup_1790313469157.jpg"
                  alt="Laptop Light UI Showcase"
                  className="w-full h-auto rounded-2xl object-cover"
                />

                <div className="absolute top-6 right-6 backdrop-blur-md bg-white/95 border border-[#FF3030]/30 rounded-2xl p-4 max-w-[200px] shadow-xl text-center">
                  <div className="w-8 h-8 rounded-full bg-[#FF3030]/10 text-[#FF3030] flex items-center justify-center mx-auto mb-2">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">Smarter Data<br />Better Decisions<br />Healthier Tomorrows</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 relative bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden border border-[#FF3030]/30 bg-gradient-to-r from-red-50/70 via-rose-50/50 to-red-50/70 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[#FF3030] text-xs font-bold tracking-widest uppercase font-mono">
                READY TO TRANSFORM YOUR HEALTHCARE OPERATIONS?
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                Experience the Future of Hospital Management
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm max-w-xl">
                Join hundreds of hospitals already using our platform to deliver better care, improve efficiency and drive growth.
              </p>
            </div>

            <Button
              variant="coral"
              style={{ backgroundColor: '#FF3030', borderColor: '#FF3030', color: '#ffffff' }}
              onClick={() => navigate('/login')}
              className="bg-[#FF3030] hover:bg-[#e62222] text-white font-bold text-sm px-8 py-4 rounded-full shadow-lg shadow-[#FF3030]/25 border-none flex-shrink-0 flex items-center gap-2"
            >
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 text-slate-500 text-xs bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="Zenelait Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base">Zenelait</span>
              <span className="ml-1 text-[10px] text-slate-500 font-semibold">HMS & CRM</span>
              <div className="text-[11px] text-slate-500">Smarter Systems. Healthier Communities.</div>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-slate-600 text-xs">
            <a href="#" className="hover:text-[#FF3030] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#FF3030] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#FF3030] transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {/* Demo Request Modal */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {isSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Demo Request Submitted!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-slate-900">{formData.contactPerson}</strong>! Your demo request for <strong className="text-slate-900">{formData.hospitalName}</strong> has been transmitted directly to our Super Admin and Executive Platform Managers.
                </p>
                <div className="p-4 bg-slate-50 rounded-xl max-w-md mx-auto border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Date:</span>
                    <span className="font-semibold text-slate-900">{formData.preferredDate} at {formData.preferredTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Email:</span>
                    <span className="font-semibold text-slate-900">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-semibold text-slate-900">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Platform:</span>
                    <span className="font-semibold text-[#FF3030]">Zenelait Platform HQ</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Button
                    variant="coral"
                    style={{ backgroundColor: '#FF3030', borderColor: '#FF3030', color: '#ffffff' }}
                    onClick={handleCloseModal}
                    className="px-8 py-2.5 rounded-full font-bold shadow-md shadow-[#FF3030]/20"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FF3030]/10 border border-[#FF3030]/20 text-[#FF3030] flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Schedule a Live Product Demo</h3>
                    <p className="text-xs text-slate-500">Experience Zenelait HMS & CRM tailored for your clinical facility</p>
                  </div>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hospital / Healthcare Facility Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apollo Memorial Hospital"
                        value={formData.hospitalName}
                        onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Facility Classification
                      </label>
                      <select
                        value={formData.hospitalType}
                        onChange={(e) => setFormData({ ...formData, hospitalType: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                      >
                        <option value="Multi-Specialty Hospital">Multi-Specialty Hospital</option>
                        <option value="Super-Specialty Hospital">Super-Specialty Hospital</option>
                        <option value="General Hospital">General Hospital</option>
                        <option value="Clinic & Ambulatory Network">Clinic & Ambulatory Network</option>
                        <option value="Diagnostic & Lab Center">Diagnostic & Lab Center</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Person Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Rajesh Sharma"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Professional Designation
                      </label>
                      <select
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                      >
                        <option value="Medical Director">Medical Director</option>
                        <option value="Chief Medical Officer (CMO)">Chief Medical Officer (CMO)</option>
                        <option value="Hospital Administrator / COO">Hospital Administrator / COO</option>
                        <option value="Managing Director / Owner">Managing Director / Owner</option>
                        <option value="Head of Clinical IT">Head of Clinical IT</option>
                        <option value="Senior Consultant / HOD">Senior Consultant / HOD</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Official Work Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="doctor@hospital.org"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Direct Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Bed Capacity
                      </label>
                      <select
                        value={formData.bedCapacity}
                        onChange={(e) => setFormData({ ...formData, bedCapacity: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                      >
                        <option value="1 - 50 Beds">1 - 50 Beds</option>
                        <option value="50 - 150 Beds">50 - 150 Beds</option>
                        <option value="150 - 500 Beds">150 - 500 Beds</option>
                        <option value="500+ Beds (Enterprise)">500+ Beds (Enterprise)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maharashtra"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preferred Demo Date
                      </label>
                      <input
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preferred Time Slot
                      </label>
                      <select
                        value={formData.preferredTime}
                        onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                      >
                        <option value="10:00 AM">10:00 AM (Morning)</option>
                        <option value="11:30 AM">11:30 AM (Mid-Day)</option>
                        <option value="02:00 PM">02:00 PM (Afternoon)</option>
                        <option value="04:00 PM">04:00 PM (Evening)</option>
                        <option value="05:30 PM">05:30 PM (End of Day)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Key Modules of Interest or Specific Requirements
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Interested in multi-branch patient records, OPD token displays, and ambulance fleet tracking..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3030]/30 focus:border-[#FF3030] transition-all"
                    />
                  </div>

                  <div className="p-3 bg-red-50/60 border border-[#FF3030]/20 rounded-xl text-[11px] text-slate-700 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF3030] mt-0.5 shrink-0" />
                    <span>
                      Your request will be routed directly to the <strong>Super Admin & Manager Dashboard</strong> for review and calendar booking.
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      variant="coral"
                      style={{ backgroundColor: '#FF3030', borderColor: '#FF3030', color: '#ffffff' }}
                      className="px-7 py-2.5 rounded-full text-xs font-bold shadow-md shadow-[#FF3030]/25 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          Submit Demo Request <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
