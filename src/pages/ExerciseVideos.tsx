import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { Play, Volume2, Maximize2, Youtube } from 'lucide-react';

interface Video {
  title: string;
  url: string;
  thumbnail: string;
  category: 'beginner' | 'intermediate' | 'advanced' | 'yoga';
}

const ExerciseVideos = () => {
  const [selectedCategory, setSelectedCategory] = useState<'beginner' | 'intermediate' | 'advanced' | 'yoga'>('beginner');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const videos: Record<string, Video[]> = {
    beginner: [
      {
        title: "15-Minute Diabetes Exercise",
        url: "https://www.youtube.com/watch?v=gC_L9qAHVJ8",
        thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80",
        category: 'beginner'
      },
      {
        title: "Simple Diabetes Workout",
        url: "https://www.youtube.com/watch?v=cbKkB3POqaY",
        thumbnail: "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?auto=format&fit=crop&q=80",
        category: 'beginner'
      },
      {
        title: "Simple Diabetes Workout",
        url: "https://www.youtube.com/watch?v=cbKkB3POqaY",
        thumbnail: "https://media.istockphoto.com/id/522925157/photo/fitness-stretching.jpg?s=612x612&w=0&k=20&c=MCj0-H015RqYlYKqnPfHRL7nr58fFOaQ3UiJSy4hhyY=",
        category: 'beginner'
      },
      {
        title: "Simple Diabetes Workout",
        url: "https://www.youtube.com/watch?v=cbKkB3POqaY",
        thumbnail: "https://media.istockphoto.com/id/180836243/photo/working-out-and-feeling-amazing.jpg?s=612x612&w=0&k=20&c=JCdeoiCauZfOUJwaUyPzzeTnSGz4JTstvuNfNmrrL2Y=",
        category: 'beginner'
      },
      {
        title: "Simple Diabetes Workout",
        url: "https://www.youtube.com/watch?v=cbKkB3POqaY",
        thumbnail: "https://media.istockphoto.com/id/524451389/photo/doing-exercise.jpg?s=612x612&w=0&k=20&c=r-U2iC0sef3YShc9I3FIPIYqCWrXpvjEOZeJFZ7srFw=",
        category: 'beginner'
      },
      
      {
        title: "Beginner Friendly Exercise",
        url: "https://www.youtube.com/watch?v=IT94xC35u6k",
        thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80",
        category: 'beginner'
      }
    ],
    intermediate: [
      {
        title: "Intermediate Diabetes Workout",
        url: "https://www.youtube.com/watch?v=Goo0g_zmFBY",
        thumbnail: "https://media.istockphoto.com/id/1344890104/photo/young-african-american-sportsman-sitting-on-floor-and-doing-stretching-exercise-indoors.jpg?s=612x612&w=0&k=20&c=ac3dVK5kETFJGCjbqsLE9GAyeV7q53h1ZWimBeGTcu0=",
        category: 'intermediate'
      },
      {
        title: "Medium Intensity Training",
        url: "https://www.youtube.com/watch?v=NmCXy7oMsOs",
        thumbnail: "https://media.istockphoto.com/id/1395533921/photo/three-muscular-and-attractive-athletes-working-out-and-stretching-at-the-gym-stock-photo.jpg?s=612x612&w=0&k=20&c=DdsK_6zdPjkASu8OA_zOV9aDQiZnh3GUM4eUhWyCgmg=",
        category: 'intermediate'
      },
      {
        title: "Medium Intensity Training",
        url: "https://www.youtube.com/watch?v=NmCXy7oMsOs",
        thumbnail: "https://media.istockphoto.com/id/174981874/photo/young-couple-exercising-at-the-fitness-gym.jpg?s=612x612&w=0&k=20&c=g5_3mIZFtmc0hbs5Ov7BCwAQjyI1M8x2hb9-9yiTXR0=",
        category: 'intermediate'
      },
      {
        title: "Medium Intensity Training",
        url: "https://www.youtube.com/watch?v=NmCXy7oMsOs",
        thumbnail: "https://images.unsplash.com/photo-1574680088814-c9e8a10d8a4d?auto=format&fit=crop&q=80",
        category: 'intermediate'
      },
      {
        title: "Medium Intensity Training",
        url: "https://www.youtube.com/watch?v=NmCXy7oMsOs",
        thumbnail: "https://media.istockphoto.com/id/1332813678/photo/athletic-people-doing-exercises-in-gym-health-and-fitness-concept.jpg?s=612x612&w=0&k=20&c=A8pV-kM6Ugmc1tfi5HuMKLqCvE0N0V8GVDoOXMXKvxY=",
        category: 'intermediate'
      },
      {
        title: "Medium Intensity Training",
        url: "https://www.youtube.com/watch?v=NmCXy7oMsOs",
        thumbnail: "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDI2fHx8ZW58MHx8fHx8",
        category: 'intermediate'
      },
      {
        title: "Medium Intensity Training",
        url: "https://www.youtube.com/watch?v=NmCXy7oMsOs",
        thumbnail: "https://media.istockphoto.com/id/2161380590/photo/dynamic-duo-gym-goers-engage-in-dumbbell-exercise-for-a-healthy-lifestyle.jpg?s=612x612&w=0&k=20&c=gKB4S5OSlcFPT4dFQs_IAOO1b6s_sjgco1DTwubTDak=",
        category: 'intermediate'
      },
      {
        title: "Medium Intensity Training",
        url: "https://www.youtube.com/watch?v=NmCXy7oMsOs",
        thumbnail: "https://media.istockphoto.com/id/2192373489/photo/healthy-mom-healthy-baby.jpg?s=612x612&w=0&k=20&c=bePEXC_LYncHMfI2dMZfqSdOH6nPZwsv1aL2OzsaxLM=",
        category: 'intermediate'
      },
      {
        title: "Progressive Exercise Routine",
        url: "https://www.youtube.com/watch?v=8oQ-WNJoYtM",
        thumbnail:  "https://media.istockphoto.com/id/1427222782/photo/fit-muscular-man-doing-push-ups-with-bars.webp?a=1&b=1&s=612x612&w=0&k=20&c=ka_dSFBGGMoBNtoXmTzyBBE8ixJHDgIbcwRTjpNM0cw=",
        category: 'intermediate'
      }
    ],
    advanced: [
      {
        title: "Advanced Diabetes Management",
        url: "https://www.youtube.com/watch?v=M0uO8X3_tEA",
        thumbnail: "https://media.istockphoto.com/id/474068730/photo/gym-is-a-way-of-life.jpg?s=612x612&w=0&k=20&c=hO-ZKhxU3PkcxPMQ-GDzz5xj8dWRywMa2rpbYDZct0Y=",
        category: 'advanced'
      },
      {
        title: "High Intensity Workout",
        url: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
        thumbnail: "https://media.istockphoto.com/id/667465430/photo/fit-young-man-doing-push-ups.webp?a=1&b=1&s=612x612&w=0&k=20&c=6dScwq5ZgLjmzgKdVAkMvrn-EhY43iVt-avbjGlLie8=",
        category: 'advanced'
      },
      {
        title: "High Intensity Workout",
        url: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
        thumbnail: "https://media.istockphoto.com/id/597244220/photo/flexibility.jpg?s=612x612&w=0&k=20&c=KLOJSko5YElEfzBldSPx69N4deqhZPw04m26TkB_cZ4=",
        category: 'advanced'
      },
      {
        title: "High Intensity Workout",
        url: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
        thumbnail: "https://media.istockphoto.com/id/1427221511/photo/woman-training-with-battle-rope-in-gym-gym.jpg?s=612x612&w=0&k=20&c=qjkoXsRJ3cdW7Hd7Uh2UiDJOIZfNLCnK_F75t8u8MHw=",
        category: 'advanced'
      },
      {
        title: "High Intensity Workout",
        url: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
        thumbnail: "https://media.istockphoto.com/id/1034925554/photo/strong-young-smiling-athletes-stretching-in-a-gym.jpg?s=612x612&w=0&k=20&c=65SQTuvn5QFGWTXC3RqI7VBe5g2ZbF_7INAQ-3dagro=",
        category: 'advanced'
      },
      {
        title: "Expert Level Exercise",
        url: "https://www.youtube.com/watch?v=mCeFdXQtj5E",
        thumbnail: "https://media.istockphoto.com/id/1396727797/photo/athletic-couple-doing-kettlebell-goblet-squat-exercise-during-cross-training-in-a-gym.jpg?s=612x612&w=0&k=20&c=vlJmg-KyO4ooxbSGP92uinbXCEOGxhOMotzQAB9u-Rw=",
        category: 'advanced'
      }
    ],
    yoga: [
      {
        title: "Yoga for Diabetes",
        url: "https://www.youtube.com/watch?v=x0nZ1ZLephQ",
        thumbnail: "https://media.istockphoto.com/id/1483989816/photo/adult-arab-male-with-a-ponytail-meditating-in-a-yoga-class.jpg?s=612x612&w=0&k=20&c=FTkO8dit_ZWB_9mUk2bmkELm2mpC-NqH82nCmK1Wx6M=",
        category: 'yoga'
      },
      {
        title: "Meditation & Mindfulness",
        url: "https://www.youtube.com/watch?v=blbv5UTBCGg",
        thumbnail: "https://media.istockphoto.com/id/1404907279/photo/indian-people-doing-yoga-in-circle.jpg?s=612x612&w=0&k=20&c=HYFiMGwLYQ2YVEBHXK48FZJOLnc7UiE0acDEDXo2ElE=",
        category: 'yoga'
      },
       {
        title: "Full Body Yoga for Strength & Flexibility",
        url: "https://www.yohttps://www.youtube.com/watch?v=Eml2xnoLpYE",
        thumbnail: "https://media.istockphoto.com/id/689654176/photo/young-woman-doing-yoga-exercises-in-the-summer-city-park-health-lifestyle-concept.jpg?s=612x612&w=0&k=20&c=rtCI3vrCtsSIDEoGYEjqaLsVGV25mu9V74zBU5zD4v0=",
        category: 'yoga'
      },
      {
        title: "Tension Relief, Relaxation, Flexibility",
        url: "https://www.youtube.com/watch?v=6CueZ4zujMk",
        thumbnail: "https://media.istockphoto.com/id/1352872935/photo/calm-african-american-woman-doing-yoga-exercise-sitting-in-baddha-konasana-bound-angle-or.jpg?s=612x612&w=0&k=20&c=a4PKBvqlEJ6_wrw_PZpMH4LOwLFrsplQEkB_cQbiZUw=",
        category: 'yoga'
      },
      {
        title: "Daily Routine for Flexibility, Mobility & Relaxation ",
        url: "https://www.youtube.com/watch?v=g_tea8ZNk5A",
        thumbnail: "https://media.istockphoto.com/id/627908748/photo/woman-doing-ashtanga-vinyasa-yoga-asana-dhanurasana-bow-pose.jpg?s=612x612&w=0&k=20&c=OZkuaky_8Od5caeB3ZD2x3BRA_ZdMqD7O6adu_PF9Do=",
        category: 'yoga'
      },
      {
        title: "Relaxation Techniques",
        url: "https://www.youtube.com/watch?v=9MazN_6wdqI",
        thumbnail: "https://media.istockphoto.com/id/1343124420/photo/im-always-excited-for-yoga-stock-photo.jpg?s=612x612&w=0&k=20&c=TzydlyF5Pz2Jvqy24gjafoLBqAeL7GyrC2aAih8vMFs=",
        category: 'yoga'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Youtube className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Exercise Videos</h1>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-4 mb-8">
          {['beginner', 'intermediate', 'advanced', 'yoga'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as typeof selectedCategory)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Video Player */}
        {selectedVideo && (
          <div className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              <ReactPlayer
                url={selectedVideo.url}
                width="100%"
                height="100%"
                controls
                playing={false}
                className="react-player"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos[selectedCategory].map((video, index) => (
            <div
              key={index}
              onClick={() => setSelectedVideo(video)}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
            >
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{video.title}</h3>
                <div className="flex items-center text-gray-600 text-sm">
                  <Play className="h-4 w-4 mr-1" />
                  <span>Click to play</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExerciseVideos;