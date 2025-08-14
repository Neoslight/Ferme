import { create } from 'zustand';

const useAnimalStore = create((set) => ({
  animal: null,
  loading: true,
  setAnimal: (animalData) => set({ animal: animalData, loading: false }),
  updateAnimal: (updatedFields) => set((state) => ({
    animal: state.animal ? { ...state.animal, ...updatedFields } : null,
  })),
  clearAnimal: () => set({ animal: null, loading: true }),
}));

export default useAnimalStore;
