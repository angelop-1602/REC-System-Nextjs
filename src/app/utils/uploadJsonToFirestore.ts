import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

interface ResearchData {
  "Main Folder": string;
  "Reviewer": string;
  "Document": string;
  "Folder Link": string;
  "Progress": string;
}

// Helper function to clean data before uploading
function cleanData(item: any): Partial<ResearchData> {
  return {
    "Main Folder": item["Main Folder"] || "",
    "Reviewer": item["Reviewer"] || "",
    "Document": item["Document"] || "",
    "Folder Link": item["Folder Link"] || "",
    "Progress": item["Progress"] || ""
  };
}

export async function uploadResearchData(data: ResearchData[], collectionName: string, documentPrefix?: string) {
  try {
    const batch = writeBatch(db);
    const researchCollection = collection(db, collectionName);

    data.forEach((item, index) => {
      const docId = documentPrefix 
        ? `${documentPrefix}_${index + 1}` 
        : undefined;
      
      const docRef = docId 
        ? doc(researchCollection, docId)
        : doc(researchCollection);

      // Clean the data before uploading
      const cleanedItem = cleanData(item);

      batch.set(docRef, {
        mainFolder: cleanedItem["Main Folder"],
        reviewer: cleanedItem["Reviewer"],
        document: cleanedItem["Document"],
        link: cleanedItem["Folder Link"],
        progress: cleanedItem["Progress"],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    await batch.commit();
    return { success: true, message: `Successfully uploaded data to ${collectionName}` };
  } catch (error: any) {
    console.error('Error uploading data:', error);
    return { success: false, message: error?.message || 'Unknown error' };
  }
} 