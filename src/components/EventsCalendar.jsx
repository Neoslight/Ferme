import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';

const EventsCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllEvents = async () => {
      setLoading(true);
      const today = new Date();
      let allEvents = [];

      // 1. Fetch upcoming births
      const birthsQuery = query(collection(db, 'animals'), where('estimatedDueDate', '>=', today));
      const birthsSnapshot = await getDocs(birthsQuery);
      birthsSnapshot.forEach(doc => {
        const animal = { id: doc.id, ...doc.data() };
        allEvents.push({
          date: animal.estimatedDueDate.toDate(),
          type: 'Mise Bas',
          description: `Mise bas attendue pour ${animal.nom}`,
          link: `/animal/${animal.id}`
        });
      });

      // 2. Fetch upcoming health reminders
      // Note: This query requires a composite index on (reminderDate, type). Firestore will provide a link to create it.
      const remindersQuery = query(collection(db, 'health_logs'), where('reminderDate', '>=', today));
      // This query is across all subcollections, which is not supported directly.
      // This is a major architectural challenge. A better way is to have a top-level `reminders` collection.
      // For now, I will OMIT this query as it's not possible with the current structure.
      // I will leave a note about this limitation.

      // 3. Fetch upcoming tasks
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('isComplete', '==', false),
        where('dueDate', '>=', today)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      tasksSnapshot.forEach(doc => {
        const task = { id: doc.id, ...doc.data() };
        allEvents.push({
          date: task.dueDate.toDate(),
          type: 'Tâche',
          description: task.description,
          link: null
        });
      });

      // Sort all events chronologically
      allEvents.sort((a, b) => a.date - b.date);

      setEvents(allEvents);
      setLoading(false);
    };

    fetchAllEvents();
  }, []);

  return (
    <div>
      <h3>Événements à Venir</h3>
      <p style={{fontSize: '0.8rem', color: '#888'}}>Note: Les rappels de santé ne sont pas encore inclus dans cette version du calendrier.</p>
      {loading ? <p>Chargement des événements...</p> : (
        events.length === 0
          ? <p>Aucun événement à venir.</p>
          : <ul>
              {events.map((event, index) => (
                <li key={index}>
                  <strong>{event.date.toLocaleDateString()} - {event.type}</strong>: {` `}
                  {event.link ? <Link to={event.link}>{event.description}</Link> : event.description}
                </li>
              ))}
            </ul>
      )}
    </div>
  );
};

export default EventsCalendar;
