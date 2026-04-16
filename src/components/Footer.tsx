import React from 'react';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-2xl font-bold">DiaFit</span>
            </div>
            <p className="text-gray-400">
              Your comprehensive diabetes management companion for a healthier lifestyle.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/exercise-videos" className="text-gray-400 hover:text-white">
                  Exercise Videos
                </Link>
              </li>
              <li>
                <Link to="/diet-planner" className="text-gray-400 hover:text-white">
                  Diet Planner
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="text-gray-400 hover:text-white">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">Water Tracking</li>
              <li className="text-gray-400">Exercise Videos</li>
              <li className="text-gray-400">Diet Planning</li>
              <li className="text-gray-400">Progress Reports</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-400">
                <Mail className="h-5 w-5 mr-2" />
                support@diafit.com
              </li>
              <li className="flex items-center text-gray-400">
                <Phone className="h-5 w-5 mr-2" />
                +91 955-123-4567
              </li>
              <li className="flex items-center text-gray-400">
                <MapPin className="h-5 w-5 mr-2" />
                123 Health Street, St Joseph's Univrersity
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} DiaFit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;