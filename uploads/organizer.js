document.addEventListener('DOMContentLoaded', () => {
  fetchOrganizerEvents();
});

function fetchOrganizerEvents() {
  const organizerId = localStorage.getItem('userId');
  if (!organizerId) return alert("Organizer ID not found");

  fetch(`/api/organizer/events?userId=${organizerId}`)
    .then(res => res.json())
    .then(events => renderEventList(events))
    .catch(err => console.error('Failed to load events', err));
}

function renderEventList(events) {
  const list = document.getElementById('events-list');
  list.innerHTML = '';

  events.forEach(event => {
    const li = document.createElement('li');
    li.className = 'event-item';
    li.innerHTML = `
      <div class="event-card">
        <img src="${event.image || '/uploads/default-event.png'}" alt="${event.name}" class="event-thumb">
        <div class="event-details">
          <h3>${event.name}</h3>
          <p>${event.description?.slice(0, 50) || ''}</p>
          <small>
            <i class="fas fa-map-marker-alt"></i> ${event.location} |
            <i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleString()} |
            <strong>Category:</strong> ${event.category || 'Unspecified'} |
            <strong>Price:</strong> ${event.price || 0} SAR
          </small>
          <div class="event-actions">
            <button class="btn green edit-btn" data-id="${event._id}">Edit</button>
            <button class="btn red" onclick="deleteEvent('${event._id}')">Delete</button>
            <button class="btn dark" onclick="viewAttendees('${event._id}')">Attendees</button>
          </div>
        </div>
      </div>
    `;
    list.appendChild(li);
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const eventId = btn.dataset.id;
      editEvent(eventId);
    });
  });
}

function openForm(mode = 'add', event = null) {
  document.getElementById('event-modal').classList.remove('hidden');
  document.getElementById('modal-title').textContent = mode === 'edit' ? 'Edit Event' : 'Add Event';
  clearForm();

  if (mode === 'edit' && event) {
    document.getElementById('event-name').value = event.name;
    document.getElementById('event-location').value = event.location;
    document.getElementById('event-date').value = event.date.slice(0, 16);
    document.getElementById('event-seats').value = event.seats;
    document.getElementById('event-description').value = event.description;
    document.getElementById('event-category').value = event.category || '';
    document.getElementById('event-price').value = event.price || 0;
  }

  const actions = document.querySelector('.modal-actions');
  actions.innerHTML = `
    <input type="file" id="event-image" accept="image/*">
    <button onclick="${mode === 'edit' ? `updateEvent('${event._id}')` : 'saveEvent()'}">${mode === 'edit' ? 'Update' : 'Save'}</button>
    <button onclick="closeForm()">Cancel</button>
  `;
}

function closeForm() {
  document.getElementById('event-modal').classList.add('hidden');
  clearForm();
}

function clearForm() {
  document.getElementById('event-name').value = '';
  document.getElementById('event-location').value = '';
  document.getElementById('event-date').value = '';
  document.getElementById('event-seats').value = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-category').value = '';
  document.getElementById('event-price').value = '';
  const imageInput = document.getElementById('event-image');
  if (imageInput) imageInput.value = '';
}

async function saveEvent() {
  const formData = getFormData();
  const res = await fetch('/api/events', {
    method: 'POST',
    body: formData
  });

  if (res.ok) {
    alert("Event created successfully!");
    closeForm();
    fetchOrganizerEvents();
  } else {
    alert("Failed to create event.");
  }
}

function editEvent(eventId) {
  fetch(`/api/events/${eventId}`)
    .then(res => res.json())
    .then(event => {
      openForm('edit', event);
    })
    .catch(err => {
      console.error('Error loading event for edit:', err);
      alert('Failed to load event data.');
    });
}

function updateEvent(eventId) {
  const formData = getFormData();
  fetch(`/api/events/${eventId}`, {
    method: 'PUT',
    body: formData
  })
    .then(res => res.json())
    .then(() => {
      alert('Event updated');
      closeForm();
      fetchOrganizerEvents();
    })
    .catch(err => {
      console.error('Update failed', err);
      alert('Update failed');
    });
}

function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;

  fetch(`/api/events/${eventId}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(() => {
      alert('Event deleted');
      fetchOrganizerEvents();
    })
    .catch(err => {
      console.error('Delete failed', err);
      alert('Delete failed');
    });
}

function viewAttendees(eventId) {
  fetch(`/api/events/${eventId}/attendees`)
    .then(res => res.json())
    .then(data => {
      const emails = data.attendees.map(u => u.email).join('\n');
      alert('Attendees:\n' + emails);
    })
    .catch(err => {
      console.error('Fetch attendees failed', err);
      alert('Failed to get attendees');
    });
}

function getFormData() {
  const name = document.getElementById('event-name').value;
  const location = document.getElementById('event-location').value;
  const date = document.getElementById('event-date').value;
  const seats = document.getElementById('event-seats').value;
  const description = document.getElementById('event-description').value;
  const category = document.getElementById('event-category').value;
  const price = document.getElementById('event-price').value;
  const image = document.getElementById('event-image')?.files[0];

  const formData = new FormData();
  formData.append('name', name);
  formData.append('location', location);
  formData.append('date', date);
  formData.append('seats', seats);
  formData.append('description', description);
  formData.append('category', category);
  formData.append('price', price);
  if (image) formData.append('image', image);
  return formData;
}
