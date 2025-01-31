import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

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

interface Reviewer {
  name: string;
  code: string;
}

export async function getReviewerName(reviewerCode: string): Promise<string | null> {
  try {
    const reviewersRef = collection(db, 'reviewers');
    const q = query(reviewersRef, where('code', '==', reviewerCode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().name || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting reviewer name:', error);
    throw error;
  }
}

export async function getReviewerId(reviewerCode: string): Promise<string | null> {
  try {
    const reviewersRef = collection(db, 'reviewers');
    const q = query(reviewersRef, where('code', '==', reviewerCode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error getting reviewer ID:', error);
    throw error;
  }
}

export async function fetchReviewerData(reviewerCode: string): Promise<ReviewerData[]> {
  try {
    // First get the reviewer's name
    const reviewerName = await getReviewerName(reviewerCode);
    
    if (!reviewerName) {
      return [];
    }

    // Get all applications
    const applicationsRef = collection(db, 'applications');
    const querySnapshot = await getDocs(applicationsRef);
    const assignedPapers: ReviewerData[] = [];

    // Filter applications where this reviewer is assigned
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if this reviewer is assigned to any position
      const isAssigned = 
        data.reviewer1?.reviewer_name === reviewerName ||
        data.reviewer2?.reviewer_name === reviewerName ||
        data.reviewer3?.reviewer_name === reviewerName;

      if (isAssigned) {
        // Convert the reviewer structure to match our interface
        const reviewerAssignments: { [key: string]: any } = {};
        
        if (data.reviewer1?.reviewer_name === reviewerName) {
          reviewerAssignments.reviewer1 = {
            reviewerId: reviewerCode,
            formType: data.reviewer1.form === 'protocol_review' ? 'Protocol Review' :
                      data.reviewer1.form === 'informed_consent' ? 'Informed Consent' :
                      data.reviewer1.form === 'exemption_checklist' ? 'Exemption Checklist' : '',
            form: data.reviewer1.form,
            reviewer_name: data.reviewer1.reviewer_name,
            status: data.reviewer1.status
          };
        }
        if (data.reviewer2?.reviewer_name === reviewerName) {
          reviewerAssignments.reviewer2 = {
            reviewerId: reviewerCode,
            formType: data.reviewer2.form === 'protocol_review' ? 'Protocol Review' :
                      data.reviewer2.form === 'informed_consent' ? 'Informed Consent' :
                      data.reviewer2.form === 'exemption_checklist' ? 'Exemption Checklist' : '',
            form: data.reviewer2.form,
            reviewer_name: data.reviewer2.reviewer_name,
            status: data.reviewer2.status
          };
        }
        if (data.reviewer3?.reviewer_name === reviewerName) {
          reviewerAssignments.reviewer3 = {
            reviewerId: reviewerCode,
            formType: data.reviewer3.form === 'protocol_review' ? 'Protocol Review' :
                      data.reviewer3.form === 'informed_consent' ? 'Informed Consent' :
                      data.reviewer3.form === 'exemption_checklist' ? 'Exemption Checklist' : '',
            form: data.reviewer3.form,
            reviewer_name: data.reviewer3.reviewer_name,
            status: data.reviewer3.status
          };
        }

        assignedPapers.push({
          id: doc.id,
          principalInvestigator: data.principalInvestigator,
          status: data.status,
          reviewerAssignments
        });
      }
    });

    return assignedPapers;
  } catch (error) {
    console.error('Error fetching reviewer data:', error);
    throw error;
  }
} 