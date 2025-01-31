'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from '@/styles/Home.module.css';

interface ApplicationForm {
  id: string;
  researchTitle: string;
  principalInvestigator: string;
  courseProgram: string;
  adviser: string;
  emailAddress: string;
  status: string;
}

type TabType = 'submit' | 'edit';

export default function EditSubmission() {
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const [documentId, setDocumentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [application, setApplication] = useState<ApplicationForm | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<ApplicationForm>>({});

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
      setApplication({ ...data, id: docSnap.id } as ApplicationForm);
      setFormData({
        researchTitle: data.researchTitle,
        principalInvestigator: data.principalInvestigator,
        courseProgram: data.courseProgram,
        adviser: data.adviser,
        emailAddress: data.emailAddress
      });
    } catch (err) {
      console.error('Error searching for application:', err);
      setError('Failed to search for application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        updatedAt: new Date()
      });

      setApplication(prev => prev ? { ...prev, ...formData } : null);
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
  };

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
              value={formData.researchTitle || ''}
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
              value={formData.principalInvestigator || ''}
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
              value={formData.courseProgram || ''}
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
              value={formData.adviser || ''}
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
              value={formData.emailAddress || ''}
              onChange={handleInputChange}
              className={styles.textInput}
              required
            />
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

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.backLink}>
        &larr; Back to Home
      </Link>

      <h1 className={styles.title}>Application Management</h1>

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

        {activeTab === 'submit' ? (
          <div className={styles.submitRedirect}>
            <p>To submit a new application, please go to:</p>
            <Link href="/user" className={styles.submitLink}>
              Submit New Application &rarr;
            </Link>
          </div>
        ) : (
          renderEditSection()
        )}

        {error && (
          <p className={error.includes('successfully') ? styles.success : styles.error}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
} 