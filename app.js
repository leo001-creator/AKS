import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔧 FIREBASE CONFIG (ĮSIDĖK SAVO) */
const firebaseConfig = {
  apiKey: "TAVO_API_KEY",
  authDomain: "TAVO_PROJECT.firebaseapp.com",
  projectId: "TAVO_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===== AUTH ===== */
let UID = null;
signInAnonymously(auth).then(r => UID = r.user.uid);

/* ===== DOM ===== */
const toI = document.getElementById("to");
const textI = document.getElementById("text");
const sendBtn = document.getElementById("send");
const wall = document.getElementById("wall");
const sort = document.getElementById("sort");
const randomBtn = document.getElementById("random");

/* ===== LOCAL RATE LIMIT ===== */
const LIMIT_KEY = "aks_last_send";

/* ===== SIMPLE FILTER ===== */
const BAD = ["idiot","durn","fuck","shit"];
const clean = s => BAD.some(w => s.toLowerCase().includes(w));

/* ===== SEND ===== */
sendBtn.onclick = async () => {
  const now = Date.now();
  const last = Number(localStorage.getItem(LIMIT_KEY) || 0);
  if (now - last < 30000) return alert("Palauk 30 sek.");

  const to = toI.value.trim().slice(0,40) || "Kažkam";
  const text = textI.value.trim().slice(0,300);
  if (!text) return;

  if (clean(text) || clean(to)) return alert("Netinkamas turinys");

  await addDoc(collection(db,"compliments"),{
    to,
    text,
    likes: 0,
    reports: [],
    createdAt: serverTimestamp()
  });

  localStorage.setItem(LIMIT_KEY, now);
  toI.value = "";
  textI.value = "";
};

/* ===== LOAD WALL ===== */
let unsub = null;
function load() {
  if (unsub) unsub();
  const q = sort.value === "top"
    ? query(collection(db,"compliments"), orderBy("likes","desc"), orderBy("createdAt","desc"))
    : query(collection(db,"compliments"), orderBy("createdAt","desc"));

  unsub = onSnapshot(q, snap => {
    wall.innerHTML = "";
    snap.forEach(d => render(d.id, d.data()));
  });
}
sort.onchange = load;

/* ===== RENDER ===== */
function render(id, d) {
  const card = document.createElement("div");
  card.className = "card";

  const liked = localStorage.getItem("aks_like_"+id);

  card.innerHTML = `
    <b>💬 ${escape(d.to)}</b>
    <p>${escape(d.text)}</p>
    <div class="actions">
      <span class="like ${liked?"active":""}">❤️ ${d.likes}</span>
      <span class="report">🚩</span>
    </div>
  `;

  card.querySelector(".like").onclick = async () => {
    if (liked) return;
    localStorage.setItem("aks_like_"+id, "1");
    await updateDoc(doc(db,"compliments",id),{likes: increment(1)});
  };

  card.querySelector(".report").onclick = async () => {
    if (d.reports?.includes(UID)) return;
    await updateDoc(doc(db,"compliments",id),{
      reports: [...(d.reports||[]), UID]
    });
    alert("Pranešta");
  };

  wall.appendChild(card);
}

/* ===== RANDOM ===== */
randomBtn.onclick = () => {
  const cards = [...wall.children];
  if (!cards.length) return;
  const r = cards[Math.floor(Math.random()*cards.length)];
  r.scrollIntoView({behavior:"smooth",block:"center"});
  r.style.outline = "2px solid var(--accent)";
  setTimeout(()=>r.style.outline="none",1500);
};

/* ===== XSS SAFE ===== */
function escape(s){
  return s.replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}

load();
