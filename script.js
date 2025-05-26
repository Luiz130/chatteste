// Imports Firebase (ajuste a versão e caminhos conforme seu setup)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Config Firebase (use sua config)
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

// DOM Elements
const userList = document.getElementById("userList");
const messagesDiv = document.getElementById("messages");
const chatHeader = document.getElementById("chatHeader");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");

// Função para gerar chatId único para dois usuários
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// Exibe lista de usuários (exceto o atual)
async function loadUserList() {
  userList.innerHTML = "";
  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(doc => {
    const user = doc.data();
    if (user.uid !== currentUser.uid) {
      const li = document.createElement("li");
      li.textContent = user.name;
      li.style.cursor = "pointer";
      li.onclick = () => {
        selectedUser = user;
        chatHeader.textContent = `Conversando com ${user.name}`;
        form.style.display = "flex"; // mostrar formulário só quando selecionar usuário
        loadMessages();
      };
      userList.appendChild(li);
    }
  });
}

// Carrega mensagens entre currentUser e selectedUser em tempo real
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

// Envio da mensagem com validações
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
      chatId,
      from: currentUser.uid,
      to: selectedUser.uid,
      text,
      timestamp: Date.now()
    });
    input.value = "";
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    alert("Erro ao enviar mensagem. Veja o console.");
  }
});

// Autenticação Google e carregamento da lista
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = {
      uid: result.user.uid,
      name: result.user.displayName,
      email: result.user.email
    };

    // Salva/atualiza usuário no Firestore (coleção users)
    await setDoc(doc(db, "users", currentUser.uid), currentUser);

    // Exibe lista de usuários para conversar
    await loadUserList();

    form.style.display = "none"; // esconde form até selecionar usuário
    chatHeader.textContent = "Selecione um usuário para conversar";

  } catch (error) {
    console.error("Erro no login:", error);
  }
}

// Escuta mudanças de estado do usuário (login/logout)
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = {
      uid: user.uid,
      name: user.displayName,
      email: user.email
    };
    loadUserList();
    form.style.display = "none";
    chatHeader.textContent = "Selecione um usuário para conversar";
  } else {
    currentUser = null;
    userList.innerHTML = "";
    messagesDiv.innerHTML = "";
    form.style.display = "none";
    chatHeader.textContent = "Faça login para usar o chat";
  }
});

// Iniciar login (pode ser ligado a um botão no seu HTML)
document.getElementById("btnLoginGoogle").addEventListener("click", loginWithGoogle);
