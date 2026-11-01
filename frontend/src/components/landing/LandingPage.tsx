import React, { useState } from 'react';
import { BloodDrop3D } from '../common/BloodDrop3D';
import { EmergencyRadar } from '../radar/EmergencyRadar';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodGroup, UserRole } from '../../types';
import {
  Heart,
  Radio,
  Building2,
  Warehouse,
  Users,
  ShieldCheck,
  Activity,
  ArrowRight,
  Droplet,
  CheckCircle2,
  Calendar,
  Layers,
  Phone,
  KeyRound,
  UserPlus,
  X,
  Mail,
} from 'lucide-react';

interface LandingPageProps {
  onEnterPlatform: (role?: string) => void;
  onRequestBloodClick: () => void;
  onDonateBloodClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPlatform,
  onRequestBloodClick,
  onDonateBloodClick,
}) => {
  const {
    users,
    hospitals,
    bloodBanks,
    requests,
    registerUser,
    login,
  } = useLifeDrop();

  // User Login / Register State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [donorPhone, setDonorPhone] = useState('');
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>('O+');
  const [regCity, setRegCity] = useState('Guntur');

  const sampleRequest = requests[0] || {
    id: 'LD1025',
    hospitalName: 'St. Jude Memorial Hospital',
    patientName: 'Emergency Trauma Ward',
    bloodGroup: 'O+',
    requiredUnits: 2,
    confirmedUnits: 0,
    allocatedUnits: 1,
    remainingUnits: 1,
    status: 'SEARCHING',
    emergencyLevel: 'CRITICAL',
    donorContributions: [],
    bloodBankContributions: [],
  };

  const totalDonations = users.reduce((sum, u) => sum + u.totalDonations, 0);

  // Handle Generate OTP
  const handleGenerateOtp = () => {
    if (!donorPhone.trim()) {
      alert('Please enter your email or mobile number.');
      return;
    }
    setIsGeneratingOtp(true);
    setTimeout(() => {
      setIsGeneratingOtp(false);
      setOtpGenerated(true);
      setOtpCode('123456');
    }, 400);
  };

  // Handle Sign In Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorPhone.trim()) {
      alert('Please enter your email or mobile number.');
      return;
    }
    const res = await login(donorPhone, 'LifeDrop@2026!', 'USER');
    if (res.success) {
      onEnterPlatform('USER');
    } else {
      alert(res.message || 'Login failed. Please verify your credentials.');
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    alert('Google Single Sign-On (SSO) integration is coming soon. Please sign in using your registered mobile number or email.');
  };

  // Handle Donor Registration
  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      alert('Please fill in your name and contact number.');
      return;
    }
    const res = await registerUser({
      name: regName.trim(),
      phone: regPhone.trim(),
      bloodGroup: regBloodGroup,
      city: regCity.trim(),
    });
    if (res.success) {
      onEnterPlatform('USER');
    } else {
      alert(res.message || 'Registration failed');
    }
  };

  return (
    <div className="space-y-20 pb-24">
      {/* 1. HERO SECTION WITH LIFEDROP BLOOD DESIGN & USER LOGIN BOX */}
      <section className="relative pt-6 pb-12 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-lifedrop-primary text-xs font-extrabold tracking-wide uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-lifedrop-emergency animate-ping" />
            Next-Gen Blood Coordination Platform
          </div>

          {/* 3D Blood Drop Hero Center */}
          <div className="flex justify-center my-3">
            <BloodDrop3D size="xl" showPulse={true} interactive={true} />
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-lifedrop-navy leading-tight">
              Every Drop <span className="text-lifedrop-primary">Saves a Life</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Connecting patients, donors, hospitals, and blood banks when every second matters. Real-time emergency radar, smart allocation, and verified donation tracking.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* MAIN USER / DONOR LOGIN CARD (MATCHING USER REFERENCE UI) */}
          {/* ========================================================================= */}
          <div className="mt-8 max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 text-left card-3d-interactive space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">User Portal Login</h2>
              <p className="text-xs text-slate-500 mt-1">Enter your credentials to access your account.</p>
            </div>

            {authMode === 'LOGIN' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email or Mobile Number Field with Generate OTP button */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email or Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="you@example.com or +1 (555) 019-2834"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateOtp}
                      disabled={isGeneratingOtp}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold whitespace-nowrap transition-colors"
                    >
                      {isGeneratingOtp ? 'Sending...' : otpGenerated ? 'Resend OTP' : 'Generate OTP'}
                    </button>
                  </div>
                </div>

                {/* OTP Fill Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter OTP
                    </label>
                    {otpGenerated && (
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        OTP sent! Use <strong>123456</strong>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono tracking-widest font-bold focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Must be 6 digits.</p>
                </div>

                {/* Primary Black Sign In Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Sign in
                </button>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Continue with Google
                </button>

                {/* Footer Switcher */}
                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500 font-medium">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('REGISTER')}
                      className="font-bold text-slate-900 hover:underline"
                    >
                      Create new account
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* Donor Registration Form */
              <form onSubmit={handleRegisterDonor} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={regBloodGroup}
                      onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      required
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="Metropolis"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email or Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="you@example.com or +1 (555) 019-2834"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Register as Blood Donor & Enter
                </button>

                <div className="text-center pt-1">
                  <p className="text-xs text-slate-500 font-medium">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('LOGIN')}
                      className="font-bold text-slate-900 hover:underline"
                    >
                      Sign in with existing account
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* ========================================================================= */}
          {/* INSTITUTIONAL LOGIN OPTIONS BOX (HOSPITAL, BLOOD BANK, ADMIN BUTTONS) */}
          {/* Matches User Image: [ Enter as Hospital ] [ Enter as Blood Bank ] [ Enter as Admin ] */}
          {/* ========================================================================= */}
          <div className="mt-8 max-w-xl mx-auto p-6 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 space-y-4 text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Healthcare Institution & Governance Portals
              </span>
              <p className="text-xs text-slate-300">
                Are you a verified hospital coordinator, blood bank officer, or platform administrator?
              </p>
            </div>

            {/* The 3 Image-Matched Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onEnterPlatform('HOSPITAL')}
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl hover:shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 border border-blue-400/30 flex-1 min-w-[150px] justify-center cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                Enter as Hospital
              </button>

              <button
                type="button"
                onClick={() => onEnterPlatform('BLOOD_BANK')}
                className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-xl hover:shadow-amber-600/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 border border-amber-400/30 flex-1 min-w-[150px] justify-center cursor-pointer"
              >
                <Warehouse className="w-4 h-4" />
                Enter as Blood Bank
              </button>

              <button
                type="button"
                onClick={() => onEnterPlatform('ADMIN')}
                className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-xl hover:shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 border border-purple-400/30 flex-1 min-w-[150px] justify-center cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Enter as Admin
              </button>
            </div>
          </div>

          {/* 4 Floating 3D Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-12">
            <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md card-3d-interactive text-left">
              <div className="text-3xl font-black text-lifedrop-navy">{users.length * 120}+</div>
              <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Registered Donors
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md card-3d-interactive text-left">
              <div className="text-3xl font-black text-blue-700">{hospitals.length}+</div>
              <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Verified Hospitals
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md card-3d-interactive text-left">
              <div className="text-3xl font-black text-amber-700">{bloodBanks.length}+</div>
              <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Verified Blood Banks
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md card-3d-interactive text-left">
              <div className="text-3xl font-black text-emerald-700">{totalDonations * 45}+</div>
              <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Lives Supported
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EMERGENCY RADAR PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-lifedrop-primary text-xs font-extrabold uppercase tracking-wider border border-rose-200">
            <Radio className="w-3.5 h-3.5" />
            Signature Technology
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-lifedrop-navy">
            Real-Time Emergency Radar
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Live scanning connects hospitals directly with compatible donors and blood banks within seconds.
          </p>
        </div>

        <EmergencyRadar request={sampleRequest as any} />
      </section>

      {/* 3. HOW LIFEDROP WORKS: 6-STEP CONNECTED TIMELINE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider border border-blue-200">
            <Activity className="w-3.5 h-3.5" />
            Coordinated Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-lifedrop-navy">
            How LifeDrop Works
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            A continuous coordination loop ensuring zero over-allocation and rapid emergency fulfillment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Raise Request',
              desc: 'Hospital or patient issues an emergency request specifying patient details, blood group, and required units.',
              icon: Radio,
              color: 'text-rose-600 bg-rose-50',
            },
            {
              step: '02',
              title: 'Search Blood Banks',
              desc: 'The system instantly scans inventories of verified blood banks in proximity and locks temporary reserves.',
              icon: Warehouse,
              color: 'text-amber-600 bg-amber-50',
            },
            {
              step: '03',
              title: 'Find Compatible Donors',
              desc: 'Nearby eligible donors matching red-cell compatibility receive high-priority In-App and SMS dispatches.',
              icon: Users,
              color: 'text-purple-600 bg-purple-50',
            },
            {
              step: '04',
              title: 'Coordinate with Hospital',
              desc: 'Donors and blood banks accept commitments. Hospital monitors incoming supplies and ETA en route.',
              icon: Building2,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              step: '05',
              title: 'Confirm Donation',
              desc: 'On arrival, hospital verifies donor by ID, receives blood units, and confirms donation on-site.',
              icon: CheckCircle2,
              color: 'text-emerald-600 bg-emerald-50',
            },
            {
              step: '06',
              title: 'Fulfill Request',
              desc: 'When remaining units hit 0, search stops, donor 90-day cycles update, and records are permanently audited.',
              icon: ShieldCheck,
              color: 'text-lifedrop-navy bg-slate-100',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 card-3d-interactive space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xl font-black text-slate-300">{item.step}</span>
                </div>
                <h3 className="text-base font-extrabold text-lifedrop-navy">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PLATFORM CAPABILITIES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-lifedrop-navy">
            Platform Capabilities Built for High-Stakes Healthcare
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm card-3d-interactive space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-lifedrop-primary flex items-center justify-center">
              <Droplet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-lifedrop-navy">Smart Donor Matching</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Calculates red-cell compatibility, 90-day safety eligibility cycles, and road distances to reach optimal responders.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm card-3d-interactive space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-lifedrop-navy">Strict Allocation Engine</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Guarantees allocated units never exceed requirements, automatically releasing excess commitments.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm card-3d-interactive space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-lifedrop-navy">10 km Campaigns Geo-Radius</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Blood drive registration campaigns targeted specifically to community donors located within travel range.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
