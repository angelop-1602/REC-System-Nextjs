'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, setDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import styles from '@/styles/Home.module.css';

interface Reviewer {
  reviewer_name: string;
  form: string;
  status: 'Pending' | 'In Review' | 'Completed';
}

interface ApplicationForm {
  researchTitle: string;
  principalInvestigator: string;
  courseProgram: string;
  adviser: string;
  emailAddress: string;
  files: {
    protocolReview: File | null;
    endorsementLetter: File | null;
    minutesOfDefense: File | null;
    researchProposal: File | null;
    informedConsent: File | null;
    technicalReview: File | null;
    questionnaire: File | null;
    curriculumVitae: File | null;
    paymentProof: File | null;
  };
}

type TabType = 'submit' | 'edit';

const INITIAL_FORM_DATA: ApplicationForm = {
  researchTitle: '',
  principalInvestigator: '',
  courseProgram: '',
  adviser: '',
  emailAddress: '',
  files: {
    protocolReview: null,
    endorsementLetter: null,
    minutesOfDefense: null,
    researchProposal: null,
    informedConsent: null,
    technicalReview: null,
    questionnaire: null,
    curriculumVitae: null,
    paymentProof: null
  }
};

const FILE_TYPES = {
  protocolReview: 'Protocol Review Application',
  endorsementLetter: 'Endorsement Letter/Adviser\'s Certification',
  minutesOfDefense: 'Minutes of the Proposal Defense',
  researchProposal: 'Research Proposal/Study Protocol',
  informedConsent: 'Informed Consent of the Study',
  technicalReview: 'Technical Review Approval',
  questionnaire: 'Questionnaire',
  curriculumVitae: 'Curriculum Vitae of Researchers',
  paymentProof: 'Official Receipt/Proof of payment for ethics review'
};

// Add new constant for file extensions mapping
const FILE_EXTENSIONS: { [key: string]: string } = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

