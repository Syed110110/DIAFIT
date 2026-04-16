import React from 'react';
import { Activity, Heart, Award } from 'lucide-react';

const AboutUs = () => {
  const team = [
    {
      name: "Rimsha",
      role: "Founder & CEO",
      image: "https://media.istockphoto.com/id/1496613385/photo/smiling-confident-latin-woman-looking-at-camera.jpg?s=612x612&w=0&k=20&c=rDn837m8OMd_uN8_hduEScGzARZznKFWfn45kQJ2j7A=",
      description: "Leading the vision for better diabetes management"
    },
    {
      name: "Syed",
      role: "Chief Medical Officer",
      image: "https://media.istockphoto.com/id/1399565382/photo/young-happy-mixed-race-businessman-standing-with-his-arms-crossed-working-alone-in-an-office.jpg?s=612x612&w=0&k=20&c=buXwOYjA_tjt2O3-kcSKqkTp2lxKWJJ_Ttx2PhYe3VM=",
      description: "Ensuring medical accuracy and best practices"
    },
    {
      name: "Isha",
      role: "Head of Product",
      image: "https://media.istockphoto.com/id/1289220545/photo/beautiful-woman-smiling-with-crossed-arms.jpg?s=612x612&w=0&k=20&c=qmOTkGstKj1qN0zPVWj-n28oRA6_BHQN8uVLIXg0TF8=",
      description: "Designing intuitive diabetes management solutions"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Activity className="h-16 w-16 mx-auto mb-8 text-blue-200" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About DiaFit</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            We're on a mission to make diabetes management simpler, more effective,
            and accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
              <p className="text-gray-600">
                To empower individuals with diabetes to live healthier, more active lives
                through innovative technology and personalized care.
              </p>
            </div>
            <div className="text-center">
              <Activity className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Our Approach</h3>
              <p className="text-gray-600">
                Combining medical expertise with user-friendly technology to create
                comprehensive diabetes management solutions.
              </p>
            </div>
            <div className="text-center">
              <Award className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Our Promise</h3>
              <p className="text-gray-600">
                Dedicated to providing reliable, evidence-based tools and support
                for your diabetes management journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                  <p className="text-gray-600">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
          <p className="text-xl text-gray-600 mb-8">
            Have questions about DiaFit? We'd love to hear from you.
          </p>
          <a
            href="mailto:contact@diafit.com"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;