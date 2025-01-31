'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fetchReviewerData, getReviewerName, getReviewerId } from '../utils/fetchReviewerData';
import styles from '@/styles/Home.module.css';
import { useReviewer } from '../context/ReviewerContext';
import { useRouter } from 'next/navigation';

interface ReviewerData {
  id: string;
  principalInvestigator: string;
  status: string;
  reviewerAssignments: {
    [key: string]: {
      reviewerId: string;
      formType: string;
      form: string;
      reviewer_name: string;
      status: string;
    };
  };
}

export default function ReviewerDashboard() {
  const { setReviewerInfo } = useReviewer();
  const [reviewerCode, setReviewerCode] = useState('');
  const [reviewerName, setReviewerName] = useState<string | null>(null);
  const [reviewerId, setReviewerId] = useState<string | null>(null);
  const [papers, setPapers] = useState<ReviewerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerCode.trim()) return;

    setLoading(true);
    setError('');
    try {
      const name = await getReviewerName(reviewerCode.trim());
      const id = await getReviewerId(reviewerCode.trim());
      
      if (!name || !id) {
        setError('Invalid reviewer code');
        setPapers([]);
        setReviewerName(null);
        setReviewerId(null);
        return;
      }

      setReviewerName(name);
      setReviewerId(id);
      setReviewerInfo(reviewerCode.trim(), id, name);

      const data = await fetchReviewerData(reviewerCode.trim());
      setPapers(data);
      
      if (data.length === 0) {
        setError('No papers assigned for review');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch reviewer data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormNavigation = (item: ReviewerData) => {
    if (!reviewerName) return;

    // Find the reviewer assignment for the current reviewer
    const reviewerAssignment = Object.entries(item.reviewerAssignments).find(
      ([_, assignment]) => assignment.reviewer_name === reviewerName
    );

    if (!reviewerAssignment) {
      setError('No form type found for this reviewer');
      return;
    }

    const formType = reviewerAssignment[1].formType;
    let route = '';
    
    // Use the form type directly from the database
    switch (reviewerAssignment[1].form) {
      case 'protocol_review':
        route = `/forms/protocol-review/${item.id}`;
        break;
      case 'informed_consent':
        route = `/forms/informed-consent/${item.id}`;
        break;
      case 'exemption_checklist':
        route = `/forms/exemption-checklist/${item.id}`;
        break;
      default:
        setError('Unknown form type');
        return;
    }

    console.log('Navigating to:', route);
    router.push(route);
  };

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.backLink}>
        &larr; Back to Home
      </Link>

      <h1 className={styles.title}>Reviewer Dashboard</h1>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.searchSection}>
          <div className={styles.formGroup}>
            <label htmlFor="reviewerCode" className={styles.label}>
              Reviewer Code:
            </label>
            <div className={styles.inputGroup}>
              <input
                type="text"
                id="reviewerCode"
                value={reviewerCode}
                onChange={(e) => setReviewerCode(e.target.value)}
                placeholder="Enter your reviewer code"
                className={styles.textInput}
                disabled={loading}
              />
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading || !reviewerCode.trim()}
              >
                {loading ? 'Loading...' : 'Submit'}
              </button>
            </div>
          </div>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        {reviewerName && (
          <div className={styles.welcomeSection}>
            <h2>Welcome, {reviewerName}</h2>
          </div>
        )}

        {papers.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Protocol Code</th>
                  <th>Principal Investigator</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((paper) => (
                  <tr key={paper.id}>
                    <td>{paper.id}</td>
                    <td>{paper.principalInvestigator}</td>
                    <td>{paper.status}</td>
                    <td>
                      <button
                        onClick={() => handleFormNavigation(paper)}
                        className={styles.reviewButton}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
} 