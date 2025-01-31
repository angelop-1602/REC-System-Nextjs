const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const reviewers = [
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

async function addReviewers() {
  try {
    for (const [name, code] of reviewers) {
      await addDoc(collection(db, 'reviewers'), {
        name,
        code,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added reviewer: ${name} (${code})`);
    }
    console.log('All reviewers added successfully!');
  } catch (error) {
    console.error('Error adding reviewers:', error);
  }
}

addReviewers(); 