'use client';

import React, { useState, useEffect } from 'react';
import { useReviewer } from '../../context/ReviewerContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from '@/styles/Home.module.css';

interface AssessmentPoint {
  value: 'Yes' | 'No' | 'Unable to assess' | null;
  comments: string;
}

interface InformedConsentAssessment {
  spupRecProtocolCode: string;
  submissionDate: string;
  protocolTitle: string;
  studySite: string;
  principalInvestigator: string;
  sponsor: string;
  assessmentPoints: {
    researchPurpose: AssessmentPoint;
    consentProcedures: AssessmentPoint;
    comprehensiveInformation: AssessmentPoint;
    protocolConsistency: AssessmentPoint;
    risksDisclosure: AssessmentPoint;
    understandableLanguage: AssessmentPoint;
    localTranslation: AssessmentPoint;
    vulnerableProtection: AssessmentPoint;
    consentTypes: AssessmentPoint;
    contactInformation: AssessmentPoint;
    privacyConfidentiality: AssessmentPoint;
    participationInducement: AssessmentPoint;
    supportProvision: AssessmentPoint;
    injuryTreatment: AssessmentPoint;
    compensationProvision: AssessmentPoint;
    participantResponsibilities: AssessmentPoint;
    benefitsDescription: AssessmentPoint;
  };
  recommendation: 'Approved' | 'Minor Modifications Required' | 'Major Modifications Required' | 'Disapproved';
  justification: string;
}

const ASSESSMENT_OPTIONS = ['Yes', 'No', 'Unable to assess'] as const;

const ASSESSMENT_LABELS = {
  researchPurpose: {
    title: '1. Research Purpose',
    question: 'Does the Informed Consent document state that the procedures are primarily intended for research?'
  },
  consentProcedures: {
    title: '2. Consent Procedures',
    question: 'Are procedures for obtaining Informed Consent appropriate?'
  },
  comprehensiveInformation: {
    title: '3. Comprehensive Information',
    question: 'Does the Informed Consent document contain comprehensive and relevant information?'
  },
  protocolConsistency: {
    title: '4. Protocol Consistency',
    question: 'Is the information provided in the protocol consistent with those in the consent form?'
  },
  risksDisclosure: {
    title: '5. Risks Disclosure',
    question: 'Are study related risks mentioned in the consent form?'
  },
  understandableLanguage: {
    title: '6. Understandable Language',
    question: 'Is the language in the Informed Consent document understandable?'
  },
  localTranslation: {
    title: '7. Local Translation',
    question: 'Is the Informed Consent translated into the local language/dialect?'
  },
  vulnerableProtection: {
    title: '8. Vulnerable Protection',
    question: 'Is there adequate protection of vulnerable participants?'
  },
  consentTypes: {
    title: '9. Consent Types',
    question: 'Are the different types of consent forms (assent, legally acceptable representative) appropriate for the types of study participants?'
  },
  contactInformation: {
    title: '10. Contact Information',
    question: 'Are names and contact numbers from the research team and the SPUP REC in the informed consent?'
  },
  privacyConfidentiality: {
    title: '11. Privacy & Confidentiality',
    question: 'Does the ICF mention privacy & confidentiality protection?'
  },
  participationInducement: {
    title: '12. Participation Inducement',
    question: 'Is there any inducement for participation?'
  },
  supportProvision: {
    title: '13. Support Provision',
    question: 'Is there provision for medical / psychosocial support?'
  },
  injuryTreatment: {
    title: '14. Injury Treatment',
    question: 'Is there provision for treatment of study-related injuries?'
  },
  compensationProvision: {
    title: '15. Compensation Provision',
    question: 'Is there provision for compensation?'
  },
  participantResponsibilities: {
    title: '16. Participant Responsibilities',
    question: 'Does the ICF clearly describe the responsibilities of the participants?'
  },
  benefitsDescription: {
    title: '17. Benefits Description',
    question: 'Does the ICF describe the benefits of participating in the research?'
  }
};

const INITIAL_FORM_DATA: InformedConsentAssessment = {
  spupRecProtocolCode: '',
  submissionDate: '',
  protocolTitle: '',
  studySite: '',
  principalInvestigator: '',
  sponsor: '',
  assessmentPoints: Object.keys(ASSESSMENT_LABELS).reduce((acc, key) => ({
    ...acc,
    [key]: { value: null, comments: '' }
  }), {} as InformedConsentAssessment['assessmentPoints']),
  recommendation: 'Approved',
  justification: ''
};

export default function InformedConsentForm() {
  const { reviewerId, reviewerCode, reviewerName } = useReviewer();
  const router = useRouter();
  const [formData, setFormData] = useState<InformedConsentAssessment>(INITIAL_FORM_DATA);
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
        submissionDate: new Date().toISOString().split('T')[0]
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
      const informedConsentsCollection = collection(db, 'informed-consents');
      await addDoc(informedConsentsCollection, {
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
      console.error('Error submitting informed consent review:', err);
      setError('Failed to submit informed consent review');
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
        <p className={styles.assessmentQuestion}>{question}</p>
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
              required
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
              required
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
              required
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
              required
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
              required
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
              required
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h2>II. Guide Questions for Assessment</h2>
        {Object.entries(ASSESSMENT_LABELS).map(([key, { title, question }]) => (
          <div key={key} className={styles.assessmentGroup}>
            {renderAssessmentPoint(
              title,
              question,
              formData.assessmentPoints[key as keyof typeof formData.assessmentPoints],
              `assessmentPoints.${key}`
            )}
          </div>
        ))}
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
          Informed consent review submitted successfully!
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={styles.submitButton}
      >
        {loading ? 'Submitting...' : 'Submit Informed Consent Review'}
      </button>
    </form>
  );
} 