import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, query,
  where, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyATG5P2NvdecjCPO7gzFNGs6l7plDrxY04",
  authDomain: "sdel-16c6a.firebaseapp.com",
  projectId: "sdel-16c6a",
  storageBucket: "sdel-16c6a.firebasestorage.app",
  messagingSenderId: "676676370586",
  appId: "1:676676370586:web:444947d3dda78a80d9df23",
  measurementId: "G-FZWQ9FYZG5"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let selectedUser = null;

// Elementos DOM
const userList = document.getElementById("userList");
const messagesDiv = document.getElementById("messages");
const chatHeader = document.getElementById("chatHeader");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");

// Gera ID único para o chat entre dois usuários
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// Carrega lista de usuários (exceto o atual)
async function loadUserList() {
  const snapshot = await getDocs(collection(db, "users"));
  userList.innerHTML = "";
  snapshot.forEach(doc => {
    const user = doc.data();
    if (user.uid !== currentUser.uid) {
      const li = document.createElement("li");
      li.textContent = user.name;
      li.style.cursor = "pointer";
      li.onclick = () => {
        selectedUser = user;
        chatHeader.textContent = `Conversando com ${user.name}`;
        loadMessages();
        form.style.display = "flex"; // mostra o form quando seleciona alguém
      };
      userList.appendChild(li);
    }
  });
}

// Carrega mensagens em tempo real entre currentUser e selectedUser
function loadMessages() {
  if (!selectedUser) return;

  messagesDiv.innerHTML = "";
  const chatId = getChatId(currentUser.uid, selectedUser.uid);

  const q = query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    orderBy("timestamp")
  );

  onSnapshot(q, (snapshot) => {
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

// Evento para enviar mensagem (com verificação)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = input.value.trim();

  if (!text) {
    alert("Digite uma mensagem.");
    return;
  }

  if (!selectedUser || !selectedUser.uid) {
    alert("Selecione um usuário para conversar.");
    return;
  }

  if (!currentUser || !currentUser.uid) {
    alert("Usuário não autenticado.");
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
    alert("Erro ao enviar mensagem. Veja o console para detalhes.");
  }
});

// Autenticação Google e carregamento inicial
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    // Salva usuário no Firestore se não existir
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "Usuário sem nome"
      });
    }

    await loadUserList();

    form.style.display = "none"; // esconde o form até selecionar usuário
    chatHeader.textContent = "Selecione um usuário para conversar";
  } else {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }
});
