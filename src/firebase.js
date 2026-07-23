import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "ここにFirebaseのapiKey",
  authDomain: "ここにauthDomain",
  projectId: "ここにprojectId",
  storageBucket: "ここにstorageBucket",
  messagingSenderId: "ここにmessagingSenderId",
  appId: "ここにappId"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
