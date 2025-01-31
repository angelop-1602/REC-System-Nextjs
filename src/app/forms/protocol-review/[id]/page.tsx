'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ReviewFormLayout from '@/app/components/ReviewFormLayout';
import ProtocolReviewForm from '../page';

export default function ProtocolReviewPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ReviewFormLayout formTitle="Protocol Review Form">
      <ProtocolReviewForm />
    </ReviewFormLayout>
  );
} 