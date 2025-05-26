import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, query,
  where, orderBy, onSnapshot
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

// DOM
const userList = document.getElementById("userList");
const messagesDiv = document.getElementById("messages");
const chatHeader = document.getElementById("chatHeader");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");

// Função para montar um ID único para o chat
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// Carregar lista de usuários
async function loadUserList() {
  const snapshot = await getDocs(collection(db, "users"));
  const users = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.uid !== currentUser.uid) {
      users.push(data);
    }
  });

  // Renderiza
  userList.innerHTML = "";
  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user.name;
    li.onclick = () => {
      selectedUser = user;
      chatHeader.textContent = `Conversando com ${user.name}`;
      loadMessages();
    };
    userList.appendChild(li);
  });
}

// Carregar mensagens do Firestore
function loadMessages() {
  if (!selectedUser) return;

  messagesDiv.innerHTML = "";
  const chatId = getChatId(currentUser.uid, selectedUser.uid);
  const q = query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    orderBy("timestamp")
  );

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.classList.add("message");
      div.classList.add(msg.from === currentUser.uid ? "sent" : "received");
      div.textContent = msg.text;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// Enviar mensagem
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!input.value.trim() || !selectedUser) return;

  const chatId = getChatId(currentUser.uid, selectedUser.uid);
  await addDoc(collection(db, "messages"), {
    chatId,
    from: currentUser.uid,
    to: selectedUser.uid,
    text: input.value.trim(),
    timestamp: Date.now()
  });
  input.value = "";
});

// Login automático com Google
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "Sem nome"
      });
    }

    await loadUserList();
  } else {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }
});
