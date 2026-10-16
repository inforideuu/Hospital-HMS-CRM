import React from 'react';
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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-teal-500 selection:text-white font-sans">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">HealthCore</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                HMS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#" className="text-teal-600 font-semibold border-b-2 border-teal-600 pb-1">Home</a>
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#portals" className="hover:text-teal-600 transition-colors">Portals</a>
            <a href="#about" className="hover:text-teal-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-teal-600 transition-colors">Contact</a>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs px-4 py-2 rounded-full"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/hero_bg_banner_1790314222005.jpg')" }}>
        {/* White / Teal Overlay for High Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/60 backdrop-blur-[2px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-teal-700 text-xs font-bold tracking-widest uppercase font-mono bg-teal-100/90 px-3.5 py-1.5 rounded-full border border-teal-200/90 inline-block shadow-sm">
                NEXT-GEN HEALTHCARE TECHNOLOGY
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold text-slate-900 tracking-tight leading-[1.15]">
                Unified Healthcare CRM & <br />
                <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-700 bg-clip-text text-transparent italic font-normal">
                  Hospital Management
                </span> <br />
                Operating System
              </h1>

              <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
                Streamline operations, enhance patient experiences, and connect your entire healthcare ecosystem — all in one powerful, secure and scalable platform.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-lg shadow-teal-600/25 flex items-center gap-2"
                >
                  Explore Platform <ArrowRight className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 rounded-full border border-slate-300 bg-white/90 hover:bg-white text-slate-700 text-sm font-semibold flex items-center gap-2.5 transition-colors shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center border border-teal-200">
                    <Play className="w-3 h-3 text-teal-600 fill-teal-600 ml-0.5" />
                  </div>
                  Watch Overview
                </button>
              </div>
            </div>

            {/* Right Side Glass Feature Badge */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="backdrop-blur-md bg-white/80 border border-teal-200/90 rounded-3xl p-8 shadow-xl max-w-sm ml-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  Better Care Through Smarter Technology
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time clinical management, automated bed occupancy tracking, emergency ambulance fleet dispatching, and multi-tenant SaaS control.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-teal-700">
                  <span>99.9% Uptime SLA</span> • <span>HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Stat Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-slate-200 pt-10">
            <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">500+</div>
                <div className="text-xs text-slate-500 font-medium">Hospitals & Clinics</div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">1M+</div>
                <div className="text-xs text-slate-500 font-medium">Patients Served</div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">99.9%</div>
                <div className="text-xs text-slate-500 font-medium">System Uptime</div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
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
            <span className="text-teal-700 text-xs font-bold tracking-widest uppercase font-mono bg-teal-50 px-3 py-1 rounded-full border border-teal-200 inline-block">
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
              className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden hover:border-teal-500 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5">
                  <Crown className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Super Admin Portal</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Manage hospitals, monitor operations, configure settings and ensure seamless platform performance.
                </p>
                <span className="text-xs font-semibold text-teal-600 inline-flex items-center group-hover:translate-x-1 transition-transform">
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
              className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden hover:border-teal-500 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mb-5">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Hospital HMS Portal</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Handle daily operations, staff management, appointments, records and clinical workflows — all in one place.
                </p>
                <span className="text-xs font-semibold text-teal-600 inline-flex items-center group-hover:translate-x-1 transition-transform">
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
              className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden hover:border-teal-500 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-5">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Patient Health Portal</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Book appointments, view records, consult with doctors and manage your health, anytime, anywhere.
                </p>
                <span className="text-xs font-semibold text-teal-600 inline-flex items-center group-hover:translate-x-1 transition-transform">
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
              className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden hover:border-teal-500 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5">
                  <Ambulance className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Ambulance Fleet Portal</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Track vehicles, manage dispatches, monitor live location and ensure faster, safer emergency response.
                </p>
                <span className="text-xs font-semibold text-teal-600 inline-flex items-center group-hover:translate-x-1 transition-transform">
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
              <span className="text-teal-700 text-xs font-bold tracking-widest uppercase font-mono bg-teal-100/80 px-3 py-1 rounded-full border border-teal-200 inline-block">
                PLATFORM SHOWCASE
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-slate-900 leading-tight">
                Powerful Tools for <br />
                <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Smarter Healthcare
                </span>
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Our integrated platform brings together advanced technology, real-time data and intelligent automation to help hospitals deliver better care and operate more efficiently.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Real-time Insights & Analytics</h4>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Seamless Department Integration</h4>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Secure & Compliant (HIPAA Ready)</h4>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
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

                <div className="absolute top-6 right-6 backdrop-blur-md bg-white/95 border border-teal-200 rounded-2xl p-4 max-w-[200px] shadow-xl text-center">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
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
          <div className="relative rounded-3xl overflow-hidden border border-teal-200 bg-gradient-to-r from-teal-50 via-sky-50 to-teal-50 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-teal-700 text-xs font-bold tracking-widest uppercase font-mono">
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
              onClick={() => navigate('/login')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-8 py-4 rounded-full shadow-lg shadow-teal-600/20 flex-shrink-0 flex items-center gap-2"
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base">HealthCore</span>
              <span className="ml-1 text-[10px] text-slate-500">HMS</span>
              <div className="text-[11px] text-slate-500">Smarter Systems. Healthier Communities.</div>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-slate-600 text-xs">
            <a href="#" className="hover:text-teal-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-teal-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-teal-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
