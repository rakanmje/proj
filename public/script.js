document.addEventListener('DOMContentLoaded', function () {
  fetchEvents();
  setupEventListeners();
});

function fetchEvents() {
  const userId = localStorage.getItem('userId');
  fetch(`/api/events?userId=${userId}`)
    .then(res => res.json())
    .then(events => {
      events.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
      window.allEvents = events;
      renderEvents(events);
    })
    .catch(err => {
      document.getElementById('events-container').innerHTML = '<p class="error">Failed to load events.</p>';
      console.error('Error fetching events:', err);
    });
}

function setupEventListeners() {
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', filterEvents);
  }

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close') || e.target.id === 'event-modal') {
      document.getElementById('event-modal').style.display = 'none';
    }
  });
}

function filterEvents() {
  const name = document.getElementById('search-input')?.value?.toLowerCase() || '';
  const location = document.getElementById('location-filter')?.value?.toLowerCase() || '';
  const category = document.getElementById('category-filter')?.value?.toLowerCase() || '';

  const filtered = window.allEvents?.filter(e => {
    const matchName = e.name?.toLowerCase().includes(name);
    const matchLocation = !location || e.location?.toLowerCase() === location;
    const matchCategory = !category || e.category?.toLowerCase() === category;
    return matchName && matchLocation && matchCategory;
  });

  renderEvents(filtered);
}

function renderEvents(events) {
  const container = document.getElementById('events-container');
  container.innerHTML = '';

  if (!events || events.length === 0) {
    container.innerHTML = '<p class="no-events">No events match your search.</p>';
    return;
  }

  events.forEach(event => {
    const card = document.createElement('div');
    card.className = 'event-card';
    if (event.isFavorite) card.classList.add('favorite');

    card.innerHTML = `
      <img src="${event.image}" alt="${event.name}" class="event-img" data-id="${event._id}">
      <h3>${event.name}</h3>
      <p>${event.location} - ${new Date(event.date).toLocaleDateString()}</p>
    `;
    card.querySelector('.event-img').addEventListener('click', () => showEventModal(event));
    container.appendChild(card);
  });
}

function showEventModal(event) {
  const modal = document.getElementById('event-modal');
  const content = document.getElementById('event-details');
  const userId = localStorage.getItem('userId');

  content.innerHTML = `
    <span class="close">&times;</span>
    <h2>${event.name}</h2>
    <img src="${event.image}" alt="${event.name}" style="width: 100%; max-height: 300px; object-fit: cover;">
    <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
    <p><strong>Location:</strong> ${event.location}</p>
    <p><strong>Seats:</strong> ${event.seats}</p>
    <p><strong>Price:</strong> ${event.price || 0} SAR</p>
    <p><strong>Description:</strong> ${event.description}</p>
    <div class="payment-options">
      <h4>Payment Method</h4>
      <button class="btn btn-success" disabled>Cash (Available)</button>
      <button class="btn btn-secondary" disabled>Credit Card (Coming Soon)</button>
    </div>
    <div class="modal-actions">
      <button id="modal-book-btn" class="book-btn" data-id="${event._id}">Loading...</button>
      <button class="fav-btn" data-id="${event._id}">
        <i class="fas fa-heart${event.isFavorite ? ' favorited' : ''}"></i>
      </button>
    </div>
  `;

  modal.style.display = 'block';

  fetch(`/api/user/${userId}`)
    .then(res => res.json())
    .then(userData => {
      const booked = userData.upcoming.concat(userData.past).some(e => e._id === event._id);
      const bookBtn = document.getElementById('modal-book-btn');
      bookBtn.textContent = booked ? 'Unbook' : 'Book';

      bookBtn.onclick = async () => {
        const res = await fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, eventId: event._id, toggle: true })
        });
        const data = await res.json();
        alert(data.message || 'Booking updated');
        fetchEvents();
        bookBtn.textContent = data.booked ? 'Unbook' : 'Book';
      };
    });

  const favBtn = content.querySelector('.fav-btn');
  const icon = favBtn.querySelector('i');
  favBtn.onclick = async () => {
    const res = await fetch('/api/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, eventId: event._id })
    });
    const data = await res.json();
    icon.classList.toggle('favorited', data.favorited);
    fetchEvents();
  };
}
