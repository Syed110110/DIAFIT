import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Brain, Droplets } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl font-bold leading-tight">
                Take Control of Your Diabetes Journey
              </h1>
              <p className="text-xl text-blue-100">
                DiaFit helps you manage your diabetes with personalized tracking,
                exercise routines, and diet planning.
              </p>
              <div className="space-x-4">
                <Link
                  to="/signup"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  to="/about-us"
                  className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80"
                alt="Health Monitoring"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who have taken control of their diabetes with DiaFit
          </p>
          <Link
            to="/signup"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Home;