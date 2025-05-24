
document.addEventListener('DOMContentLoaded', function() {
    setupExpandableSections();
    
    setupContactForm();
    
    setupCookieConsent();
    
    detectRegionAndUpdatePolicy();
    
    trackTimeSpent();
});


function setupExpandableSections() {
    const sections = document.querySelectorAll('.privacy-section h3');
    
    sections.forEach(section => {
        section.innerHTML += '<span class="expand-icon">+</span>';
        
        section.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const isCollapsed = content.style.display === 'none';
            
            if (isCollapsed) {
                content.style.display = 'block';
                this.querySelector('.expand-icon').textContent = '-';
            } else {
                content.style.display = 'none';
                this.querySelector('.expand-icon').textContent = '+';
            }
        });
    });
    
    if (sections.length > 1) {
        for (let i = 1; i < sections.length; i++) {
            const content = sections[i].nextElementSibling;
            if (content) {
                content.style.display = 'none';
            }
        }
    }
}


function setupContactForm() {
    const contactBtn = document.getElementById('privacy-contact-btn');
    
    if (contactBtn) {
        contactBtn.addEventListener('click', function() {
   
            const modal = document.createElement('div');
            modal.className = 'privacy-modal';
            modal.innerHTML = `
                <div class="privacy-modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>Privacy Inquiry Form</h3>
                    <form id="privacy-inquiry-form">
                        <div class="form-group">
                            <label for="name">Full Name:</label>
                            <input type="text" id="name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email Address:</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="inquiry-type">Inquiry Type:</label>
                            <select id="inquiry-type" name="inquiry-type">
                                <option value="access">Request Data Access</option>
                                <option value="delete">Request Data Deletion</option>
                                <option value="correct">Correct My Data</option>
                                <option value="question">General Privacy Question</option>
                                <option value="complaint">Lodge Complaint</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="message">Message:</label>
                            <textarea id="message" name="message" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn">Submit Inquiry</button>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
         
            const closeBtn = modal.querySelector('.close-modal');
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
            
   
            const form = document.getElementById('privacy-inquiry-form');
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(form);
                console.log('Form submission:', Object.fromEntries(formData));
                
                modal.innerHTML = `
                    <div class="privacy-modal-content">
                        <span class="close-modal">&times;</span>
                        <h3>Thank You!</h3>
                        <p>We have received your privacy inquiry. Our team will respond within 48 hours.</p>
                        <p>Inquiry reference number: PRV-${Date.now().toString().slice(-8)}</p>
                        <button class="btn close-btn">Close</button>
                    </div>
                `;
                
                modal.querySelector('.close-modal').addEventListener('click', function() {
                    document.body.removeChild(modal);
                });
                
                modal.querySelector('.close-btn').addEventListener('click', function() {
                    document.body.removeChild(modal);
                });
            });
        });
    }
}


function setupCookieConsent() {
    if (!localStorage.getItem('cookieConsent')) {
        const consentBanner = document.createElement('div');
        consentBanner.className = 'cookie-consent-banner';
        consentBanner.innerHTML = `
            <div class="cookie-content">
                <p>We use cookies to enhance your experience on our website. By continuing to use our site, you consent to our use of cookies. 
                   <a href="#cookie-policy">Learn more</a></p>
                <div class="cookie-buttons">
                    <button id="accept-all-cookies" class="btn">Accept All</button>
                    <button id="accept-essential-cookies" class="btn btn-secondary">Essential Only</button>
                    <button id="cookie-preferences" class="btn btn-text">Preferences</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(consentBanner);
        
        document.getElementById('accept-all-cookies').addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'all');
            document.body.removeChild(consentBanner);
        });
        
        document.getElementById('accept-essential-cookies').addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'essential');
            document.body.removeChild(consentBanner);
        });
        
        document.getElementById('cookie-preferences').addEventListener('click', function() {
            showCookiePreferencesModal();
        });
    }
}


