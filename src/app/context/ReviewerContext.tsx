'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ReviewerContextType {
  reviewerCode: string;
  reviewerId: string | null;
  reviewerName: string | null;
  setReviewerInfo: (code: string, id: string | null, name: string | null) => void;
}

const ReviewerContext = createContext<ReviewerContextType | undefined>(undefined);

export function ReviewerProvider({ children }: { children: ReactNode }) {
  const [reviewerCode, setReviewerCode] = useState('');
  const [reviewerId, setReviewerId] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState<string | null>(null);

  const setReviewerInfo = (code: string, id: string | null, name: string | null) => {
    setReviewerCode(code);
    setReviewerId(id);
    setReviewerName(name);
  };

  return (
    <ReviewerContext.Provider value={{ reviewerCode, reviewerId, reviewerName, setReviewerInfo }}>
      {children}
    </ReviewerContext.Provider>
  );
}

export function useReviewer() {
  const context = useContext(ReviewerContext);
  if (context === undefined) {
    throw new Error('useReviewer must be used within a ReviewerProvider');
  }
  return context;
} 