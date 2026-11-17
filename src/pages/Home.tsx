import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Brain, Droplets } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="dia-home-hero relative py-14 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 lg:gap-16">
            <div className="space-y-6">
              <p className="dia-eyebrow">Care, connected / DiaFit</p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                Take Control of Your Diabetes Journey
              </h1>
              <p className="max-w-xl text-lg text-white/75 sm:text-xl">
                DiaFit helps you manage your diabetes with personalized tracking,
                exercise routines, and diet planning.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="inline-block rounded-md bg-[var(--dia-lime)] px-6 py-3 font-bold text-[var(--dia-ink)] transition-colors hover:bg-white"
                >
                  Get Started
                </Link>
                <Link
                  to="/about-us"
                  className="inline-block rounded-md border border-white/35 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80"
                alt="Health Monitoring"
                className="aspect-[4/3] w-full rounded-lg border border-white/15 object-cover shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="dia-workspace py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="dia-eyebrow text-center" style={{ color: 'var(--dia-green)' }}>The daily rhythm</p>
          <h2 className="mb-10 mt-2 text-center text-3xl font-semibold">
            Comprehensive Diabetes Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Activity}
              title="Exercise Tracking"
              description="Access curated workout videos tailored for diabetes management"
            />
            <FeatureCard
              icon={Heart}
              title="Health Monitoring"
              description="Track your vital health metrics and see your progress"
            />
            <FeatureCard
              icon={Brain}
              title="Diet Planning"
              description="Create and manage your weekly meal plans with nutritional info"
            />
            <FeatureCard
              icon={Droplets}
              title="Water Tracking"
              description="Monitor your daily water intake with smart reminders"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-[var(--dia-line)] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-5 text-3xl font-semibold">
            Ready to Start Your Journey?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Join thousands of users who have taken control of their diabetes with DiaFit
          </p>
          <Link
            to="/signup"
            className="dia-primary-button inline-block px-6 py-3"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => {
  return (
    <div className="rounded-lg border border-[var(--dia-line)] bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-[#e6f2ec] text-[var(--dia-green)]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-[var(--dia-ink)]">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Home;