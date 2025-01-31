import { initializeReviewersInFirestore } from '../utils/initializeReviewers';

async function main() {
  try {
    console.log('Starting database initialization...');
    await initializeReviewersInFirestore();
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
}

main(); 