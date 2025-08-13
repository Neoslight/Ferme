export const GESTATION_PERIODS = {
  // Durations in days
  'Mouton': 152,
  'Chèvre': 150,
  'Cochon': 114,
  'Vache': 283,
  'Poule': 21,
  'Lapin': 31,
  // Add other species as needed
};

export const calculateDueDate = (matingDate, species) => {
  const gestationDays = GESTATION_PERIODS[species];
  if (gestationDays === undefined) {
    return null; // Species not found
  }
  const dueDate = new Date(matingDate);
  dueDate.setDate(dueDate.getDate() + gestationDays);
  return dueDate;
};
