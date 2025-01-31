import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function updateProgress(
  collectionName: string,
  documentId: string,
  progress: string
): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      progress,
      updatedAt: new Date()
    });
    return { success: true, message: 'Progress updated successfully' };
  } catch (error) {
    console.error('Error updating progress:', error);
    return { success: false, message: 'Failed to update progress' };
  }
} 