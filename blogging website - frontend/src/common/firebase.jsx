// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider, signInWithPopup} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEC2xAUO5zpXxpgKsY941LHtOANsUfI5I",
  authDomain: "blog-website-p.firebaseapp.com",
  projectId: "blog-website-p",
  storageBucket: "blog-website-p.appspot.com",
  messagingSenderId: "583485387798",
  appId: "1:583485387798:web:f3d7c09f8bc501d921f137"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {

    let user = null;
    console.log("authWithGoogle");
    await signInWithPopup(auth, provider)
    .then((result) => {
      console.log("ok");
      user = result.user
    })
    .catch((err) => {
      console.log(err);
    })
    return user;
}