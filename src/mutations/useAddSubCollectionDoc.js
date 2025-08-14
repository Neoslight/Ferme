import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const addSubCollectionDoc = async ({ animalId, subCollectionName, data }) => {
  const subCollectionRef = collection(db, 'animals', animalId, subCollectionName);
  return await addDoc(subCollectionRef, data);
};

export const useAddSubCollectionDoc = (animalId, subCollectionName) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => addSubCollectionDoc({ animalId, subCollectionName, data }),
    onSuccess: () => {
      // Invalidate and refetch the query for this specific sub-collection
      queryClient.invalidateQueries({ queryKey: ['subcollection', animalId, subCollectionName] });
    },
    onError: (error) => {
      console.error(`Error adding document to ${subCollectionName}:`, error);
      alert(`Erreur lors de l'ajout.`);
    }
  });
};
