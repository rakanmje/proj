document.addEventListener('DOMContentLoaded', function () {
  fetchEvents();
  setupEventListeners();
});

// Fetch events from the server
function fetchEvents() {
  fetch('/api/events')
    .then(res => res.json())
    .then(events => {
      renderEvents(events);
      window.allEvents = events;
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
}

function filterEvents() {
  const name = document.getElementById('search-input')?.value?.toLowerCase() || '';
  const location = document.getElementById('location-filter')?.value?.toLowerCase() || '';

  const filtered = window.allEvents?.filter(e => {
    const matchName = e.name?.toLowerCase().includes(name);
    const matchLocation = !location || e.location?.toLowerCase() === location;
    return matchName && matchLocation;
  });

  renderEvents(filtered);
}

function renderEvents(events, userId) {
  const container = document.getElementById('events-container');
  container.innerHTML = '';

  events.forEach(event => {
    const isFavorite = event.isFavorite;
    const card = document.createElement('div');
    card.className = 'event-card';
    if (isFavorite) card.classList.add('favorite');

    card.innerHTML = `
      <img src="${event.image}" alt="${event.name}">
      <h3>${event.name}</h3>
      <p>${event.location} - ${new Date(event.date).toLocaleDateString()}</p>
      <p>${event.description}</p>
      <div class="card-actions">
        <button class="book-btn" data-id="${event._id}">Book</button>
        <button class="fav-btn" data-id="${event._id}">
          <i class="fas fa-heart${isFavorite ? ' favorited' : ''}"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.onclick = async () => {
      const eventId = btn.dataset.id;
      const res = await fetch('/api/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, eventId })
      });
      const data = await res.json();
      if (data.favorited) {
        btn.querySelector('i').classList.add('favorited');
      } else {
        btn.querySelector('i').classList.remove('favorited');
      }
    };
  });

  document.querySelectorAll('.book-btn').forEach(btn => {
    btn.onclick = async () => {
      const eventId = btn.dataset.id;
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, eventId })
      });
      const data = await res.json();
      alert(data.message || 'Booking complete');
    };
  });
}


function showEventDetails(event) {
  const details = document.getElementById('event-details');
  const userId = localStorage.getItem('userId');
  const userType = localStorage.getItem('userType');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const isFavorited = event.favoritedBy?.includes(userId); // Adjust if backend adds `favoritedBy`

  details.innerHTML = `
    <div class="event-details-header">
      <div class="event-details-image">
        <img src="${event.image}" alt="${event.name}">
      </div>
      <div class="event-details-info">
        <h2>${event.name}</h2>
        <div class="event-meta">
          <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
          <span><i class="fas fa-calendar-alt"></i> ${new Date(event.date).toLocaleString()}</span>
          <span><i class="fas fa-users"></i> ${event.seats} seats</span>
          <span><i class="fas fa-dollar-sign"></i> ${event.price} SAR</span>
        </div>
        ${isLoggedIn && userType === 'attendee' ? `
          <div class="event-actions">
            <button class="btn btn-outline" id="favorite-btn">
              <i class="fas fa-heart ${isFavorited ? 'favorited' : ''}"></i> 
              ${isFavorited ? 'Unfavorite' : 'Favorite'}
            </button>
            <button class="btn btn-primary" id="book-btn">Book Now</button>
          </div>` : '<p class="login-msg">Login as attendee to interact</p>'}
      </div>
    </div>
    <div class="event-details-body">
      <p>${event.description}</p>
    </div>
  `;

  openModal(document.getElementById('event-modal'));

  if (isLoggedIn && userType === 'attendee') {
    document.getElementById('favorite-btn')?.addEventListener('click', () => {
      fetch('/api/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, eventId: event._id })
      })
        .then(res => res.json())
        .then(data => {
          showToast(data.favorited ? 'Added to favorites' : 'Removed from favorites', 'success');
          closeModal();
          fetchEvents(); // Refresh list
        });
    });

    document.getElementById('book-btn')?.addEventListener('click', () => {
      fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, eventId: event._id, seatsBooked: 1 })
      })
        .then(res => res.json())
        .then(data => {
          showToast('Booking successful!', 'success');
        });
    });
  }
}

// Modal utilities
function openModal(modal) {
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  document.getElementById('event-modal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}
