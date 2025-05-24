document.addEventListener('DOMContentLoaded', function() {
    const tocLinks = document.querySelectorAll('.terms-toc-link');
    
    tocLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        window.scrollTo({
          top: targetElement.offsetTop - 20,
          behavior: 'smooth'
        });
      });
    });
    
    window.addEventListener('scroll', function() {
      const sections = document.querySelectorAll('.terms-section');
      const scrollPosition = window.scrollY + 100;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          const currentId = section.getAttribute('id');
          
          tocLinks.forEach(link => {
            link.classList.remove('active');
          });
          
          const activeLink = document.querySelector(`.terms-toc-link[href="#${currentId}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    });
  });
