'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ReviewFormLayout from '@/app/components/ReviewFormLayout';
import InformedConsentForm from '../page';

export default function InformedConsentPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ReviewFormLayout formTitle="Informed Consent Form">
      <InformedConsentForm />
    </ReviewFormLayout>
  );
} 