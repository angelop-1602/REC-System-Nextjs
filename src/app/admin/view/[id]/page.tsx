'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import styles from '@/styles/Home.module.css';
import { FaFilePdf, FaFileImage, FaFile } from 'react-icons/fa';

interface Reviewer {
  reviewer_name: string;
  form: string;
  status: 'Pending' | 'In Review' | 'Completed';
}

interface PaperData {
  id: string;
  researchTitle: string;
  principalInvestigator: string;
  courseProgram: string;
  adviser: string;
  emailAddress: string;
  mainFolder?: string;
  status: string;
  reviewer1: Reviewer;
  reviewer2: Reviewer;
  reviewer3: Reviewer;
  files?: {
    [key: string]: {
      name: string;
      type: string;
      size: number;
      path?: string;
    };
  };
  createdAt: any;
  submissionDate: any;
}

interface PageParams {
  id: string;
}

export default function ViewApplication({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params);
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [protocolCode, setProtocolCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    url: string;
  } | null>(null);
  const [reviewers, setReviewers] = useState<{ id: string; name: string }[]>([]);

  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length < 2) return 'XX'; // Default if name format is invalid
    
    const firstName = names[0];
    const lastName = names[names.length - 1];
    
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  useEffect(() => {
    fetchPaper();
    fetchReviewers();
  }, [id]);

  const fetchPaper = async () => {
    try {
      const paperDoc = await getDoc(doc(db, 'applications', id));
      if (paperDoc.exists()) {
        const data = paperDoc.data();
        const initials = getInitials(data.principalInvestigator || '');
        setPaper({
          id: paperDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          submissionDate: data.submissionDate?.toDate()
        } as PaperData);
        // Set initial protocol code using document ID and PI initials
        const currentYear = new Date().getFullYear();
        setProtocolCode(`SPUP_${currentYear}_00001_SR_${initials}`);
      } else {
        setError('Application not found');
      }
    } catch (err) {
      console.error('Error fetching paper:', err);
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewers = async () => {
    try {
      const reviewersRef = collection(db, 'reviewers');
      const snapshot = await getDocs(reviewersRef);
      const reviewersList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setReviewers(reviewersList);
    } catch (err) {
      console.error('Error fetching reviewers:', err);
    }
  };

  const handleAssignProtocolCode = async () => {
    if (!paper || !protocolCode.trim()) {
      setError('Please enter a protocol code');
      return;
    }

    // Validate protocol code format with PI initials
    const piInitials = getInitials(paper.principalInvestigator);
    const expectedFormat = new RegExp(`SPUP_\\d{4}_\\d{5}_SR_${piInitials}`);
    
    if (!expectedFormat.test(protocolCode)) {
      setError('Invalid protocol code format. Please use SPUP_YEAR_NUMBER_SR_INITIALS format');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const paperRef = doc(db, 'applications', paper.id);
      await updateDoc(paperRef, {
        mainFolder: protocolCode,
        updatedAt: serverTimestamp()
      });

      setSuccess('Protocol code assigned successfully');
      setPaper(prev => prev ? { ...prev, mainFolder: protocolCode } : null);
    } catch (err) {
      console.error('Error assigning protocol code:', err);
      setError('Failed to assign protocol code');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectFile = async (key: string, file: { name: string; type: string; path?: string }) => {
    try {
      setLoading(true);
      const fileRef = ref(storage, file.path);
      const url = await getDownloadURL(fileRef);
      setSelectedFile({
        name: file.name,
        type: file.type,
        url: url
      });
      setShowFileModal(true);
    } catch (err) {
      console.error('Error getting file URL:', err);
      setError('Failed to load file for inspection');
    } finally {
      setLoading(false);
    }
  };

  // Update the form options constant
  const REVIEW_FORMS = [
    { value: 'protocol_review', label: 'Protocol Review Form' },
    { value: 'risk_assessment', label: 'Risk Assessment Form' },
    { value: 'informed_consent', label: 'Informed Consent Checklist' },
    { value: 'research_instruments', label: 'Research Instruments Review Form' }
  ];

  // Update the handleReviewerAssignment function
  const handleReviewerAssignment = async (
    reviewerKey: 'reviewer1' | 'reviewer2' | 'reviewer3',
    reviewerName: string,
    formType: string
  ) => {
    if (!paper) return;

    try {
      await updateDoc(doc(db, 'applications', paper.id), {
        [reviewerKey]: {
          reviewer_name: reviewerName,
          form: formType,
          status: 'Pending'
        },
        updatedAt: serverTimestamp()
      });

      setPaper(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [reviewerKey]: {
            reviewer_name: reviewerName,
            form: formType,
            status: 'Pending'
          }
        };
      });
    } catch (err) {
      console.error('Error assigning reviewer:', err);
      setError('Failed to assign reviewer');
    }
  };

  const FileInspectModal = () => {
    if (!showFileModal || !selectedFile) return null;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.fileInspectModal}>
          <div className={styles.modalHeader}>
            <h2>{selectedFile.name}</h2>
            <button
              onClick={() => {
                setShowFileModal(false);
                setSelectedFile(null);
              }}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>
          <div className={styles.fileViewer}>
            {selectedFile.type.includes('pdf') ? (
              <iframe
                src={`${selectedFile.url}#toolbar=0`}
                className={styles.pdfViewer}
                title="PDF Viewer"
              />
            ) : selectedFile.type.includes('image') ? (
              <img
                src={selectedFile.url}
                alt={selectedFile.name}
                className={styles.imageViewer}
              />
            ) : (
              <div className={styles.fileInfo}>
                <p>File type: {selectedFile.type}</p>
                <p>File name: {selectedFile.name}</p>
                <a
                  href={selectedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.button}
                >
                  Open in New Tab
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!paper) {
    return <div className={styles.error}>Application not found</div>;
  }

  return (
    <main className={styles.main}>
      <Link href="/admin" className={styles.backLink}>
        &larr; Back to Admin Dashboard
      </Link>

      {/* Protocol Code Section */}
      <div className={styles.protocolSection}>
        <h2>Protocol Information</h2>
        <div className={styles.protocolCodeSection}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Protocol Code:
              <input
                type="text"
                value={protocolCode}
                onChange={(e) => setProtocolCode(e.target.value)}
                className={styles.textInput}
                placeholder="Enter protocol code"
              />
            </label>
            <button
              onClick={handleAssignProtocolCode}
              disabled={loading}
              className={styles.button}
            >
              {loading ? 'Assigning...' : 'Assign Protocol Code'}
            </button>
          </div>
        </div>
      </div>

      {/* Application Details and Files Section */}
      <div className={styles.applicationSection}>
        <h2>Application Details</h2>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <label>Document ID</label>
            <p>{paper?.id}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Research Title</label>
            <p>{paper?.researchTitle}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Principal Investigator</label>
            <p>{paper?.principalInvestigator}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Course/Program</label>
            <p>{paper?.courseProgram}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Adviser</label>
            <p>{paper?.adviser}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Email Address</label>
            <p>{paper?.emailAddress}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Status</label>
            <p>{paper?.status}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Submission Date</label>
            <p>{paper?.submissionDate ? paper?.submissionDate.toLocaleDateString() : 'Not available'}</p>
          </div>
        </div>

        {/* Files Section */}
        <div className={styles.filesSection}>
          <h3>Uploaded Files</h3>
          <div className={styles.filesList}>
            {paper?.files ? (
              Object.entries(paper.files).map(([key, file]) => (
                <div key={key} className={styles.fileItem}>
                  <div className={styles.fileItemLeft}>
                    {file.type.includes('pdf') ? (
                      <FaFilePdf className={styles.fileIcon} />
                    ) : file.type.includes('image') ? (
                      <FaFileImage className={styles.fileIcon} />
                    ) : (
                      <FaFile className={styles.fileIcon} />
                    )}
                    <span className={styles.fileName}>{key}:</span>
                    <span className={styles.fileNameText}>{file.name}</span>
                  </div>
                  <button
                    onClick={() => handleInspectFile(key, file)}
                    className={styles.inspectButton}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Inspect'}
                  </button>
                </div>
              ))
            ) : (
              <p>No files uploaded</p>
            )}
          </div>
        </div>
      </div>

      {/* Application Review Section */}
      <div className={styles.reviewSection}>
        <h2>Application Review</h2>
        
        {/* Reviewer Assignment Section */}
        <div className={styles.reviewerSection}>
          <h3>Reviewer Assignment</h3>
          <div className={styles.reviewerColumns}>
            {/* Reviewer 1 Column */}
            <div className={styles.reviewerColumn}>
              <h4>Reviewer 1</h4>
              <div className={styles.formGroup}>
                <label>Reviewer Name</label>
                <select 
                  className={styles.select}
                  onChange={(e) => {
                    const newName = e.target.value;
                    handleReviewerAssignment(
                      'reviewer1',
                      newName,
                      paper.reviewer1.form
                    );
                  }}
                  value={paper.reviewer1.reviewer_name}
                >
                  <option value="">Select Reviewer</option>
                  {reviewers.map(reviewer => (
                    <option key={reviewer.id} value={reviewer.name}>
                      {reviewer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Review Form</label>
                <select 
                  className={styles.select}
                  onChange={(e) => {
                    const newForm = e.target.value;
                    handleReviewerAssignment(
                      'reviewer1',
                      paper.reviewer1.reviewer_name,
                      newForm
                    );
                  }}
                  value={paper.reviewer1.form}
                >
                  <option value="">Select Form</option>
                  {REVIEW_FORMS.map(form => (
                    <option key={form.value} value={form.value}>
                      {form.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.reviewStatus}>
                <label>Status:</label>
                <span className={`${styles.status} ${styles[paper.reviewer1.status.toLowerCase()]}`}>
                  {paper.reviewer1.status}
                </span>
              </div>
            </div>

            {/* Reviewer 2 Column */}
            <div className={styles.reviewerColumn}>
              <h4>Reviewer 2</h4>
              <div className={styles.formGroup}>
                <label>Reviewer Name</label>
                <select 
                  className={styles.select}
                  onChange={(e) => {
                    const newName = e.target.value;
                    handleReviewerAssignment(
                      'reviewer2',
                      newName,
                      paper.reviewer2.form
                    );
                  }}
                  value={paper.reviewer2.reviewer_name}
                >
                  <option value="">Select Reviewer</option>
                  {reviewers.map(reviewer => (
                    <option key={reviewer.id} value={reviewer.name}>
                      {reviewer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Review Form</label>
                <select 
                  className={styles.select}
                  onChange={(e) => {
                    const newForm = e.target.value;
                    handleReviewerAssignment(
                      'reviewer2',
                      paper.reviewer2.reviewer_name,
                      newForm
                    );
                  }}
                  value={paper.reviewer2.form}
                >
                  <option value="">Select Form</option>
                  {REVIEW_FORMS.map(form => (
                    <option key={form.value} value={form.value}>
                      {form.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.reviewStatus}>
                <label>Status:</label>
                <span className={`${styles.status} ${styles[paper.reviewer2.status.toLowerCase()]}`}>
                  {paper.reviewer2.status}
                </span>
              </div>
            </div>

            {/* Reviewer 3 Column */}
            <div className={styles.reviewerColumn}>
              <h4>Reviewer 3</h4>
              <div className={styles.formGroup}>
                <label>Reviewer Name</label>
                <select 
                  className={styles.select}
                  onChange={(e) => {
                    const newName = e.target.value;
                    handleReviewerAssignment(
                      'reviewer3',
                      newName,
                      paper.reviewer3.form
                    );
                  }}
                  value={paper.reviewer3.reviewer_name}
                >
                  <option value="">Select Reviewer</option>
                  {reviewers.map(reviewer => (
                    <option key={reviewer.id} value={reviewer.name}>
                      {reviewer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Review Form</label>
                <select 
                  className={styles.select}
                  onChange={(e) => {
                    const newForm = e.target.value;
                    handleReviewerAssignment(
                      'reviewer3',
                      paper.reviewer3.reviewer_name,
                      newForm
                    );
                  }}
                  value={paper.reviewer3.form}
                >
                  <option value="">Select Form</option>
                  {REVIEW_FORMS.map(form => (
                    <option key={form.value} value={form.value}>
                      {form.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.reviewStatus}>
                <label>Status:</label>
                <span className={`${styles.status} ${styles[paper.reviewer3.status.toLowerCase()]}`}>
                  {paper.reviewer3.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Buttons */}
        <div className={styles.approvalSection}>
          <div className={styles.buttonGroup}>
            <button className={`${styles.button} ${styles.approveButton}`}>
              Approve Application
            </button>
            <button className={`${styles.button} ${styles.rejectButton}`}>
              Reject Application
            </button>
          </div>
        </div>
      </div>

      <FileInspectModal />
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </main>
  );
} 