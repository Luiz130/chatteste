import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyATG5P2NvdecjCPO7gzFNGs6l7plDrxY04",
  authDomain: "sdel-16c6a.firebaseapp.com",
  projectId: "sdel-16c6a",
  storageBucket: "sdel-16c6a.appspot.com",
  messagingSenderId: "676676370586",
  appId: "1:676676370586:web:444947d3dda78a80d9df23"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let activeUser = null;

// Login
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert("Erro no login: " + e.message);
  }
});

// Após login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    document.getElementById("loginArea").style.display = "none";
    document.getElementById("chatArea").style.display = "block";
    loadUsers();
  }
});

// Carregar usuários (exceto o atual)
async function loadUsers() {
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = "";

  const usersQuery = collection(db, "users");

  onSnapshot(usersQuery, (snapshot) => {
    usersList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.uid !== currentUser.uid) {
        const li = document.createElement("li");
        li.textContent = data.email;
        li.onclick = () => {
          activeUser = data;
          document.getElementById("activeUserName").textContent = data.email;
          loadMessages();
        };
        usersList.appendChild(li);
      }
    });
  });
}

// Enviar mensagem
document.getElementById("sendBtn").addEventListener("click", async () => {
  const text = document.getElementById("messageInput").value;

  if (text.trim() === "" || !activeUser) return;

  await addDoc(collection(db, "messages"), {
    from: currentUser.uid,
    to: activeUser.uid,
    text: text,
    timestamp: serverTimestamp()
  });

  document.getElementById("messageInput").value = "";
});

// Carregar mensagens entre usuários
function loadMessages() {
  const q = query(collection(db, "messages"));
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const msg = doc.data();
      const isBetween = 
        (msg.from === currentUser.uid && msg.to === activeUser.uid) ||
        (msg.from === activeUser.uid && msg.to === currentUser.uid);

      if (isBetween) {
        const div = document.createElement("div");
        div.textContent = `${msg.from === currentUser.uid ? "Você" : activeUser.email}: ${msg.text}`;
        messagesDiv.appendChild(div);
      }
    });
  });
}
