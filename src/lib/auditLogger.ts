import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const logAdminAction = async (
  adminUid: string,
  adminEmail: string,
  action: string,
  target: string,
  details?: string
) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      adminUid,
      adminEmail,
      action,
      target,
      details: details || '',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Audit log write error:', err);
  }
};
