'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface PollProps {
  options: Record<string, number>;
  endDate?: string;
  multipleChoice?: boolean;
  postId: string; // Make sure to pass the post's ID
}

export default function PollComponent({ 
  options = {},
  endDate,
  multipleChoice = false,
  postId
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

  const hasEnded = endDate ? new Date(endDate) < new Date() : false;

  const handleVote = async (option: string) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }
    if (hasVoted || hasEnded) return;

    const response = await fetch('/api/content/pollVote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId: postId, option })
    });

    if (response.ok) {
      const data = await response.json();
      setVotes(data.data);
      setSelectedOption(option);
      setHasVoted(true);
    } else {
      alert('Failed to vote');
    }
  };

  const voteOptions = Object.entries(votes);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {hasEnded && (
        <div className="mb-4 text-sm text-gray-600">
          This poll has ended
        </div>
      )}

      {voteOptions.length === 0 ? (
        <div className="text-sm text-gray-600">No poll options available.</div>
      ) : (
        <div className="space-y-3">
          {voteOptions.map(([option, voteCount]) => {
            const percentage = calculatePercentage(voteCount);
            const isSelected = option === selectedOption;
  
            return (
              <div key={option} className="relative bg-gray-100 rounded-lg overflow-hidden">
                {(hasVoted || hasEnded) && (
                  <div
                    className="absolute inset-0 bg-yellow-200"
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <button
                  onClick={() => handleVote(option)}
                  disabled={hasVoted || hasEnded || !user}
                  className={`relative w-full text-left p-4 transition-all ${
                    isSelected 
                      ? 'bg-yellow-50 border-l-4 border-yellow-400' 
                      : 'hover:bg-gray-50'
                  }`}
                  style={{ zIndex: 1 }}
                >
                  <div className="flex justify-between items-center relative z-10">
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
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>{getTotalVotes()} total votes</div>
        {!hasEnded && endDate && (
          <div>Ends {new Date(endDate).toLocaleDateString()}</div>
        )}
      </div>

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
