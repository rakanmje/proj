// === script.js ===

// Event listener setup and constants
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');
const searchInput = document.getElementById('search-input');
const locationFilter = document.getElementById('location-filter');
const searchBtn = document.getElementById('search-btn');
const eventsContainer = document.getElementById('events-container');

// Fetch events from backend
let allEvents = [];

async function fetchEvents() {
  try {
    const response = await fetch('/api/events');
    allEvents = await response.json();
    renderEvents(allEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    eventsContainer.innerHTML = '<p class="error">Failed to load events.</p>';
  }
}

// Render events to the DOM
function renderEvents(events) {
  if (!events || events.length === 0) {
    eventsContainer.innerHTML = `
      <div class="no-events">
        <i class="fas fa-calendar-times"></i>
        <p>No events found matching your criteria</p>
      </div>
    `;
    return;
  }

  eventsContainer.innerHTML = events.map(event => `
    <div class="event-card">
      <div class="event-image">
        <img src="${event.image || 'https://via.placeholder.com/300x200'}" alt="${event.name}">
      </div>
      <div class="event-info">
        <h3>${event.name}</h3>
        <p>${event.description?.substring(0, 100) || ''}...</p>
        <div class="event-meta">
          <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
          <span><i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleString()}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Search functionality (name and location only)
function filterEvents() {
  const searchTerm = searchInput.value.toLowerCase();
  const location = locationFilter.value.toLowerCase();

  const filtered = allEvents.filter(event => {
    const matchName = event.name.toLowerCase().includes(searchTerm);
    const matchLocation = !location || event.location.toLowerCase() === location;
    return matchName && matchLocation;
  });

  renderEvents(filtered);
}

// Event listeners
searchBtn.addEventListener('click', filterEvents);
searchInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') filterEvents();
});

mobileMenuToggle.addEventListener('click', () => {
  mainNav.classList.toggle('show');
});

// Initialize
fetchEvents();
