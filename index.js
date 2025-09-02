// Import the core functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-app.js";

// Import authentication-specific functions
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/9.6.5/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXHQHEpxaGPay2XGBug2Et11TsZxXLAyw",
  authDomain: "royal-traders-e2b3a.firebaseapp.com",
  projectId: "royal-traders-e2b3a",
  storageBucket: "royal-traders-e2b3a.firebasestorage.app",
  messagingSenderId: "884997197767",
  appId: "1:884997197767:web:3c723b8bd065edecec53e2",
  measurementId: "G-SFY4BWJZ3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/*
 * RoyalTraders - Shared JavaScript
 * Handles global interactions like navigation,
 * dynamic content loading (SPA model), dark mode, and Firebase auth.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Core Navigation and Dynamic Content Loading (SPA Model) ---
    const mainContent = document.getElementById('mainContent');
    const navLinks = document.querySelectorAll('.nav-link');
    const authLinks = document.getElementById('auth-links');
    const userDisplay = document.getElementById('user-display');
    const dashboardLink = document.querySelectorAll('[data-page="dashboard.html"]');

    // Function to fetch and load page content dynamically
    async function loadPage(pageUrl) {
        try {
            const response = await fetch(pageUrl);
            if (!response.ok) {
                throw new Error(`Could not fetch ${pageUrl}, status: ${response.status}`);
            }
            const html = await response.text();
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            const newContent = tempDiv.querySelector('[data-page-content]').innerHTML;
            
            mainContent.innerHTML = newContent;

            setupPageSpecificListeners();
            
        } catch (error) {
            console.error('Error loading page:', error);
            mainContent.innerHTML = `<p style="color: #dc3545;">Error loading page. Please try again.</p>`;
        }
    }

    // Function to update the UI (active link and URL)
    function updateUI(page) {
        navLinks.forEach(link => {
            if (link.dataset.page === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        history.pushState({ page: page }, '', page);
    }
    
    // Handle initial page load
    const initialPath = window.location.pathname.split('/').pop() || 'index.html';
    loadPage(initialPath);
    updateUI(initialPath);

    // Handle navigation clicks (global listener)
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('[data-page]');
        if (link) {
            e.preventDefault();
            const page = link.dataset.page;
            loadPage(page);
            updateUI(page);
        }
    });

    // Handle browser's back/forward buttons
    window.addEventListener('popstate', (e) => {
        const page = e.state ? e.state.page : (window.location.pathname.split('/').pop() || 'index.html');
        loadPage(page);
        updateUI(page);
    });

    // --- Event Listeners for Dynamically Loaded Content ---
    function setupPageSpecificListeners() {

        // --- Auth Form Toggling ---
        const signinSection = document.getElementById('signin-section');
        const signupSection = document.getElementById('signup-section');
        const showSigninLink = document.getElementById('show-signin');
        const showSignupLink = document.getElementById('show-signup');
        
        if (showSigninLink) {
            showSigninLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (signinSection && signupSection) {
                    signinSection.style.display = 'block';
                    signupSection.style.display = 'none';
                }
            });
        }
        if (showSignupLink) {
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (signinSection && signupSection) {
                    signupSection.style.display = 'block';
                    signinSection.style.display = 'none';
                }
            });
        }
        
        // --- Firebase Auth Logic ---
        const signupForm = document.getElementById('signup-form');
        const signinForm = document.getElementById('signin-form');
        const signupErrorMessage = document.getElementById('signup-error-message');
        const signinErrorMessage = document.getElementById('signin-error-message');
        
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = signupForm['signup-email'].value;
                const password = signupForm['signup-password'].value;
                
                createUserWithEmailAndPassword(auth, email, password)
                .then(() => {
                    alert('Account created successfully! You are now signed in.');
                    loadPage('index.html'); // Redirect to dashboard or home
                })
                .catch((error) => {
                    if(signupErrorMessage) {
                        signupErrorMessage.textContent = error.message;
                    }
                });
            });
        }

        if (signinForm) {
            signinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = signinForm['signin-email'].value;
                const password = signinForm['signin-password'].value;
                
                signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    alert('Successfully signed in!');
                    loadPage('index.html'); // Redirect to dashboard or home
                })
                .catch((error) => {
                    if(signinErrorMessage) {
                        signinErrorMessage.textContent = error.message;
                    }
                });
            });
        }
        
        // --- Other Page-Specific Logic ---
        const announcementCard = document.querySelector('.announcement-card');
        const dismissBtn = document.querySelector('.announcement-card .close-btn');

        if (announcementCard && dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                announcementCard.style.display = 'none';
            });
        }

        const runButton = document.getElementById('runButton');
        const statusTag = document.getElementById('statusTag');
        if (runButton && statusTag) {
            runButton.addEventListener('click', () => {
                // Your run button logic here
            });
        }
    }

    // --- Global & Persistent Logic ---

    // Auth State Listener: Controls UI based on login status
    onAuthStateChanged(auth, (user) => {
        if (user) {
            authLinks.style.display = 'none';
            userDisplay.innerHTML = `<span class="user-email">${user.email}</span><button id="sign-out-button" class="btn btn-outline-danger btn-sm ml-2">Sign Out</button>`;
            userDisplay.style.display = 'flex';
            dashboardLink.forEach(link => link.style.display = 'block');

            // Re-attach sign-out listener
            const signOutButton = document.getElementById('sign-out-button');
            if (signOutButton) {
                signOutButton.addEventListener('click', () => {
                    signOut(auth).then(() => {
                        alert('You have been signed out.');
                        loadPage('index.html'); // Redirect to home page
                    }).catch((error) => {
                        console.error('Sign-out error:', error);
                    });
                });
            }
        } else {
            authLinks.style.display = 'block';
            userDisplay.style.display = 'none';
            dashboardLink.forEach(link => link.style.display = 'none');
        }
    });

    // Dark Mode (persistent and global)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light-mode') {
        document.body.classList.add('light-mode');
    }
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const theme = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
            localStorage.setItem('theme', theme);
        });
    }

    // Dynamic Date & Time
    const dateTimeElement = document.getElementById('dateTime');
    if (dateTimeElement) {
        function updateDateTime() {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            };
            const formattedDate = now.toLocaleString('en-US', options);
            dateTimeElement.textContent = `GMT: ${formattedDate}`;
        }
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }
});
// ... (Your existing index.js code) ...

    function setupPageSpecificListeners() {
        // ... (Your existing code for login forms, etc.) ...

        const announcementCard = document.querySelector('.announcement-card');
        const dismissBtn = document.querySelector('.announcement-card .close-btn');

        if (announcementCard && dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                announcementCard.style.display = 'none';
            });
        }

        const runButton = document.getElementById('runButton');
        const statusTag = document.getElementById('statusTag');
        if (runButton && statusTag) {
            runButton.addEventListener('click', () => {
                // Your run button logic here
                statusTag.textContent = 'Bot is running';
                statusTag.classList.remove('text-danger');
                statusTag.classList.add('text-success');
                // You would add your bot logic here, e.g., fetching data from an API
            });
        }
        
        // Add listeners for the new Market Analyzer elements
        const tradeTypeSelect = document.getElementById('tradeType');
        const syntheticMarketSelect = document.getElementById('syntheticMarket');

        if (tradeTypeSelect) {
            tradeTypeSelect.addEventListener('change', (e) => {
                console.log('Trade type changed to:', e.target.value);
            });
        }
        
        if (syntheticMarketSelect) {
            syntheticMarketSelect.addEventListener('change', (e) => {
                console.log('Synthetic Market changed to:', e.target.value);
            });
        }
    }

// ... (Rest of your existing index.js code) ...