// Add form types mapping
const REVIEW_FORMS = {
  'form1': 'Protocol Review Form',
  'form2': 'Risk Assessment Form',
  'form3': 'Informed Consent Checklist',
  'form4': 'Research Instruments Review Form'
};

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('submit');
  const [formData, setFormData] = useState<ApplicationForm>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [application, setApplication] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  const [files, setFiles] = useState<{ [key: string]: File } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: keyof ApplicationForm['files']
  ) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      files: {
        ...prev.files,
        [fileType]: file
      }
    }));
  };

  const getFileExtension = (file: File): string => {
    return FILE_EXTENSIONS[file.type] || '.pdf';
  };

  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length < 2) return 'XX'; // Default if name format is invalid
    
    const firstName = names[0];
    const lastName = names[names.length - 1];
    
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const generateDocumentId = async (principalInvestigator: string) => {
    try {
      const year = new Date().getFullYear();
      const initials = getInitials(principalInvestigator);
      
      // Get all documents for the current year
      const applicationsRef = collection(db, 'applications');
      const q = query(applicationsRef, where('year', '==', year));
      const snapshot = await getDocs(q);
      
      // Find the highest number used
      let maxNumber = 0;
      snapshot.docs.forEach(doc => {
        const match = doc.id.match(/SPUP_\d{4}_(\d{5})_SR_[A-Z]{2}/);
        if (match) {
          const num = parseInt(match[1]);
          maxNumber = Math.max(maxNumber, num);
        }
      });
      
      // Generate new ID with incremented number
      const nextNumber = (maxNumber + 1).toString().padStart(5, '0');
      return `SPUP_${year}_${nextNumber}_SR_${initials}`;
    } catch (error) {
      console.error('Error generating document ID:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const documentId = await generateDocumentId(formData.principalInvestigator);
      const applicationsCollection = collection(db, 'applications');
      const newDocRef = doc(applicationsCollection, documentId);

      // Upload files first
      const uploadPromises = Object.entries(formData.files).map(async ([key, file]) => {
        if (!file) return null;
        
        const storageRef = ref(storage, `applications/${documentId}/${file.name}`);
        await uploadBytes(storageRef, file);
        
        return {
          key,
          metadata: {
            name: file.name,
            type: file.type,
            size: file.size,
            path: `applications/${documentId}/${file.name}`
          }
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const filesData = uploadedFiles.reduce((acc, file) => {
        if (file) {
          acc[file.key] = file.metadata;
        }
        return acc;
      }, {} as { [key: string]: any });

      // Save application data with the new document ID
      await setDoc(newDocRef, {
        ...formData,
        files: filesData,
        status: 'Pending',
        reviewer1: {
          reviewer_name: '',
          form: '',
          status: 'Pending'
        },
        reviewer2: {
          reviewer_name: '',
          form: '',
          status: 'Pending'
        },
        reviewer3: {
          reviewer_name: '',
          form: '',
          status: 'Pending'
        },
        submissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        year: new Date().getFullYear()
      });

      setSuccess('Application submitted successfully');
      setDocumentId(documentId);
      setShowModal(true);
      setFormData(INITIAL_FORM_DATA);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApplication(null);

    try {
      const docRef = doc(db, 'applications', documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('No application found with this ID. Please check and try again.');
        return;
      }

      const data = docSnap.data();
      setApplication({ ...data, id: docSnap.id });
      setFormData({
        ...INITIAL_FORM_DATA,
        researchTitle: data.researchTitle,
        principalInvestigator: data.principalInvestigator,
        courseProgram: data.courseProgram,
        adviser: data.adviser,
        emailAddress: data.emailAddress,
        files: data.files || INITIAL_FORM_DATA.files
      });
    } catch (err) {
      console.error('Error searching for application:', err);
      setError('Failed to search for application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setLoading(true);
    setError('');

    try {
      const applicationRef = doc(db, 'applications', application.id);
      await updateDoc(applicationRef, {
        ...formData,
        files: Object.fromEntries(
          Object.entries(formData.files).map(([key, file]) => [
            key,
            file instanceof File 
              ? { name: file.name, type: file.type, size: file.size }
              : file
          ])
        ),
        updatedAt: new Date()
      });

      setApplication((prev: ApplicationForm | null) => prev ? { ...prev, ...formData } : null);
      setEditMode(false);
      setError('Application updated successfully!');
    } catch (err) {
      console.error('Error updating application:', err);
      setError('Failed to update application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setApplication(null);
    setEditMode(false);
    setError('');
    setDocumentId('');
    setFormData(INITIAL_FORM_DATA);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setDocumentId('');
    setSuccess('');
    // Reset form data to initial state
    setFormData(INITIAL_FORM_DATA);
    // Reset any file input elements
    Object.keys(FILE_TYPES).forEach(key => {
      const fileInput = document.getElementById(key) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    });
  };

  const renderSubmitForm = () => (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="researchTitle" className={styles.label}>
          1. Research Title <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="researchTitle"
          name="researchTitle"
          value={formData.researchTitle}
          onChange={handleInputChange}
          className={styles.textInput}
          placeholder="Enter your answer"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="principalInvestigator" className={styles.label}>
          2. Lead Researcher/Group Leader/Name of Principal Investigator <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="principalInvestigator"
          name="principalInvestigator"
          value={formData.principalInvestigator}
          onChange={handleInputChange}
          className={styles.textInput}
          placeholder="Enter your answer"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="courseProgram" className={styles.label}>
          3. Course/Program <span className={styles.required}>*</span>
          <span className={styles.hint}>Only put the acronym ex. DIT</span>
        </label>
        <input
          type="text"
          id="courseProgram"
          name="courseProgram"
          value={formData.courseProgram}
          onChange={handleInputChange}
          className={styles.textInput}
          placeholder="Enter your answer"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="adviser" className={styles.label}>
          4. Adviser <span className={styles.required}>*</span>
          <span className={styles.hint}>Including their Extension Name (ex. Juan T. Dela Cruz, DPA)</span>
        </label>
        <input
          type="text"
          id="adviser"
          name="adviser"
          value={formData.adviser}
          onChange={handleInputChange}
          className={styles.textInput}
          placeholder="Enter your answer"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="emailAddress" className={styles.label}>
          5. Email Address <span className={styles.required}>*</span>
        </label>
        <input
          type="email"
          id="emailAddress"
          name="emailAddress"
          value={formData.emailAddress}
          onChange={handleInputChange}
          className={styles.textInput}
          placeholder="Enter your answer"
          required
        />
      </div>

      <div className={styles.fileUploadsSection}>
        <h2>Documents</h2>
        {Object.entries(FILE_TYPES).map(([key, label]) => (
          <div key={key} className={styles.fileUploadGroup}>
            <label htmlFor={key} className={styles.label}>
              {label}
              {key === 'technicalReview' && <span className={styles.optional}>(if applicable)</span>}
            </label>
            <input
              type="file"
              id={key}
              onChange={(e) => handleFileChange(e, key as keyof ApplicationForm['files'])}
              className={styles.fileInput}
              accept=".pdf,.doc,.docx"
            />
            {formData.files[key as keyof ApplicationForm['files']] && (
              <span className={styles.fileName}>
                Selected: {formData.files[key as keyof ApplicationForm['files']]?.name}
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={styles.submitButton}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>

      {error && (
        <p className={styles.error}>
          {error}
        </p>
      )}
    </form>
  );

  const renderEditSection = () => {
    if (!application) {
      return (
        <form onSubmit={handleSearch} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="documentId" className={styles.label}>
              Enter your Document ID
            </label>
            <input
              type="text"
              id="documentId"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className={styles.textInput}
              placeholder="Enter your Document ID"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      );
    }

    if (editMode) {
      return (
        <form onSubmit={handleUpdate} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="researchTitle" className={styles.label}>
              Research Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="researchTitle"
              name="researchTitle"
              value={formData.researchTitle}
              onChange={handleInputChange}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="principalInvestigator" className={styles.label}>
              Principal Investigator <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="principalInvestigator"
              name="principalInvestigator"
              value={formData.principalInvestigator}
              onChange={handleInputChange}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="courseProgram" className={styles.label}>
              Course/Program <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="courseProgram"
              name="courseProgram"
              value={formData.courseProgram}
              onChange={handleInputChange}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="adviser" className={styles.label}>
              Adviser <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="adviser"
              name="adviser"
              value={formData.adviser}
              onChange={handleInputChange}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="emailAddress" className={styles.label}>
              Email Address <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              id="emailAddress"
              name="emailAddress"
              value={formData.emailAddress}
              onChange={handleInputChange}
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.fileUploadsSection}>
            <h2>Documents</h2>
            {Object.entries(FILE_TYPES).map(([key, label]) => (
              <div key={key} className={styles.fileUploadGroup}>
                <label htmlFor={`edit-${key}`} className={styles.label}>
                  {label}
                  {key === 'technicalReview' && <span className={styles.optional}>(if applicable)</span>}
                </label>
                <input
                  type="file"
                  id={`edit-${key}`}
                  onChange={(e) => handleFileChange(e, key as keyof ApplicationForm['files'])}
                  className={styles.fileInput}
                  accept=".pdf,.doc,.docx"
                />
                {formData.files[key as keyof ApplicationForm['files']] && (
                  <span className={styles.fileName}>
                    Selected: {
                      formData.files[key as keyof ApplicationForm['files']] instanceof File 
                        ? (formData.files[key as keyof ApplicationForm['files']] as File).name
                        : (formData.files[key as keyof ApplicationForm['files']] as any)?.name || 'Previously uploaded file'
                    }
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className={styles.applicationDetails}>
        <h2>Application Details</h2>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <label>Research Title:</label>
            <p>{application.researchTitle}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Principal Investigator:</label>
            <p>{application.principalInvestigator}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Course/Program:</label>
            <p>{application.courseProgram}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Adviser:</label>
            <p>{application.adviser}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Email Address:</label>
            <p>{application.emailAddress}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Status:</label>
            <p>{application.status}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Uploaded Documents:</label>
            <div className={styles.filesList}>
              {Object.entries(FILE_TYPES).map(([key, label]) => {
                const file = application.files?.[key];
                return file ? (
                  <div key={key} className={styles.fileItem}>
                    <span>{label}:</span> {file.name}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        <button
          onClick={() => setEditMode(true)}
          className={styles.editButton}
          disabled={application.status !== 'Pending'}
        >
          Edit Application
        </button>
        {application.status !== 'Pending' && (
          <p className={styles.note}>
            Note: You can only edit applications that are still pending review.
          </p>
        )}
      </div>
    );
  };

  const SuccessModal = () => {
    if (!showModal) return null;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Application Submitted Successfully!</h2>
            <div className={styles.documentInfo}>
              <p>Your Document ID is:</p>
              <div className={styles.documentId}>{documentId}</div>
              <p className={styles.documentNote}>
                Please save this Document ID. You will need it to edit your submission later.
              </p>
            </div>
            <button 
              onClick={handleModalClose}
              className={styles.modalButton}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.backLink}>
        &larr; Back to Home
      </Link>

      <h1 className={styles.title}>SPUP REC Online Application System</h1>

      <div className={styles.formContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'submit' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('submit')}
          >
            Submit New Application
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'edit' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('edit')}
          >
            Edit Existing Application
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        
        {activeTab === 'submit' ? renderSubmitForm() : renderEditSection()}
        
        {/* Add Modal Component */}
        <SuccessModal />
      </div>
    </main>
  );
} 