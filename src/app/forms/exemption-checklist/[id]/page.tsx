'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ReviewFormLayout from '@/app/components/ReviewFormLayout';
import ExemptionChecklistForm from '../page';

export default function ExemptionChecklistPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ReviewFormLayout formTitle="Exemption Checklist Form">
      <ExemptionChecklistForm />
    </ReviewFormLayout>
  );
} 