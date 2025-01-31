'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { storage, db } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import styles from '@/styles/Home.module.css';
import { useParams } from 'next/navigation';

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

interface ReviewFormLayoutProps {
  children: React.ReactNode;
  formTitle: string;
}

const styles = {
  protocolInfo: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#4a5568',
  },
  detailValue: {
    color: '#2d3748',
  },
};

export default function ReviewFormLayout({ children, formTitle }: ReviewFormLayoutProps) {
  const params = useParams();
  const documentId = params.id as string;
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [paperData, setPaperData] = useState<PaperData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ url: string; type: string; name: string } | null>(null);

  useEffect(() => {
    async function fetchPaperData() {
      if (!documentId) return;

      try {
        const docRef = doc(db, 'applications', documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPaperData({
            id: documentId,
            researchTitle: data.researchTitle || '',
            principalInvestigator: data.principalInvestigator || '',
            courseProgram: data.courseProgram || '',
            files: data.files || {}
          });
        } else {
          setError('Paper not found');
        }
      } catch (err) {
        console.error('Error fetching paper:', err);
        setError('Failed to load paper data');
      } finally {
        setLoading(false);
      }
    }

    fetchPaperData();
  }, [documentId]);

  const handleFileView = async (key: string, file: FileData) => {
    try {
      if (!file.path) {
        setError('File path not found');
        return;
      }

      const fileRef = ref(storage, file.path);
      const url = await getDownloadURL(fileRef);
      
      setModalContent({
        url,
        type: file.type,
        name: file.name
      });
      setShowModal(true);
    } catch (err) {
      console.error('Error getting file URL:', err);
      setError('Failed to load file');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>Loading paper data...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.error}>{error}</div>
        <Link href="/reviewer" className={styles.backLink}>
          &larr; Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Link href="/reviewer" className={styles.backLink}>
        &larr; Back to Dashboard
      </Link>

      {/* Paper Information Section */}
      {paperData && (
        <div className={styles.protocolInfo}>
          <h2>Protocol Information</h2>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Protocol Code:</span>
              <span className={styles.detailValue}>{paperData.id}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Research Title:</span>
              <span className={styles.detailValue}>{paperData.researchTitle}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Principal Investigator:</span>
              <span className={styles.detailValue}>{paperData.principalInvestigator}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Course/Program:</span>
              <span className={styles.detailValue}>{paperData.courseProgram}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Submission Date:</span>
              <span className={styles.detailValue}>
                {paperData.createdAt ? new Date(paperData.createdAt.seconds * 1000).toLocaleDateString() : ''}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Study Site:</span>
              <span className={styles.detailValue}>{paperData.studySite}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Sponsor/Organization:</span>
              <span className={styles.detailValue}>{paperData.sponsor}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Type of Review:</span>
              <span className={styles.detailValue}>{paperData.typeOfReview}</span>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Layout for Form and Files */}
      <div className={styles.reviewContainer}>
        {/* Left Column - Form */}
        <div className={styles.formColumn}>
          <h2>{formTitle}</h2>
          {children}
        </div>

        {/* Right Column - Files (Fixed Position) */}
        <div className={styles.filesColumn}>
          <div className={styles.filesWrapper}>
            <h3>Submitted Files</h3>
            <div className={styles.filesList}>
              {Object.entries(paperData?.files || {}).map(([key, file]) => (
                <div key={key} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.name}</span>
                    <button
                      onClick={() => handleFileView(key, file)}
                      className={styles.viewButton}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* File Viewer Modal */}
      {showModal && modalContent && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{modalContent.name}</h3>
              <button onClick={closeModal} className={styles.closeButton}>
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              {modalContent.type.includes('pdf') ? (
                <iframe
                  src={modalContent.url}
                  className={styles.pdfViewer}
                  title="PDF Viewer"
                />
              ) : modalContent.type.includes('image') ? (
                <img
                  src={modalContent.url}
                  alt={modalContent.name}
                  className={styles.imageViewer}
                />
              ) : (
                <div className={styles.fileInfo}>
                  <p>File type: {modalContent.type}</p>
                  <a
                    href={modalContent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.downloadLink}
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 