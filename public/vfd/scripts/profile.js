document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem('userId');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!userId || !isLoggedIn) {
    alert("You must be logged in to view this page.");
    window.location.href = "log.html";
    return;
  }

  fetch(`/api/user/${userId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('user-name').textContent = data.name;
      document.getElementById('bio').value = data.bio || '';
      document.getElementById('user-bio').textContent = data.bio || '';
      document.getElementById('email').value = data.email;
      document.getElementById('events-attended').textContent = data.past.length;
      document.getElementById('years-member').textContent = calculateYears(data.registeredAt);

      if (data.profilePic) {
        document.querySelector('.profile-picture img').src = data.profilePic;
      }

      renderEventList(data.upcoming, 'upcoming-events');
      renderEventList(data.past, 'past-events');
      renderEventList(data.saved, 'saved-events', true);
    })
    .catch(() => {
      alert("Failed to load user profile.");
    });

  // Update name and bio
  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bio = document.getElementById('bio').value;
    const name = document.getElementById('name').value;
    const res = await fetch(`/api/user/${userId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, name })
    });
    const result = await res.json();
    if (result.success) {
      alert("Profile updated!");
      document.getElementById('user-name').textContent = name;
      document.getElementById('user-bio').textContent = bio;
    } else {
      alert("Failed to update profile.");
    }
  });

  // Upload profile photo
  const changePhotoBtn = document.getElementById('change-photo-btn');
  if (changePhotoBtn) {
    changePhotoBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('photo', file);
        const res = await fetch(`/api/user/${userId}/photo`, {
          method: 'POST',
          body: formData
        });
        const result = await res.json();
        if (result.success) {
          document.querySelector('.profile-picture img').src = result.photo;
          alert("Profile picture updated!");
        } else {
          alert("Failed to upload photo.");
        }
      };
      input.click();
    });
  }

  // Tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-tab');
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
      button.classList.add('active');
      document.getElementById(`${tab}-tab`).style.display = 'block';
    });
  });
});

function calculateYears(dateStr) {
  const regDate = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - regDate.getFullYear();
  const m = now.getMonth() - regDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < regDate.getDate())) {
    years--;
  }
  return years;
}

function renderEventList(events, containerId, saved = false) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!events || events.length === 0) {
    container.innerHTML = '<p>No events available.</p>';
    return;
  }

  events.forEach(event => {
    const item = document.createElement('div');
    item.className = 'event-item';
    item.innerHTML = `
      <h4>${event.name}</h4>
      <p><i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString()}</p>
      <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
      <div class="event-actions">
        <button class="btn">${saved ? 'Remove from Saved' : 'View Details'}</button>
      </div>
    `;
    container.appendChild(item);
  });
}
