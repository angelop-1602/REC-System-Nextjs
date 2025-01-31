'use client';

import React, { useState, useEffect } from 'react';
import { useReviewer } from '../../context/ReviewerContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from '@/styles/Home.module.css';

interface AssessmentPoint {
  value: 'Yes' | 'No' | null;
  comments?: string;
}

interface ExemptionChecklist {
  spupRecProtocolCode: string;
  submissionDate: string;
  protocolTitle: string;
  studySite: string;
  principalInvestigator: string;
  sponsor: string;
  protocolAssessment: {
    humanParticipants: AssessmentPoint;
    biologicalSamples: AssessmentPoint;
    publicData: AssessmentPoint;
    humanInteraction: AssessmentPoint;
    researchType: {
      qualityAssurance: AssessmentPoint;
      publicServiceEvaluation: AssessmentPoint;
      healthSurveillance: AssessmentPoint;
      educationalEvaluation: AssessmentPoint;
      consumerTest: AssessmentPoint;
    };
    dataCollection: {
      surveys: AssessmentPoint;
      interviews: AssessmentPoint;
      publicObservations: AssessmentPoint;
      existingData: AssessmentPoint;
      recordings: AssessmentPoint;
    };
    dataAnonymity: 'Anonymized' | 'Identifiable' | 'De-identified' | null;
    dataAnonymityComments: string;
    foreseeableRisk: AssessmentPoint;
  };
  riskAssessment: {
    vulnerableGroups: AssessmentPoint;
    sensitiveTopics: AssessmentPoint;
    drugs: AssessmentPoint;
    invasiveProcedure: AssessmentPoint;
    physicalStress: AssessmentPoint;
    psychologicalStress: AssessmentPoint;
    deception: AssessmentPoint;
    dataAccess: AssessmentPoint;
    conflictOfInterest: AssessmentPoint;
    otherEthicalDilemmas: AssessmentPoint;
    bloodSampling: AssessmentPoint;
  };
  decision: 'Qualified for Exemption' | 'Unqualified for Exemption' | null;
  justification: string;
}

const INITIAL_FORM_DATA: ExemptionChecklist = {
  spupRecProtocolCode: '',
  submissionDate: '',
  protocolTitle: '',
  studySite: '',
  principalInvestigator: '',
  sponsor: '',
  protocolAssessment: {
    humanParticipants: { value: null },
    biologicalSamples: { value: null },
    publicData: { value: null },
    humanInteraction: { value: null },
    researchType: {
      qualityAssurance: { value: null },
      publicServiceEvaluation: { value: null },
      healthSurveillance: { value: null },
      educationalEvaluation: { value: null },
      consumerTest: { value: null },
    },
    dataCollection: {
      surveys: { value: null },
      interviews: { value: null },
      publicObservations: { value: null },
      existingData: { value: null },
      recordings: { value: null },
    },
    dataAnonymity: null,
    dataAnonymityComments: '',
    foreseeableRisk: { value: null },
  },
  riskAssessment: {
    vulnerableGroups: { value: null, comments: '' },
    sensitiveTopics: { value: null, comments: '' },
    drugs: { value: null, comments: '' },
    invasiveProcedure: { value: null, comments: '' },
    physicalStress: { value: null, comments: '' },
    psychologicalStress: { value: null, comments: '' },
    deception: { value: null, comments: '' },
    dataAccess: { value: null, comments: '' },
    conflictOfInterest: { value: null, comments: '' },
    otherEthicalDilemmas: { value: null, comments: '' },
    bloodSampling: { value: null, comments: '' },
  },
  decision: null,
  justification: '',
};

