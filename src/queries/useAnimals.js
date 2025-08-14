import { useInfiniteQuery } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs, startAfter, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const PAGE_SIZE = 15;

const fetchAnimalsPage = async ({ pageParam = null, queryKey }) => {
  const [_key, filters] = queryKey;
  const { speciesFilter, statusFilter, locationFilter, searchTerm } = filters;

  let q = query(collection(db, 'animals'), orderBy('nom'));

  // Apply filters
  if (speciesFilter) q = query(q, where('espece', '==', speciesFilter));
  if (statusFilter) q = query(q, where('statut', '==', statusFilter));
  if (locationFilter) q = query(q, where('currentLocation', '==', locationFilter));

  if (pageParam) {
    q = query(q, startAfter(pageParam));
  }

  q = query(q, limit(PAGE_SIZE));

  const snapshot = await getDocs(q);
  let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Client-side search
  if (searchTerm) {
    data = data.filter(animal =>
      animal.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  return { data, lastVisible };
};

export const useAnimals = (filters) => {
  return useInfiniteQuery({
    queryKey: ['animals', filters],
    queryFn: fetchAnimalsPage,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastVisible || undefined,
  });
};
