import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyCKYyS2e03scvAyvL8ogSlGJtmgpVAhWkg",
    authDomain: "researchpaperchatbot.firebaseapp.com",
    projectId: "researchpaperchatbot",
    storageBucket: "researchpaperchatbot.appspot.com",
    messagingSenderId: "1075755092779",
    appId: "1:1075755092779:web:1887433fb37b901a61936e",
    measurementId: "G-ZBMMZ8XWR9"
};

const firebaseApp = initializeApp(firebaseConfig);

export default firebaseApp;