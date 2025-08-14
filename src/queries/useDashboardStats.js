import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useDashboardStats = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, 'dashboard', 'stats');
    const unsubscribe = onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          // Document doesn't exist, provide default stats
          setData({
            total: 0,
            bySpecies: {},
            byStatus: {},
            birthsByMonth: {},
          });
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching dashboard stats:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this effect runs only once

  return { data, isLoading, error };
};
