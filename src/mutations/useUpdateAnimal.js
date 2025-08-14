import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const updateAnimal = async ({ animalId, data }) => {
  const animalDocRef = doc(db, 'animals', animalId);
  return await updateDoc(animalDocRef, data);
};

export const useUpdateAnimal = (animalId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updateAnimal({ animalId, data }),
    onSuccess: () => {
      // Invalidate the specific animal query
      queryClient.invalidateQueries({ queryKey: ['animal', animalId] });
      // Invalidate the general animals list query to reflect changes there
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
    onError: (error) => {
      console.error("Error updating animal:", error);
      alert("Erreur lors de la mise à jour de l'animal.");
    }
  });
};
