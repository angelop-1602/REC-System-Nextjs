'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import styles from '@/styles/Home.module.css';
import { useReviewer } from '../../context/ReviewerContext';
import { useRouter } from 'next/navigation';
import ReviewFormLayout from '@/app/components/ReviewFormLayout';

interface AssessmentPoint {
  value: 'Yes' | 'No' | 'Unable to assess' | null;
  comments: string;
}

interface ProtocolReviewAssessment {
  spupRecProtocolCode: string;
  submissionDate: string;
  protocolTitle: string;
  studySite: string;
  principalInvestigator: string;
  courseProgram: string;
  sponsor: string;
  typeOfReview: 'Full Review' | 'Expedited';
  assessmentPoints: {
    socialValue: AssessmentPoint;
    scientificSoundness: {
      studyObjectives: AssessmentPoint;
      literatureReview: AssessmentPoint;
      researchDesign: AssessmentPoint;
      dataCollection: AssessmentPoint;
      inclusionExclusionCriteria: AssessmentPoint;
      withdrawalCriteria: AssessmentPoint;
      facilities: AssessmentPoint;
      investigatorQualification: AssessmentPoint;
    };
    ethicalSoundness: {
      privacyConfidentiality: AssessmentPoint;
      conflictOfInterest: AssessmentPoint;
      humanParticipants: AssessmentPoint;
      vulnerablePopulations: AssessmentPoint;
      participantSelection: AssessmentPoint;
      riskBenefitRatio: AssessmentPoint;
      informedConsent: AssessmentPoint;
      communityConsiderations: AssessmentPoint;
      collaborativeTerms: AssessmentPoint;
    };
  };
  recommendation: 'Approved' | 'Minor Modifications Required' | 'Major Modifications Required' | 'Disapproved';
  justification: string;
}

const ASSESSMENT_OPTIONS = ['Yes', 'No', 'Unable to assess'] as const;

const ASSESSMENT_LABELS = {
  socialValue: {
    title: '1. SOCIAL VALUE',
    question: '(Does the study have scientific or social value?)'
  },
  scientificSoundness: {
    title: '2. SCIENTIFIC SOUNDNESS',
    studyObjectives: {
      title: '2.1. Study Objectives',
      question: '(Is/are the proposal\'s scientific question/s reasonable?)'
    },
    literatureReview: {
      title: '2.2. Literature Review',
      question: '(Does the protocol adequately present informational background as to the result of previous studies prior to human experimentation?)'
    },
    researchDesign: {
      title: '2.3. Research and Sampling design',
      question: '(Is the study design, sampling method and techniques appropriate?)'
    },
    dataCollection: {
      title: '2.4. Specimen/Data Collection, Processing, Storage',
      question: '(Are the procedures in collecting, processing, and storing data adequate?)'
    },
    inclusionExclusionCriteria: {
      title: '2.5. Inclusion/Exclusion Criteria',
      question: '(Are the features of the target population appropriate?)'
    },
    withdrawalCriteria: {
      title: '2.6. Withdrawal Criteria',
      question: '(Is there a provision for withdrawal from the research?)'
    },
    facilities: {
      title: '2.7. Facilities/Infrastructure at Study Site',
      question: '(Are the research facilities adequate?)'
    },
    investigatorQualification: {
      title: '2.8. Investigator\'s Qualification, Competence, and Experience',
      question: '(Is/are the investigator/s adequately trained and do they have sufficient experience?)'
    }
  },
  ethicalSoundness: {
    title: '3. ETHICAL SOUNDNESS',
    privacyConfidentiality: {
      title: '3.1. Privacy and Confidentiality Safeguards',
      question: '(Does the research ensure to protect privacy and confidentiality of participant information?)'
    },
    conflictOfInterest: {
      title: '3.2. Conflict of Interest',
      question: '(Does the research ensure mechanism of management of conflict arising from financial, familial, or proprietary considerations from PI, sponsor, or the study site?)'
    },
    humanParticipants: {
      title: '3.3. Involvement of Human Participants',
      question: '(Does the research need to be carried out with human participants?)'
    },
    vulnerablePopulations: {
      title: '3.4. Involvement of Vulnerable Populations',
      question: '(Does the study involve individuals who belong to vulnerable group?)'
    },
    participantSelection: {
      title: '3.5. Participant Selection-voluntary, non-coercive recruitment',
      question: '(Are appropriate mechanisms in place to protect above individual in vulnerable group?)'
    },
    riskBenefitRatio: {
      title: '3.6. Risk-Benefit Ratio',
      question: '(Does the protocol adequately address the risk/ benefit balance?)'
    },
    informedConsent: {
      title: '3.7. Informed Consent Process',
      question: '(Is the informed consent procedure/ assent form adequately and culturally appropriate?)'
    },
    communityConsiderations: {
      title: '3.8. Community Considerations',
      question: '(Does the study offer substantial and relevant contribution to local communities and address possible stigma or draining of local capacity?)'
    },
    collaborativeTerms: {
      title: '3.9. Collaborative Study Terms of Reference',
      question: '(Does the study present clear terms on IP rights, publication rights, information and responsibility sharing, transparency, and capacity building?)'
    }
  }
};

