import { Link } from 'react-router-dom';
import { Map, Shield, Globe, Lock, FileCheck, Users } from 'lucide-react';
import { Button } from '../ui/button';
<<<<<<< Updated upstream
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../context/AuthContext';

export function Landing() {
  const { isAuthenticated, isAdmin } = useAuth();
  const homePath = isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/login';
=======
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../context/useAuth';

export function Landing() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';
>>>>>>> Stashed changes
  const features = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Immutable records secured on distributed ledger technology'
    },
    {
      icon: Map,
      title: 'GIS Integration',
      description: 'Accurate geospatial data for precise land parcel identification'
    },
    {
      icon: Lock,
      title: 'Tamper-Proof',
      description: 'Document verification with cryptographic hash validation'
    },
    {
      icon: Globe,
      title: 'Cloud-Based',
      description: 'Accessible anywhere with enterprise-grade infrastructure'
    },
    {
      icon: FileCheck,
      title: 'Digital Records',
      description: 'Paperless workflow with secure document management'
    },
    {
      icon: Users,
      title: 'Multi-Party',
      description: 'Transparent ownership transfers with verified stakeholders'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0F766E] rounded-lg flex items-center justify-center">
                <Map className="w-6 h-6 text-white" />
              </div>
              <span className="font-semibold text-[#0F172A]">GeoLedger</span>
            </div>
<<<<<<< Updated upstream
            <div className="flex items-center gap-2">
              <Link to="/admin/login">
                <Button variant="outline" className="border-[#E2E8F0]">Admin</Button>
              </Link>
              <Link to={homePath}>
                <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90">
                  {isAuthenticated ? 'Open Dashboard' : 'User Login'}
                </Button>
              </Link>
            </div>
=======
            <Link to={user ? dashboardPath : '/login'}>
              <Button className="bg-[#0F766E] hover:bg-[#0F766E]/90">
                {user ? user.name : 'User sign in'}
              </Button>
            </Link>
>>>>>>> Stashed changes
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-semibold text-[#0F172A] mb-6">
              Secure Land Registration on Blockchain
            </h1>
            <p className="text-lg text-[#64748B] mb-8">
              GeoLedger combines GIS mapping, cloud infrastructure, and blockchain technology
              to create a transparent, tamper-proof land registry system for modern governance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
<<<<<<< Updated upstream
              <Link to={homePath}>
                <Button size="lg" className="bg-[#0F766E] hover:bg-[#0F766E]/90 w-full sm:w-auto">
                  {isAuthenticated ? 'Open Dashboard' : 'Citizen Login'}
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#E2E8F0]">
                  Admin / Registrar
                </Button>
              </Link>
              <Link to="/public/verify/SN-DEMO-001">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#E2E8F0]">
                  Public Verify Demo
=======
              <Link to={user ? dashboardPath : '/login'}>
                <Button size="lg" className="bg-[#0F766E] hover:bg-[#0F766E]/90 w-full sm:w-auto">
                  {user ? 'Open dashboard' : 'Create user account'}
>>>>>>> Stashed changes
                </Button>
              </Link>
              <Link to="/search">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Search Properties
                </Button>
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-[#64748B]">Registrar? <Link to="/admin/login" className="text-[#0F766E] underline">Admin sign in</Link></p>

          <div className="relative">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#E2E8F0]">
              <div className="aspect-video bg-gradient-to-br from-[#0F766E] to-[#38BDF8] rounded-xl flex items-center justify-center">
                <Map className="w-24 h-24 text-white/30" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] rounded-lg p-4">
                  <p className="text-2xl font-semibold text-[#0F172A]">50K+</p>
                  <p className="text-sm text-[#64748B]">Properties</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-lg p-4">
                  <p className="text-2xl font-semibold text-[#0F172A]">99.9%</p>
                  <p className="text-sm text-[#64748B]">Accuracy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-[#0F172A] mb-4">
              Why Choose GeoLedger?
            </h2>
            <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
              A comprehensive platform designed for government agencies, surveyors, and citizens
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-[#E2E8F0]">
                  <CardHeader>
                    <div className="w-12 h-12 bg-[#0F766E]/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#0F766E]" />
                    </div>
                    <CardTitle className="text-[#0F172A]">{feature.title}</CardTitle>
                    <CardDescription className="text-[#64748B]">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-[#0F172A] mb-4">
            How It Works
          </h2>
          <p className="text-lg text-[#64748B]">
            Simple, secure, and transparent process
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Sign In', desc: 'Log in as a citizen or registrar with your GeoLedger account' },
            { step: '02', title: 'Search or Register', desc: 'Find existing properties or register new land parcels' },
            { step: '03', title: 'Verify & Transfer', desc: 'Complete secure ownership transfers on blockchain' }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-[#0F766E] text-white rounded-full flex items-center justify-center text-2xl font-semibold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-[#0F172A] mb-2">{item.title}</h3>
              <p className="text-[#64748B]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#0F766E] rounded-lg flex items-center justify-center">
                  <Map className="w-6 h-6" />
                </div>
                <span className="font-semibold">GeoLedger</span>
              </div>
              <p className="text-[#64748B] text-sm">
                Blockchain-based land registration system combining GIS, cloud infrastructure,
                and distributed ledger technology for secure land governance.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li>Dashboard</li>
                <li>Search Properties</li>
                <li>Register Land</li>
                <li>Verify Documents</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li>Documentation</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#334155] mt-8 pt-8 text-center text-sm text-[#64748B]">
            © 2026 GeoLedger. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
