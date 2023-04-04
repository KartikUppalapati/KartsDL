// Firebase config
const firebaseConfig = 
{
    apiKey: "AIzaSyCkdxsWuu2lggjUxsHmqxlFFixtPqqlkJc",
    authDomain: "mmthours.firebaseapp.com",
    projectId: "mmthours",
    storageBucket: "mmthours.appspot.com",
    messagingSenderId: "957227662713",
    appId: "1:957227662713:web:91cf4c1b42e9aeea4603a8",
    measurementId: "G-MNQ0TFN4NJ"
};

// Initialize and use
firebase.initializeApp(firebaseConfig);
let db = firebase.firestore();

// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCkdxsWuu2lggjUxsHmqxlFFixtPqqlkJc",
//   authDomain: "mmthours.firebaseapp.com",
//   projectId: "mmthours",
//   storageBucket: "mmthours.appspot.com",
//   messagingSenderId: "957227662713",
//   appId: "1:957227662713:web:91cf4c1b42e9aeea4603a8",
//   measurementId: "G-MNQ0TFN4NJ"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// const db = getFirestore(app);


// Get a list of tutors from your database
async function getTutors(db) 
{
    const tutorsDatabase = collection(db, 'Tutors');
    const tutors = await getDocs(tutorsDatabase);
    const tutorData = tutors.docs.map(doc => doc.data());
    return tutorData;
}