const INITIAL_FORM_DATA: ProtocolReviewAssessment = {
  spupRecProtocolCode: '',
  submissionDate: '',
  protocolTitle: '',
  studySite: '',
  principalInvestigator: '',
  courseProgram: '',
  sponsor: '',
  typeOfReview: 'Full Review',
  assessmentPoints: {
    socialValue: { value: null, comments: '' },
    scientificSoundness: {
      studyObjectives: { value: null, comments: '' },
      literatureReview: { value: null, comments: '' },
      researchDesign: { value: null, comments: '' },
      dataCollection: { value: null, comments: '' },
      inclusionExclusionCriteria: { value: null, comments: '' },
      withdrawalCriteria: { value: null, comments: '' },
      facilities: { value: null, comments: '' },
      investigatorQualification: { value: null, comments: '' },
    },
    ethicalSoundness: {
      privacyConfidentiality: { value: null, comments: '' },
      conflictOfInterest: { value: null, comments: '' },
      humanParticipants: { value: null, comments: '' },
      vulnerablePopulations: { value: null, comments: '' },
      participantSelection: { value: null, comments: '' },
      riskBenefitRatio: { value: null, comments: '' },
      informedConsent: { value: null, comments: '' },
      communityConsiderations: { value: null, comments: '' },
      collaborativeTerms: { value: null, comments: '' },
    },
  },
  recommendation: 'Approved',
  justification: '',
};

interface FileData {
  name: string;
  type: string;
  path?: string;
}

interface SelectedFile {
  name: string;
  type: string;
  url: string;
}

interface PaperData {
  id: string;
  researchTitle: string;
  principalInvestigator: string;
  courseProgram: string;
  files?: {
    [key: string]: FileData;
  };
}

