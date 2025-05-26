import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyATG5P2NvdecjCPO7gzFNGs6l7plDrxY04",
  authDomain: "sdel-16c6a.firebaseapp.com",
  projectId: "sdel-16c6a",
  storageBucket: "sdel-16c6a.firebasestorage.app",
  messagingSenderId: "676676370586",
  appId: "1:676676370586:web:444947d3dda78a80d9df23",
  measurementId: "G-FZWQ9FYZG5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let selectedUser = null;

const userList = document.getElementById("userList");
const messagesDiv = document.getElementById("messages");
const chatHeader = document.getElementById("chatHeader");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");

function renderUsers(users) {
  userList.innerHTML = "";
  users.forEach(user => {
    if (user.uid !== currentUser.uid) {
      const li = document.createElement("li");
      li.textContent = user.name;
      li.onclick = () => {
        selectedUser = user;
        chatHeader.textContent = `Conversando com ${user.name}`;
        loadMessages();
      };
      userList.appendChild(li);
    }
  });
}

function renderMessage(msg) {
  const div = document.createElement("div");
  div.classList.add("message");
  if (msg.from === currentUser.uid) div.classList.add("sent");
  div.textContent = msg.text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function loadMessages() {
  messagesDiv.innerHTML = "";
  const q = query(
    collection(db, "messages"),
    where("chatId", "==", getChatId(currentUser.uid, selectedUser.uid)),
    orderBy("timestamp")
  );

  onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => renderMessage(doc.data()));
  });
}

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedUser) return alert("Selecione um usuário!");
  await addDoc(collection(db, "messages"), {
    chatId: getChatId(currentUser.uid, selectedUser.uid),
    from: currentUser.uid,
    to: selectedUser.uid,
    text: input.value,
    timestamp: Date.now()
  });
  input.value = "";
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (!userSnap.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || "Sem Nome"
      });
    }
    loadUserList();
  } else {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }
});

import {
  getDoc, doc, setDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadUserList() {
  const q = query(collection(db, "users"));
  const snapshot = await getDocs(q);
  const users = [];
  snapshot.forEach(doc => users.push(doc.data()));
  renderUsers(users);
}
