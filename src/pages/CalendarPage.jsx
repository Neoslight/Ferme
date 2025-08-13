import React from 'react';
import EventsCalendar from '../components/EventsCalendar';
import TodoList from '../components/TodoList';

const CalendarPage = () => {
  return (
    <div>
      <h1>Calendrier et Tâches</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }} className="card">
          <EventsCalendar />
        </div>
        <div style={{ flex: 1, minWidth: '300px' }} className="card">
          <TodoList />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