export default function ProtocolReviewForm() {
  const { reviewerId, reviewerCode, reviewerName } = useReviewer();
  const router = useRouter();
  const [formData, setFormData] = useState<ProtocolReviewAssessment>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load paper data from sessionStorage
    const storedData = sessionStorage.getItem('currentPaper');
    if (storedData) {
      const data = JSON.parse(storedData);
      
      // Pre-fill form data
      setFormData(prev => ({
        ...prev,
        spupRecProtocolCode: data.id || '',
        protocolTitle: data.researchTitle || '',
        principalInvestigator: data.principalInvestigator || '',
        courseProgram: data.courseProgram || '',
        submissionDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString().split('T')[0] : '',
        studySite: data.studySite || '',
        sponsor: data.sponsor || '',
        typeOfReview: data.typeOfReview || 'Full Review'
      }));
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: string
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    
    setFormData(prev => {
      const newData = { ...prev };
      const fieldParts = field.split('.');
      
      if (fieldParts.length === 1) {
        return { ...prev, [field]: value };
      }
      
      let current: any = newData;
      for (let i = 0; i < fieldParts.length - 1; i++) {
        current = current[fieldParts[i]];
      }
      current[fieldParts[fieldParts.length - 1]] = value;
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewerId || !reviewerCode || !reviewerName) {
      setError('Please log in as a reviewer first');
      router.push('/reviewer');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const protocolsCollection = collection(db, 'protocols');
      await addDoc(protocolsCollection, {
        ...formData,
        reviewerId,
        reviewerCode,
        reviewerName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccess(true);
      setFormData(INITIAL_FORM_DATA);
      setTimeout(() => {
        router.push('/reviewer');
      }, 1500);
    } catch (err) {
      console.error('Error submitting protocol review:', err);
      setError('Failed to submit protocol review');
    } finally {
      setLoading(false);
    }
  };

  const renderAssessmentPoint = (
    title: string,
    question: string,
    assessment: AssessmentPoint,
    fieldPath: string
  ) => (
    <div className={styles.assessmentPoint}>
      <div className={styles.assessmentHeader}>
        <h4 className={styles.assessmentTitle}>{title}</h4>
        <p className={styles.assessmentQuestion}><em>{question}</em></p>
      </div>
      <div className={styles.assessmentContent}>
        <div className={styles.radioGroup}>
          {ASSESSMENT_OPTIONS.map((option) => (
            <label key={option} className={styles.radioLabel}>
              <input
                type="radio"
                name={`${fieldPath}.value`}
                value={option}
                checked={assessment.value === option}
                onChange={(e) => handleInputChange(e, `${fieldPath}.value`)}
                className={styles.radio}
              />
              {option}
            </label>
          ))}
        </div>
        <div className={styles.commentsSection}>
          <label className={styles.commentsLabel}>COMMENTS:</label>
          <textarea
            value={assessment.comments}
            onChange={(e) => handleInputChange(e, `${fieldPath}.comments`)}
            className={styles.assessmentComments}
          />
        </div>
      </div>
    </div>
  );

  const renderAssessmentSection = (
    sectionTitle: string,
    items: { [key: string]: { title: string; question: string } },
    basePath: string,
    values: { [key: string]: AssessmentPoint }
  ) => (
    <div className={styles.assessmentSection}>
      <h3>{sectionTitle}</h3>
      {Object.entries(items).filter(([key]) => key !== 'title').map(([key, item]) => (
        <div key={key}>
          {renderAssessmentPoint(
            item.title,
            item.question,
            values[key],
            `${basePath}.${key}`
          )}
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formSection}>
        <h2>I. Protocol Information</h2>
        <div className={styles.protocolInfo}>
          <div className={styles.formGroup}>
            <label htmlFor="spupRecProtocolCode" className={styles.label}>
              SPUP REC Protocol Code:
            </label>
            <input
              type="text"
              id="spupRecProtocolCode"
              value={formData.spupRecProtocolCode}
              onChange={(e) => handleInputChange(e, 'spupRecProtocolCode')}
              className={styles.textInput}
              placeholder={formData.spupRecProtocolCode}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="submissionDate" className={styles.label}>
              Submission Date:
            </label>
            <input
              type="date"
              id="submissionDate"
              value={formData.submissionDate}
              onChange={(e) => handleInputChange(e, 'submissionDate')}
              className={styles.textInput}
              placeholder={formData.submissionDate}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="protocolTitle" className={styles.label}>
              Protocol Title:
            </label>
            <input
              type="text"
              id="protocolTitle"
              value={formData.protocolTitle}
              onChange={(e) => handleInputChange(e, 'protocolTitle')}
              className={styles.textInput}
              placeholder={formData.protocolTitle}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="studySite" className={styles.label}>
              Study Site:
            </label>
            <input
              type="text"
              id="studySite"
              value={formData.studySite}
              onChange={(e) => handleInputChange(e, 'studySite')}
              className={styles.textInput}
              placeholder={formData.studySite}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="principalInvestigator" className={styles.label}>
              Name of Principal Investigator:
            </label>
            <input
              type="text"
              id="principalInvestigator"
              value={formData.principalInvestigator}
              onChange={(e) => handleInputChange(e, 'principalInvestigator')}
              className={styles.textInput}
              placeholder={formData.principalInvestigator}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="courseProgram" className={styles.label}>
              Course/Program:
            </label>
            <input
              type="text"
              id="courseProgram"
              value={formData.courseProgram}
              onChange={(e) => handleInputChange(e, 'courseProgram')}
              className={styles.textInput}
              placeholder={formData.courseProgram}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sponsor" className={styles.label}>
              Sponsor/Contract Research Organization/Institution:
            </label>
            <input
              type="text"
              id="sponsor"
              value={formData.sponsor}
              onChange={(e) => handleInputChange(e, 'sponsor')}
              className={styles.textInput}
              placeholder={formData.sponsor}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Type of Review:
            </label>
            <div className={styles.radioGroup}>
              {['Full Review', 'Expedited'].map((option) => (
                <label key={option} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="typeOfReview"
                    value={option}
                    checked={formData.typeOfReview === option}
                    onChange={(e) => handleInputChange(e, 'typeOfReview')}
                    className={styles.radio}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h2>II. Assessment Points</h2>
        
        <div className={styles.assessmentGroup}>
          {renderAssessmentPoint(
            ASSESSMENT_LABELS.socialValue.title,
            ASSESSMENT_LABELS.socialValue.question,
            formData.assessmentPoints.socialValue,
            'assessmentPoints.socialValue'
          )}
        </div>

        <div className={styles.assessmentGroup}>
          {renderAssessmentSection(
            ASSESSMENT_LABELS.scientificSoundness.title,
            Object.fromEntries(
              Object.entries(ASSESSMENT_LABELS.scientificSoundness)
                .filter(([key]) => key !== 'title')
            ) as { [key: string]: { title: string; question: string } },
            'assessmentPoints.scientificSoundness',
            formData.assessmentPoints.scientificSoundness
          )}
        </div>

        <div className={styles.assessmentGroup}>
          {renderAssessmentSection(
            ASSESSMENT_LABELS.ethicalSoundness.title,
            Object.fromEntries(
              Object.entries(ASSESSMENT_LABELS.ethicalSoundness)
                .filter(([key]) => key !== 'title')
            ) as { [key: string]: { title: string; question: string } },
            'assessmentPoints.ethicalSoundness',
            formData.assessmentPoints.ethicalSoundness
          )}
        </div>
      </div>

      <div className={styles.formSection}>
        <h2>Recommendation</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Final Recommendation:
          </label>
          <div className={styles.radioGroup}>
            {['Approved', 'Minor Modifications Required', 'Major Modifications Required', 'Disapproved'].map((option) => (
              <label key={option} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="recommendation"
                  value={option}
                  checked={formData.recommendation === option}
                  onChange={(e) => handleInputChange(e, 'recommendation')}
                  className={styles.radio}
                  required
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="justification" className={styles.label}>
            Justification for Recommendation:
          </label>
          <textarea
            id="justification"
            value={formData.justification}
            onChange={(e) => handleInputChange(e, 'justification')}
            className={styles.textarea}
            required
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && (
        <p className={styles.success}>
          Protocol review submitted successfully!
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={styles.submitButton}
      >
        {loading ? 'Submitting...' : 'Submit Protocol Review'}
      </button>
    </form>
  );
} 