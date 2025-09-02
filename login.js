// login.js

// Import Firebase functions (using the module syntax for clarity and future-proofing)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-firestore.js";

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
const db = getFirestore(app);

// Function to save user data
async function saveUserData(user, countryCode) {
    const userRef = doc(db, 'users', user.uid);
    // Ensure countryCode is not undefined or null
    const data = {
        email: user.email,
        country: countryCode || 'KE', // Fallback to 'KE' if countryCode is missing
        balance: 1000.00
    };
    await setDoc(userRef, data, { merge: true });
}

// Function to populate countries, this can be an async function
async function populateCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const countries = await response.json();

        const sorted = countries.sort((a,b) => a.name.common.localeCompare(b.name.common));
        const signinCountrySelect = $("#signin-country");
        const signupCountrySelect = $("#signup-country");

        sorted.forEach(country => {
            const option = new Option(`${country.flag} ${country.name.common}`, country.cca2);
            signinCountrySelect.append($(option).clone());
            signupCountrySelect.append(option);
        });

        signinCountrySelect.select2({
            placeholder: "Select your country",
            allowClear: true
        });
        signupCountrySelect.select2({
            placeholder: "Select your country",
            allowClear: true
        });
    } catch (err) {
        console.error("Country fetch failed:", err);
        // Fallback to a default country
        $("#signin-country").append(new Option("🇰🇪 Kenya", "KE"));
        $("#signup-country").append(new Option("🇰🇪 Kenya", "KE"));
        $("#signin-country, #signup-country").select2();
    }
}

// Ensure the entire script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    const signinSection = document.getElementById('signin-section');
    const signupSection = document.getElementById('signup-section');
    const showSignupLink = document.getElementById('show-signup');
    const showSigninLink = document.getElementById('show-signin');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const signinErrorMessage = document.getElementById('signin-error-message');
    const signupErrorMessage = document.getElementById('signup-error-message');
    const googleSignInBtn = document.getElementById('google-signin-btn');
    const signinCountrySelect = $("#signin-country");
    const signupCountrySelect = $("#signup-country");

    // Initialize country population outside of the async wait
    populateCountries();

    // --- Form Toggling Logic ---
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (signinSection && signupSection) {
                signinSection.style.display = 'none';
                signupSection.style.display = 'block';
                signinErrorMessage.textContent = "";
            }
        });
    }

    if (showSigninLink) {
        showSigninLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupSection && signinSection) {
                signupSection.style.display = 'none';
                signinSection.style.display = 'block';
                signupErrorMessage.textContent = "";
            }
        });
    }

    // --- Firebase Auth Logic ---
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            const country = signupCountrySelect.val();

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    return saveUserData(userCredential.user, country);
                })
                .then(() => {
                    alert('Account created successfully!');
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    if (signupErrorMessage) {
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
            const country = signinCountrySelect.val(); // Get the selected country

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    return saveUserData(userCredential.user, country);
                })
                .then(() => {
                    alert('Successfully signed in!');
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    if (signinErrorMessage) {
                        signinErrorMessage.textContent = error.message;
                    }
                });
        });
    }

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            const provider = new GoogleAuthProvider();
            const country = signinCountrySelect.val(); // Get the country from the sign-in form

            signInWithPopup(auth, provider)
                .then((result) => {
                    return saveUserData(result.user, country);
                })
                .then(() => {
                    alert('Successfully signed in with Google!');
                    window.location.href = 'index.html';
                }).catch((error) => {
                    if (signinErrorMessage) {
                        signinErrorMessage.textContent = error.message;
                    }
                });
        });
    }
});