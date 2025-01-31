'use client';

import Link from 'next/link';
import styles from './styles/Home.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>SPUP REC Online Application System</h1>
      
      <div className={styles.grid}>
        <Link href="/user" className={styles.card}>
          <h2>User Dashboard &rarr;</h2>
          <p>Submit your research protocol for review.</p>
        </Link>

        <Link href="/reviewer" className={styles.card}>
          <h2>Reviewer Dashboard &rarr;</h2>
          <p>Review assigned research protocols.</p>
        </Link>

        <Link href="/admin" className={styles.card}>
          <h2>Admin Dashboard &rarr;</h2>
          <p>Manage research protocols and reviewers.</p>
        </Link>
      </div>
    </main>
  );
}
