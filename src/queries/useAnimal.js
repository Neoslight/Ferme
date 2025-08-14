import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const fetchAnimal = async (animalId) => {
  if (!animalId) return null;
  const animalDocRef = doc(db, 'animals', animalId);
  const animalDoc = await getDoc(animalDocRef);
  if (!animalDoc.exists()) {
    throw new Error("Animal not found");
  }
  return { id: animalDoc.id, ...animalDoc.data() };
};

export const useAnimal = (animalId) => {
  return useQuery({
    queryKey: ['animal', animalId],
    queryFn: () => fetchAnimal(animalId),
    enabled: !!animalId, // The query will not run until the animalId is available
  });
};
