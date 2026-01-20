import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TAVO_KEY",
  authDomain: "TAVO.firebaseapp.com",
  projectId: "TAVO_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("form");
const wall = document.getElementById("wall");

form.onsubmit = async (e) => {
  e.preventDefault();
  await addDoc(collection(db, "compliments"), {
    to: to.value,
    text: text.value,
    createdAt: serverTimestamp(),
    likes: 0
  });
  form.reset();
  load();
};

async function load() {
  wall.innerHTML = "";
  const snap = await getDocs(collection(db, "compliments"));
  snap.forEach(doc => {
    const d = doc.data();
    wall.innerHTML += `
      <div class="card">
        <b>💬 ${d.to}</b>
        <p>${d.text}</p>
        ❤️ ${d.likes}
      </div>`;
  });
}

load();
