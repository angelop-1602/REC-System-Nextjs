'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import styles from '@/styles/Home.module.css';

interface PaperData {
  id: string;
  researchTitle: string;
  principalInvestigator: string;
  courseProgram: string;
  mainFolder?: string;
  status: string;
  createdAt: any;
}

type TabType = 'completed' | 'pending';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [papers, setPapers] = useState<PaperData[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const papersSnapshot = await getDocs(collection(db, 'applications'));
      const papersData = papersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as PaperData[];

      setPapers(papersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (paperId: string) => {
    router.push(`/admin/view/${paperId}`);
  };

  const renderPendingSection = () => {
    const pendingPapers = papers.filter(paper => paper.status === 'Pending');
    
    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Research Title</th>
              <th>Principal Investigator</th>
              <th>Course</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingPapers.map(paper => (
              <tr key={paper.id}>
                <td>{paper.researchTitle}</td>
                <td>{paper.principalInvestigator}</td>
                <td>{paper.courseProgram}</td>
                <td>{paper.status}</td>
                <td>
                  <button
                    onClick={() => handleViewDetails(paper.id)}
                    className={styles.iconButton}
                    title="View Details"
                  >
                    👁️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pendingPapers.length === 0 && (
          <p className={styles.noData}>No pending papers found.</p>
        )}
      </div>
    );
  };

  const renderCompletedSection = () => {
    const completedPapers = papers.filter(paper => paper.status === 'Completed');
    
    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Research Title</th>
              <th>Principal Investigator</th>
              <th>Course</th>
              <th>Protocol Code</th>
              <th>Completion Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {completedPapers.map(paper => (
              <tr key={paper.id}>
                <td>{paper.researchTitle}</td>
                <td>{paper.principalInvestigator}</td>
                <td>{paper.courseProgram}</td>
                <td>{paper.mainFolder}</td>
                <td>{paper.createdAt.toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleViewDetails(paper.id)}
                    className={styles.iconButton}
                    title="View Details"
                  >
                    👁️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {completedPapers.length === 0 && (
          <p className={styles.noData}>No completed papers found.</p>
        )}
      </div>
    );
  };

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.backLink}>
        &larr; Back to Home
      </Link>
      
      <h1 className={styles.title}>Admin Dashboard</h1>
      
      <div className={styles.content}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'pending' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Papers
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'completed' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed Papers
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          activeTab === 'pending' ? renderPendingSection() : renderCompletedSection()
        )}
      </div>
    </main>
  );
} 