import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

// Configuração do Firebase
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
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos do DOM
const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const messagesDiv = document.getElementById('messages');

// Função de login
window.login = async function () {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login realizado com sucesso.");
  } catch (error) {
    alert(error.message);
  }
};

// Função de logout
window.logout = async function () {
  await signOut(auth);
  messagesDiv.innerHTML = '';
};

// Função para enviar mensagem
window.sendMessage = async function () {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  const user = auth.currentUser;

  if (text && user) {
    await addDoc(collection(db, "messages"), {
      text,
      sender: user.email,
      timestamp: serverTimestamp()
    });
    input.value = '';
  }
};

// Ouvir mudanças de autenticação
onAuthStateChanged(auth, user => {
  if (user) {
    loginSection.style.display = 'none';
    chatSection.style.display = 'block';
    listenMessages();
  } else {
    loginSection.style.display = 'block';
    chatSection.style.display = 'none';
  }
});

// Função para escutar mensagens em tempo real
function listenMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp"));

  onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = '';
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.textContent = `${msg.sender}: ${msg.text}`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
