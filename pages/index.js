'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { register, control, watch, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      eventId: '',
      isGroup: false,
      groupSize: 2,
      people: [{}]
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'people'
  });

  const isGroup = watch('isGroup');
  const groupSize = watch('groupSize');

  const updatePeopleFields = useCallback(() => {
    if (isGroup) {
      const current = fields.length;
      if (groupSize > current) {
        append(Array(groupSize - current).fill().map(() => ({})));
      } else if (groupSize < current) {
        const indices = Array.from({ length: current - groupSize }, (_, i) => current - 1 - i);
        remove(indices);
      }
    } else {
      replace([{}]);
      setValue('groupSize', 2);
    }
  }, [isGroup, groupSize, fields.length, append, remove, replace, setValue]);

  useEffect(() => {
    updatePeopleFields();
  }, [isGroup, groupSize, updatePeopleFields]);

  useEffect(() => {
    const fetchEvents = async () => {
      const snap = await getDocs(collection(db, 'events'));
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fields: doc.data().fields || [
          { name: 'name', label: 'Full Name', required: true, type: 'text' },
          { name: 'age', label: 'Age', required: true, type: 'number' },
          { name: 'mobile', label: 'Mobile Number', required: true, type: 'tel' },
          { name: 'location', label: 'Location', required: true, type: 'text' },
          { name: 'occupation', label: 'Occupation', required: true, type: 'text' }
        ]
      }));
      setEvents(list.filter(e => e.isActive !== false));
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const event = events.find(e => e.id === watch('eventId'));
    setSelectedEvent(event);
  }, [watch('eventId'), events]);

  const onSubmit = async (data) => {
    try {
      await addDoc(collection(db, 'registrations'), {
        ...data,
        eventId: selectedEvent.id,
        timestamp: new Date().toISOString()
      });
      setSubmitStatus('✅ Registration saved!');
      reset({ eventId: '', isGroup: false, groupSize: 2, people: [{}] });
    } catch (err) {
      setSubmitStatus('❌ Error. Check console.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-gray-900 to-indigo-950">
      <div className="max-w-2xl mx-auto mt-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            🎉 Register for an Event
          </h1>
        </div>

        <div className="glass p-6 rounded-xl">
          {submitStatus && (
            <div className={`p-3 mb-4 rounded ${submitStatus.includes('✅') ? 'alert-success' : 'alert-error'} flex items-center gap-2`}>
              {submitStatus.includes('✅') ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414-1.414l-6-6z" clipRule="evenodd" /></svg>
              )}
              {submitStatus}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Select Event *</label>
              <select 
                {...register('eventId', { required: true })} 
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                required
              >
                <option value="">— Choose an event —</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                {...register('isGroup')} 
                id="isGroup"
                className="h-5 w-5 text-blue-500 rounded"
              />
              <label htmlFor="isGroup" className="text-gray-200">I'm coming in a group</label>
            </div>

            {isGroup && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Group Size (2–10)</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  {...register('groupSize', { valueAsNumber: true, min: 2, max: 10 })}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            )}

            {/* Dynamic Fields per Person */}
            {selectedEvent && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-200">Attendee Details</h3>
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="font-medium text-blue-300 mb-2">Person {index + 1}</div>
                    <div className="space-y-3">
                      {selectedEvent.fields.map(f => (
                        <div key={f.name}>
                          <label className="block text-sm text-gray-300 mb-1">
                            {f.label}{f.required ? ' *' : ''}
                          </label>
                          <input
                            {...register(`people.${index}.${f.name}`, { 
                              required: f.required,
                              ...(f.type === 'number' && { valueAsNumber: true })
                            })}
                            type={f.type === 'age' ? 'number' : f.type}
                            placeholder={f.label}
                            className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition">
              ✅ Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}