import { useQuery } from '@tanstack/react-query';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => new Promise((resolve, reject) => {
      const docRef = doc(db, 'dashboard', 'stats');
      const unsubscribe = onSnapshot(docRef,
        (doc) => {
          if (doc.exists()) {
            resolve(doc.data());
          } else {
            // Resolve with empty stats if doc doesn't exist yet
            resolve({ total: 0, bySpecies: {}, byStatus: {} });
          }
        },
        (error) => {
          reject(error);
        }
      );
      // Note: React Query doesn't have a direct way to unsubscribe from a snapshot listener
      // when the query becomes inactive. For a long-lived app, a more complex setup
      // might be needed, but for this use case, it's acceptable.
    }),
    // Keep the data fresh, but don't refetch on window focus etc.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};
