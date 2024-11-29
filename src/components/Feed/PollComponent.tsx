'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface PollProps {
  options: Record<string, number>;
  endDate?: string;
  multipleChoice?: boolean;
}

export default function PollComponent({ 
  options = {},
  endDate,
  multipleChoice = false 
}: PollProps) {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState(options);

  const getTotalVotes = () => {
    return Object.values(votes).reduce((sum, current) => sum + current, 0);
  };

  const calculatePercentage = (optionVotes: number) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((optionVotes / total) * 100);
  };

  const handleVote = (option: string) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }
    if (hasVoted) return;

    setVotes(prev => ({
      ...prev,
      [option]: (prev[option] || 0) + 1
    }));
    
    setSelectedOption(option);
    setHasVoted(true);
  };

  // Check if poll has ended
  const hasEnded = endDate ? new Date(endDate) < new Date() : false;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {hasEnded && (
        <div className="mb-4 text-sm text-gray-600">
          This poll has ended
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(votes).map(([option, voteCount]) => {
          const percentage = calculatePercentage(voteCount);
          const isSelected = option === selectedOption;

          return (
            <div key={option} className="relative">
              <button
                onClick={() => handleVote(option)}
                disabled={hasVoted || hasEnded || !user}
                className={`w-full text-left p-4 rounded-lg relative overflow-hidden transition-all ${
                  isSelected 
                    ? 'bg-yellow-50 border-2 border-yellow-400' 
                    : 'bg-gray-50 hover:bg-gray-100'
                } ${hasVoted || hasEnded ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {/* Progress Bar Background */}
                {(hasVoted || hasEnded) && (
                  <div
                    className="absolute inset-0 bg-yellow-100 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                
                {/* Option Content */}
                <div className="relative flex justify-between items-center z-10">
                  <span className="font-medium text-gray-900">{option}</span>
                  {(hasVoted || hasEnded) && (
                    <span className="text-sm font-medium text-gray-900">
                      {percentage}% ({voteCount} votes)
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Poll Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          {getTotalVotes()} total votes
        </div>
        {!hasEnded && endDate && (
          <div>
            Ends {new Date(endDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Sign in prompt */}
      {!user && !hasEnded && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => window.location.href = '/auth/signin'}
            className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
          >
            Sign in to vote
          </button>
        </div>
      )}
    </div>
  );
}