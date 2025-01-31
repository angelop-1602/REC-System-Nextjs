import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, writeBatch, doc } from 'firebase/firestore';

export async function initializeReviewersInFirestore() {
  const reviewersData = [
    ["Dr. Allan Paulo L. Blaquera", "DRAPL-001"],
    ["Dr. Nova R. Domingo", "DRNRD-002"],
    ["Dr. Claudeth U. Gamiao", "DRCUG-003"],
    ["Dr. Mark Klimson L. Luyun", "DRMKL-004"],
    ["Mr. Wilfredo DJ P. Martin IV", "MRWDM-005"],
    ["Mr. Sergio G. Imperio", "MRSGI-006"],
    ["Dr. Marjorie L. Bambalan", "DRMLB-007"],
    ["Mrs. Elizabeth C. Iquin", "MRSEI-008"],
    ["Dr. Milrose Tangonan", "DRMT-009"],
    ["Engr. Verge C. Baccay", "ENGVCB-010"],
    ["Mr. Everett T. Laureta", "MRET-011"],
    ["Mrs. Maria Felina B. Agbayani", "MRMFBA-012"],
    ["Mrs. Rita B. Daliwag", "MRRBD-013"],
    ["Mrs. Lita Jose", "MRLJ-014"],
    ["Dr. Corazon Dela Cruz", "DRCDC-015"],
    ["Dr. Ester Yu", "DREY-016"],
    ["Mr. Angelo Peralta", "MRAP-017"],
    ["Dr. Janette Fermin", "DRJF-018"],
    ["Mr. Rogelio Fermin", "MRRF-019"],
    ["Mrs. Vivian Sorita", "MRSVS-020"],
    ["Dr. Benjamin Jularbal", "DRBJ-021"],
    ["Mrs. Kristine Joy O. Cortes", "MRSKC-022"],
    ["Mrs. Jean Sumait", "MRSJS-023"],
    ["Dr. Emman Earl Cacayurin", "DREEC-024"]
  ];

  try {
    // Check if reviewers already exist
    const reviewersCollection = collection(db, 'reviewers');
    const snapshot = await getDocs(reviewersCollection);

    if (snapshot.empty) {
      // Use batch write for better performance
      const batch = writeBatch(db);

      reviewersData.forEach(([name, code]) => {
        const docRef = doc(reviewersCollection); // Auto-generate document ID
        batch.set(docRef, {
          name,
          code,
          createdAt: new Date(),
          isActive: true
        });
      });

      // Commit the batch
      await batch.commit();
      console.log('Successfully added reviewers to Firestore');
      return true;
    } else {
      console.log('Reviewers collection is not empty. Skipping initialization.');
      return false;
    }
  } catch (error) {
    console.error('Error initializing reviewers:', error);
    throw error;
  }
} 