import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const updateDashboardStats = functions.firestore
    .document("animals/{animalId}")
    .onWrite(async (change, context) => {
      // Get a reference to the entire animals collection
      const animalsRef = db.collection("animals");

      // Get all animal documents
      const snapshot = await animalsRef.get();

      if (snapshot.empty) {
        console.log("No animals found. Resetting stats.");
        return db.collection("dashboard").doc("stats").set({
          total: 0,
          bySpecies: {},
          byStatus: {},
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Calculate stats
      const total = snapshot.size;
      const bySpecies: { [key: string]: number } = {};
      const byStatus: { [key: string]: number } = {};

      snapshot.forEach((doc) => {
        const animal = doc.data();

        // Count by species
        const species = animal.espece || "Inconnue";
        bySpecies[species] = (bySpecies[species] || 0) + 1;

        // Count by status
        const status = animal.statut || "Inconnu";
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      const stats = {
        total,
        bySpecies,
        byStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Write the aggregated stats to a single document
      return db.collection("dashboard").doc("stats").set(stats);
    });
