'use client';

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function Admin() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState({});
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    location: '',
    template: `🎉 You're invited to "{eventName}" on {eventDate} at {location}!\n\nConfirmed attendees:\n{attendeeList}\n\nSee you there!`
  });
  const [copiedEventId, setCopiedEventId] = useState(null);
  const [editingFields, setEditingFields] = useState({}); // event.id → fields array

  const DEFAULT_FIELDS = [
    { name: 'name', label: 'Full Name', required: true, type: 'text' },
    { name: 'age', label: 'Age', required: true, type: 'number' },
    { name: 'mobile', label: 'Mobile Number', required: true, type: 'tel' },
    { name: 'location', label: 'Location', required: true, type: 'text' },
    { name: 'occupation', label: 'Occupation', required: true, type: 'text' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const eventsSnap = await getDocs(collection(db, 'events'));
    const eventsList = eventsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fields: data.fields || DEFAULT_FIELDS
      };
    });
    setEvents(eventsList);

    const regMap = {};
    for (const event of eventsList) {
      const regSnap = await getDocs(query(collection(db, 'registrations'), where('eventId', '==', event.id)));
      regMap[event.id] = regSnap.docs.map(doc => doc.data());
    }
    setRegistrations(regMap);
    setEditingFields(eventsList.reduce((acc, e) => ({ ...acc, [e.id]: e.fields }), {}));
  };

  const addEvent = async () => {
    if (!newEvent.name || !newEvent.date) return alert('Name & date required');
    await addDoc(collection(db, 'events'), {
      ...newEvent,
      fields: DEFAULT_FIELDS,
      isActive: true,
      createdAt: new Date().toISOString()
    });
    setNewEvent({ ...newEvent, name: '', date: '' });
    loadData();
  };

  const deleteEvent = async (id) => {
    if (!confirm('Delete event & all registrations?')) return;
    await deleteDoc(doc(db, 'events', id));
    loadData();
  };

  const saveFields = async (eventId) => {
    const fields = editingFields[eventId];
    if (!fields || fields.length === 0) return alert('At least one field required');
    await updateDoc(doc(db, 'events', eventId), { fields });
    alert('✅ Fields saved!');
  };

  const addCustomField = (eventId) => {
    const current = [...(editingFields[eventId] || [])];
    current.push({
      name: `field_${Date.now()}`,
      label: 'Custom Field',
      required: false,
      type: 'text'
    });
    setEditingFields({ ...editingFields, [eventId]: current });
  };

  const updateField = (eventId, index, field) => {
    const current = [...(editingFields[eventId] || [])];
    current[index] = field;
    setEditingFields({ ...editingFields, [eventId]: current });
  };

  const deleteField = (eventId, index) => {
    const current = [...(editingFields[eventId] || [])];
    current.splice(index, 1);
    setEditingFields({ ...editingFields, [eventId]: current });
  };

  const generateMessage = (event) => {
    const regs = registrations[event.id] || [];
    const people = regs.flatMap(r => r.people || []);
    const list = people.map((p, i) => {
      const details = Object.entries(p)
        .filter(([k]) => !['eventId', 'isGroup', 'groupSize', 'timestamp'].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      return `${i + 1}. ${p.name || '—'}${details ? ` (${details})` : ''}`;
    }).join('\n');
    return event.template
      .replace('{eventName}', event.name)
      .replace('{eventDate}', new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
      .replace('{location}', event.location || 'TBD')
      .replace('{attendeeList}', list || 'No registrations yet.');
  };

  const copyMessage = (eventId) => {
    const event = events.find(e => e.id === eventId);
    const msg = generateMessage(event);
    navigator.clipboard.writeText(msg);
    setCopiedEventId(eventId);
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-gray-900 to-indigo-950">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            🛠️ Event Admin Panel
          </h1>
          <p className="text-gray-300 mt-2">Manage events, fields, and registrations</p>
        </div>

        {/* Add Event */}
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-bold text-gray-200 mb-4">➕ Add New Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input
              value={newEvent.name}
              onChange={e => setNewEvent({...newEvent, name: e.target.value})}
              placeholder="Event Name *"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <input
              type="date"
              value={newEvent.date.split('T')[0] || ''}
              onChange={e => setNewEvent({...newEvent, date: e.target.value + 'T10:00:00Z'})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <input
              value={newEvent.location}
              onChange={e => setNewEvent({...newEvent, location: e.target.value})}
              placeholder="Location"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <button
            onClick={addEvent}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            ✅ Add Event
          </button>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {events.map(event => (
            <div key={event.id} className="glass p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-blue-300">{event.name}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(event.date).toLocaleDateString()} • {registrations[event.id]?.length || 0} registrant(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyMessage(event.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      copiedEventId === event.id 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {copiedEventId === event.id ? '✅ Copied!' : '📋 Copy Message'}
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Field Configuration */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-200 mb-2">📝 Required Fields</h4>
                <div className="space-y-2">
                  {(editingFields[event.id] || []).map((field, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                      <input
                        type="text"
                        value={field.label}
                        onChange={e => updateField(event.id, i, { ...field, label: e.target.value })}
                        placeholder="Field Label"
                        className="flex-1 p-1 bg-gray-700 text-white rounded text-sm"
                      />
                      <select
                        value={field.name}
                        onChange={e => updateField(event.id, i, { ...field, name: e.target.value })}
                        className="p-1 bg-gray-700 text-white rounded text-sm"
                      >
                        <option value="name">Full Name</option>
                        <option value="age">Age</option>
                        <option value="mobile">Mobile</option>
                        <option value="location">Location</option>
                        <option value="occupation">Occupation</option>
                        <option value="email">Email</option>
                        <option value="custom">Custom</option>
                      </select>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={e => updateField(event.id, i, { ...field, required: e.target.checked })}
                          className="mr-1 h-4 w-4"
                        />
                        Required
                      </label>
                      <button
                        onClick={() => deleteField(event.id, i)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addCustomField(event.id)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    ➕ Add Custom Field
                  </button>
                  <button
                    onClick={() => saveFields(event.id)}
                    className="ml-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                  >
                    💾 Save Fields
                  </button>
                </div>
              </div>

              {/* Preview Message */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-200 mb-2">📤 Message Preview</h4>
                <div className="p-3 bg-gray-800 rounded font-mono text-sm text-gray-300 whitespace-pre-wrap border border-gray-700">
                  {generateMessage(event)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}