export default function ExemptionChecklistForm() {
  const { reviewerId, reviewerCode, reviewerName } = useReviewer();
  const router = useRouter();
  const [formData, setFormData] = useState<ExemptionChecklist>(INITIAL_FORM_DATA);
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
    const value = e.target.type === 'radio' ? e.target.value : e.target.value;
    
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
      const exemptionChecklistsCollection = collection(db, 'exemption-checklists');
      await addDoc(exemptionChecklistsCollection, {
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
      console.error('Error submitting exemption checklist review:', err);
      setError('Failed to submit exemption checklist review');
    } finally {
      setLoading(false);
    }
  };

  const renderYesNoQuestion = (
    label: string,
    fieldPath: string,
    assessment: AssessmentPoint
  ) => (
    <div className={styles.assessmentPoint}>
      <div className={styles.assessmentHeader}>
        <h4 className={styles.assessmentTitle}>{label}</h4>
      </div>
      <div className={styles.assessmentContent}>
        <div className={styles.radioGroup}>
          {['Yes', 'No'].map((option) => (
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
          <label className={styles.commentsLabel}>Comments:</label>
          <textarea
            value={assessment.comments || ''}
            onChange={(e) => handleInputChange(e, `${fieldPath}.comments`)}
            className={styles.assessmentComments}
          />
        </div>
      </div>
    </div>
  );

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Checklist for Exemption</h1>

      <div className={styles.formContainer}>
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
            <h2>II. Protocol Assessment</h2>
            {renderYesNoQuestion(
              '1. Does this research involve human participants?',
              'protocolAssessment.humanParticipants',
              formData.protocolAssessment.humanParticipants
            )}
            {renderYesNoQuestion(
              '2. Does this research involve use of non-identifiable human tissue/biological samples?',
              'protocolAssessment.biologicalSamples',
              formData.protocolAssessment.biologicalSamples
            )}
            {renderYesNoQuestion(
              '3. Does this research involve use of non-identifiable publicly available data?',
              'protocolAssessment.publicData',
              formData.protocolAssessment.publicData
            )}
            <p className={styles.note}><em>Note: Protocols that neither involve human participants, nor identifiable human tissue, biological samples and data shall be exempted from review (NEGHHR 2017).</em></p>

            {renderYesNoQuestion(
              '4. Does this research involve interaction with human participants?',
              'protocolAssessment.humanInteraction',
              formData.protocolAssessment.humanInteraction
            )}

            <h3>5. Type of Research</h3>
            {renderYesNoQuestion(
              '5.1. Institutional quality assurance',
              'protocolAssessment.researchType.qualityAssurance',
              formData.protocolAssessment.researchType.qualityAssurance
            )}
            {renderYesNoQuestion(
              '5.2. Evaluation of public service program',
              'protocolAssessment.researchType.publicServiceEvaluation',
              formData.protocolAssessment.researchType.publicServiceEvaluation
            )}
            {renderYesNoQuestion(
              '5.3. Public health surveillance',
              'protocolAssessment.researchType.healthSurveillance',
              formData.protocolAssessment.researchType.healthSurveillance
            )}
            {renderYesNoQuestion(
              '5.4. Educational evaluation activities',
              'protocolAssessment.researchType.educationalEvaluation',
              formData.protocolAssessment.researchType.educationalEvaluation
            )}
            {renderYesNoQuestion(
              '5.5. Consumer acceptability test',
              'protocolAssessment.researchType.consumerTest',
              formData.protocolAssessment.researchType.consumerTest
            )}
            <p className={styles.note}><em>Note: These 5 have been identified in the NEGHHR as exemptible, as long as it does not involve more than minimal risk.</em></p>

            <h3>6. What is/are the method/s of data collection?</h3>
            {renderYesNoQuestion(
              '6.1. Surveys and /or questionnaire',
              'protocolAssessment.dataCollection.surveys',
              formData.protocolAssessment.dataCollection.surveys
            )}
            {renderYesNoQuestion(
              '6.2. Interviews or focus group discussion',
              'protocolAssessment.dataCollection.interviews',
              formData.protocolAssessment.dataCollection.interviews
            )}
            {renderYesNoQuestion(
              '6.3. Public observations',
              'protocolAssessment.dataCollection.publicObservations',
              formData.protocolAssessment.dataCollection.publicObservations
            )}
            {renderYesNoQuestion(
              '6.4. Research which only uses existing data',
              'protocolAssessment.dataCollection.existingData',
              formData.protocolAssessment.dataCollection.existingData
            )}
            {renderYesNoQuestion(
              '6.5. Audio/video recordings',
              'protocolAssessment.dataCollection.recordings',
              formData.protocolAssessment.dataCollection.recordings
            )}
            <p className={styles.note}><em>Note: These 5 have been identified in the NEGHHR as exemptible, as long as anonymity and/or confidentiality is maintained.</em></p>

            <div className={styles.assessmentPoint}>
              <div className={styles.assessmentHeader}>
                <h4 className={styles.assessmentTitle}>
                  7. Will the collected data be anonymized or identifiable?
                </h4>
              </div>
              <div className={styles.assessmentContent}>
                <div className={styles.radioGroup}>
                  {['Anonymized', 'Identifiable', 'De-identified'].map((option) => (
                    <label key={option} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="protocolAssessment.dataAnonymity"
                        value={option}
                        checked={formData.protocolAssessment.dataAnonymity === option}
                        onChange={(e) => handleInputChange(e, 'protocolAssessment.dataAnonymity')}
                        className={styles.radio}
                      />
                      {option}
                    </label>
                  ))}
                </div>
                <div className={styles.commentsSection}>
                  <label className={styles.commentsLabel}>Comments:</label>
                  <textarea
                    value={formData.protocolAssessment.dataAnonymityComments || ''}
                    onChange={(e) => handleInputChange(e, 'protocolAssessment.dataAnonymityComments')}
                    className={styles.assessmentComments}
                  />
                </div>
              </div>
            </div>

            {renderYesNoQuestion(
              '8. Is this research likely to involve any foreseeable risk of harm or discomfort to participants; above the level experienced in everyday life? (NEGHRR 2017)',
              'protocolAssessment.foreseeableRisk',
              formData.protocolAssessment.foreseeableRisk
            )}
            <p className={styles.note}><em>Note: Please refer to section III. Risk Assessment, prior to answering this item.</em></p>
            <p className={styles.note}><em>Note: If Yes, then this protocol does not qualify for exemption.</em></p>
          </div>

          <div className={styles.formSection}>
            <h2>III. Risk Assessment</h2>
            <h3>9. Does this research involve the following:</h3>
            {renderYesNoQuestion(
              '9.1. Any vulnerable group/s',
              'riskAssessment.vulnerableGroups',
              formData.riskAssessment.vulnerableGroups
            )}
            {renderYesNoQuestion(
              '9.2. Sensitive topics that may make participants feel uncomfortable (i.e. sexual behavior, illegal activities, racial biases, etc.)',
              'riskAssessment.sensitiveTopics',
              formData.riskAssessment.sensitiveTopics
            )}
            {renderYesNoQuestion(
              '9.3. Use of Drugs',
              'riskAssessment.drugs',
              formData.riskAssessment.drugs
            )}
            {renderYesNoQuestion(
              '9.4. Invasive procedure (e.g. blood sampling)',
              'riskAssessment.invasiveProcedure',
              formData.riskAssessment.invasiveProcedure
            )}
            {renderYesNoQuestion(
              '9.5. Physical stress/distress, discomfort',
              'riskAssessment.physicalStress',
              formData.riskAssessment.physicalStress
            )}
            {renderYesNoQuestion(
              '9.6. Psychological/mental stress/distress',
              'riskAssessment.psychologicalStress',
              formData.riskAssessment.psychologicalStress
            )}
            {renderYesNoQuestion(
              '9.7. Deception of/or withholding information from subjects',
              'riskAssessment.deception',
              formData.riskAssessment.deception
            )}
            {renderYesNoQuestion(
              '9.8. Access to data by individuals or organizations other than the investigators',
              'riskAssessment.dataAccess',
              formData.riskAssessment.dataAccess
            )}
            {renderYesNoQuestion(
              '9.9. Conflict of interest issues',
              'riskAssessment.conflictOfInterest',
              formData.riskAssessment.conflictOfInterest
            )}
            {renderYesNoQuestion(
              '9.10. Or any other ethical dilemmas',
              'riskAssessment.otherEthicalDilemmas',
              formData.riskAssessment.otherEthicalDilemmas
            )}
            {renderYesNoQuestion(
              '9.11. Is there any blood sampling involved in the study',
              'riskAssessment.bloodSampling',
              formData.riskAssessment.bloodSampling
            )}
          </div>

          <div className={styles.formSection}>
            <h2>Decision</h2>
            <div className={styles.formGroup}>
              <div className={styles.radioGroup}>
                {['Qualified for Exemption', 'Unqualified for Exemption'].map((option) => (
                  <label key={option} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="decision"
                      value={option}
                      checked={formData.decision === option}
                      onChange={(e) => handleInputChange(e, 'decision')}
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
                Justification for the Decision:
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
              Exemption checklist review submitted successfully!
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Submitting...' : 'Submit Exemption Checklist Review'}
          </button>
        </form>
      </div>
    </main>
  );
} 