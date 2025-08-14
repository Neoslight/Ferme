import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const addMovementLog = async ({ animalId, fromLocation, toLocation, reason, date }) => {
  const batch = writeBatch(db);
  const animalDocRef = doc(db, 'animals', animalId);
  const movementLogsCollectionRef = collection(db, 'animals', animalId, 'movement_logs');

  // 1. Add new movement log
  const newLogRef = doc(movementLogsCollectionRef);
  batch.set(newLogRef, {
    date: new Date(date),
    fromLocation,
    toLocation,
    reason
  });

  // 2. Update the animal's current location on the parent doc
  batch.update(animalDocRef, { currentLocation: toLocation });

  return await batch.commit();
};

export const useAddMovementLog = (animalId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => addMovementLog({ animalId, ...data }),
    onSuccess: () => {
      // Invalidate both the animal detail and the sub-collection queries
      queryClient.invalidateQueries({ queryKey: ['animal', animalId] });
      queryClient.invalidateQueries({ queryKey: ['subcollection', animalId, 'movement_logs'] });
    },
    onError: (error) => {
      console.error("Error logging movement:", error);
      alert("Erreur lors de l'enregistrement du déplacement.");
    }
  });
};
