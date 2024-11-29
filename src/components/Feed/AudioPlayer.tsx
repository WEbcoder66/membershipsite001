// src/components/Feed/AudioPlayer.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Settings
} from 'lucide-react';

interface AudioPlayerProps {
  url: string;
  duration: string;
}

export default function AudioPlayer({ url, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlers = {
      timeupdate: () => setCurrentTime(audio.currentTime),
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      ended: () => {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler);
      });
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        await audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioRef.current.duration;
    
    audioRef.current.currentTime = newTime;
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, currentTime + seconds);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Audio Element */}
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Progress Bar */}
      <div 
        className="w-full h-1 bg-gray-200 rounded cursor-pointer mb-4"
        onClick={handleProgressClick}
      >
        <div 
          className="h-full bg-yellow-400 rounded"
          style={{ width: `${(currentTime / (audioRef.current?.duration || 1)) * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Skip Back */}
          <button 
            onClick={() => skipTime(-10)}
            className="text-gray-600 hover:text-yellow-500"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-black" />
            ) : (
              <Play className="w-5 h-5 text-black translate-x-0.5" />
            )}
          </button>

          {/* Skip Forward */}
          <button 
            onClick={() => skipTime(10)}
            className="text-gray-600 hover:text-yellow-500"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Volume */}
          <div className="relative">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="text-gray-600 hover:text-yellow-500"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {showVolumeSlider && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-white shadow-lg rounded p-2"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 accent-yellow-400"
                />
              </div>
            )}
          </div>

          {/* Time */}
          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {duration}
          </div>
        </div>

        {/* Settings */}
        <button className="text-gray-600 hover:text-yellow-500">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}