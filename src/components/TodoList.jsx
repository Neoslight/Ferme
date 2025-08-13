import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const TodoList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ description: '', dueDate: '' });

  const tasksCollectionRef = collection(db, 'tasks');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const q = query(tasksCollectionRef, where('isComplete', '==', false), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const tasksList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setTasks(tasksList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description) return;
    try {
      await addDoc(tasksCollectionRef, {
        description: formData.description,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        isComplete: false,
        createdAt: new Date(),
      });
      setFormData({ description: '', dueDate: '' });
      fetchTasks();
    } catch (error) {
      console.error("Error adding task: ", error);
    }
  };

  const handleMarkComplete = async (id) => {
    const taskDoc = doc(db, 'tasks', id);
    await updateDoc(taskDoc, { isComplete: true });
    fetchTasks();
  };

  return (
    <div>
      <h3>Tâches à faire</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Nouvelle tâche..." required />
        <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} />
        <button type="submit">Ajouter Tâche</button>
      </form>
      {loading ? <p>Chargement...</p> : (
        <ul>
          {tasks.map(task => (
            <li key={task.id}>
              {task.description}
              {task.dueDate && <span> - Échéance: {task.dueDate.toDate().toLocaleDateString()}</span>}
              <button onClick={() => handleMarkComplete(task.id)}>Terminé</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoList;
