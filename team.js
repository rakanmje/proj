document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const teamMembers = document.querySelectorAll('.team-member');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        const filter = this.getAttribute('data-filter');
        
        teamMembers.forEach(member => {
          if (filter === 'all' || member.getAttribute('data-category') === filter) {
            member.style.display = 'block';
          } else {
            member.style.display = 'none';
          }
        });
      });
    });
    
    teamMembers.forEach(member => {
      member.addEventListener('mouseenter', function() {
        const image = this.querySelector('.member-image img');
        image.style.transform = 'scale(1.1)';
      });
      
      member.addEventListener('mouseleave', function() {
        const image = this.querySelector('.member-image img');
        image.style.transform = 'scale(1)';
      });
    });
  });