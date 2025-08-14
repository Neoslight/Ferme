import { useInfiniteQuery } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const PAGE_SIZE = 5;

const fetchSubCollectionPage = async ({ pageParam = null, queryKey }) => {
  const [_key, animalId, subCollectionName] = queryKey;

  const subCollectionRef = collection(db, 'animals', animalId, subCollectionName);
  let q = query(subCollectionRef, orderBy('date', 'desc'), limit(PAGE_SIZE));

  if (pageParam) {
    q = query(q, startAfter(pageParam));
  }

  const snapshot = await getDocs(q);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  return { data, lastVisible };
};

export const usePaginatedSubCollection = (animalId, subCollectionName) => {
  return useInfiniteQuery({
    queryKey: ['subcollection', animalId, subCollectionName],
    queryFn: fetchSubCollectionPage,
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      // If the last page has data and a lastVisible doc, use it as the next page param.
      // Otherwise, there are no more pages.
      return lastPage.lastVisible || undefined;
    },
  });
};
