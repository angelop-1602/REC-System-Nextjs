'use client';
import { useState } from 'react';
import { uploadResearchData } from '../utils/uploadJsonToFirestore';
import firstReleaseData from '@/data/first-release.json';
import secondReleaseGraduateData from '@/data/second-release-graduate.json';
import secondReleaseUndergraduateData from '@/data/second-release-undergraduate.json';
import styles from '../styles/Home.module.css';

export default function UploadPage() {
  const [status, setStatus] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleUpload = async (data: any[], collectionName: string) => {
    setLoading(true);
    try {
      const result = await uploadResearchData(data, collectionName);
      setStatus(prev => ({
        ...prev,
        [collectionName]: result.success ? 'Success' : `Error: ${result.message}`
      }));
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        [collectionName]: `Error: ${error?.message || 'Unknown error'}`
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Upload Research Data</h1>
      
      <div className={styles.content}>
        <div className={styles.uploadSection}>
          <h2>First Release</h2>
          <button 
            onClick={() => handleUpload(firstReleaseData, 'firstRelease')}
            disabled={loading}
            className={styles.button}
          >
            Upload First Release Data
          </button>
          {status.firstRelease && (
            <p className={status.firstRelease.includes('Error') ? styles.error : styles.success}>
              {status.firstRelease}
            </p>
          )}
        </div>

        <div className={styles.uploadSection}>
          <h2>Second Release - Graduate</h2>
          <button 
            onClick={() => handleUpload(secondReleaseGraduateData, 'secondReleaseGraduate')}
            disabled={loading}
            className={styles.button}
          >
            Upload Graduate Data
          </button>
          {status.secondReleaseGraduate && (
            <p className={status.secondReleaseGraduate.includes('Error') ? styles.error : styles.success}>
              {status.secondReleaseGraduate}
            </p>
          )}
        </div>

        <div className={styles.uploadSection}>
          <h2>Second Release - Undergraduate</h2>
          <button 
            onClick={() => handleUpload(secondReleaseUndergraduateData, 'secondReleaseUndergraduate')}
            disabled={loading}
            className={styles.button}
          >
            Upload Undergraduate Data
          </button>
          {status.secondReleaseUndergraduate && (
            <p className={status.secondReleaseUndergraduate.includes('Error') ? styles.error : styles.success}>
              {status.secondReleaseUndergraduate}
            </p>
          )}
        </div>
      </div>
    </main>
  );
} 