function showCookiePreferencesModal() {
    const modal = document.createElement('div');
    modal.className = 'privacy-modal';
    modal.innerHTML = `
        <div class="privacy-modal-content">
            <span class="close-modal">&times;</span>
            <h3>Cookie Preferences</h3>
            <p>Customize which cookies you allow us to use. Essential cookies cannot be disabled as they are necessary for the website to function properly.</p>
            
            <div class="cookie-preferences-form">
                <div class="cookie-option">
                    <input type="checkbox" id="essential-cookies" checked disabled>
                    <label for="essential-cookies">Essential Cookies</label>
                    <p class="cookie-description">These cookies are necessary for the website to function properly.</p>
                </div>
                
                <div class="cookie-option">
                    <input type="checkbox" id="preference-cookies" checked>
                    <label for="preference-cookies">Preference Cookies</label>
                    <p class="cookie-description">These cookies allow the website to remember choices you make and provide enhanced features.</p>
                </div>
                
                <div class="cookie-option">
                    <input type="checkbox" id="analytics-cookies" checked>
                    <label for="analytics-cookies">Analytics Cookies</label>
                    <p class="cookie-description">These cookies help us understand how visitors interact with our website.</p>
                </div>
                
                <div class="cookie-option">
                    <input type="checkbox" id="marketing-cookies">
                    <label for="marketing-cookies">Marketing Cookies</label>
                    <p class="cookie-description">These cookies are used to track visitors across websites to display relevant advertisements.</p>
                </div>
            </div>
            
            <button id="save-preferences" class="btn">Save Preferences</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
 
    modal.querySelector('.close-modal').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    document.getElementById('save-preferences').addEventListener('click', function() {
        const preferences = {
            essential: true, 
            preference: document.getElementById('preference-cookies').checked,
            analytics: document.getElementById('analytics-cookies').checked,
            marketing: document.getElementById('marketing-cookies').checked
        };
        
        localStorage.setItem('cookieConsent', 'custom');
        localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
        
        document.body.removeChild(modal);
        const banner = document.querySelector('.cookie-consent-banner');
        if (banner) {
            document.body.removeChild(banner);
        }
    });
}


function detectRegionAndUpdatePolicy() {
   
    const urlParams = new URLSearchParams(window.location.search);
    const region = urlParams.get('region') || 'global';
    
    const dataRightsList = document.getElementById('data-rights-list');
    
    if (dataRightsList) {
        if (region === 'eu' || region === 'uk') {
          
            const gdprInfo = document.createElement('div');
            gdprInfo.className = 'info-box';
            gdprInfo.innerHTML = `
                <h4>GDPR Compliance</h4>
                <p>As a user based in the European Union or United Kingdom, you have specific rights under the General Data Protection Regulation (GDPR).</p>
                <p>For GDPR-related inquiries, you can contact our Data Protection Officer at dpo@yourcompany.com</p>
            `;
            
            dataRightsList.parentNode.insertBefore(gdprInfo, dataRightsList.nextSibling);
        } else if (region === 'california') {
           
            const ccpaInfo = document.createElement('div');
            ccpaInfo.className = 'info-box';
            ccpaInfo.innerHTML = `
                <h4>California Consumer Privacy Act (CCPA) Notice</h4>
                <p>As a California resident, you have specific rights under the California Consumer Privacy Act (CCPA).</p>
                <p>You have the right to know what personal information we collect about you and how we use it. You also have the right to request deletion of your personal information.</p>
                <p>To make a request under CCPA, please contact us through our <a href="#" id="ccpa-request-link">California Consumer Request Form</a>.</p>
            `;
            
            dataRightsList.parentNode.insertBefore(ccpaInfo, dataRightsList.nextSibling);
            
          
            document.getElementById('ccpa-request-link').addEventListener('click', function(e) {
                e.preventDefault();
                alert('In a real implementation, this would open a California-specific request form.');
            });
        }
    }
}


function trackTimeSpent() {
    const startTime = Date.now();
    
  
    window.addEventListener('beforeunload', function() {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        
        
        console.log(`User spent ${timeSpent} seconds on privacy policy page`);
    });
}


function setupVersionHistory() {
  
    const lastUpdated = document.querySelector('.last-updated');
    
    if (lastUpdated) {
        const versionLink = document.createElement('span');
        versionLink.className = 'version-history-link';
        versionLink.textContent = ' (View Previous Versions)';
        versionLink.style.cursor = 'pointer';
        versionLink.style.textDecoration = 'underline';
        
        lastUpdated.appendChild(versionLink);
        
       
        versionLink.addEventListener('click', function() {
            const modal = document.createElement('div');
            modal.className = 'privacy-modal';
            modal.innerHTML = `
                <div class="privacy-modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>Privacy Policy Version History</h3>
                    <ul class="version-list">
                        <li>
                            <strong>May 17, 2025</strong> - Current version
                            <p>Updated to include more detailed information about data processing practices.</p>
                        </li>
                        <li>
                            <strong>January 10, 2025</strong>
                            <p>Updated to comply with new data protection regulations.</p>
                        </li>
                        <li>
                            <strong>August 15, 2024</strong>
                            <p>Initial privacy policy published.</p>
                        </li>
                    </ul>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('.close-modal').addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        });
    }
}

setupVersionHistory();

function setupPrintFunctionality() {
    const container = document.querySelector('.container');
    
    if (container) {
        const printBtn = document.createElement('button');
        printBtn.className = 'btn print-btn';
        printBtn.innerHTML = '<span>Print Privacy Policy</span>';
        printBtn.style.float = 'right';
        printBtn.style.marginTop = '10px';
        
        const lastUpdated = document.querySelector('.last-updated');
        if (lastUpdated) {
            lastUpdated.parentNode.insertBefore(printBtn, lastUpdated.nextSibling);
        } else {
            container.querySelector('header').appendChild(printBtn);
        }
        
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
}

setupPrintFunctionality();

function setupLanguageSelector() {
    const container = document.querySelector('.container');
    
    if (container) {
        const langSelector = document.createElement('div');
        langSelector.className = 'language-selector';
        langSelector.innerHTML = `
            <label for="language-select">Language: </label>
            <select id="language-select">
                <option value="en" selected>English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
            </select>
        `;
        
        container.querySelector('header').appendChild(langSelector);
        
        document.getElementById('language-select').addEventListener('change', function(e) {
            const language = e.target.value;
            
            console.log(`Language changed to: ${language}`);
            alert(`This would load the privacy policy in the selected language: ${language}`);
        });
    }
}

setupLanguageSelector();