import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, query,
  where, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase config
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

// Variáveis globais
let currentUser = null;
let selectedUser = null;

// DOM
const userList = document.getElementById("userList");
const messagesDiv = document.getElementById("messages");
const chatHeader = document.getElementById("chatHeader");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");

// Gera ID do chat entre dois usuários
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// Carrega lista de usuários do Firestore
async function loadUserList() {
  const snapshot = await getDocs(collection(db, "users"));
  const users = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.uid !== currentUser.uid) {
      users.push(data);
    }
  });

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

// Carrega mensagens entre currentUser e selectedUser
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

// ✅ Corrigido: Enviar mensagem com verificação
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = input.value.trim();

  if (!text) {
    alert("Digite uma mensagem.");
    return;
  }

  if (!currentUser || !selectedUser) {
    alert("Selecione um usuário para conversar.");
    return;
  }

  try {
    const chatId = getChatId(currentUser.uid, selectedUser.uid);

    await addDoc(collection(db, "messages"), {
      chatId: chatId,
      from: currentUser.uid,
      to: selectedUser.uid,
      text: text,
      timestamp: Date.now()
    });

    input.value = "";
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    alert("Erro ao enviar mensagem. Veja o console.");
  }
});

// Login com Google
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
