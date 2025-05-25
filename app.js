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

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM
const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const messagesDiv = document.getElementById('messages');

// Login
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      console.log("Login realizado");
    })
    .catch(error => {
      alert(error.message);
    });
}

// Logout
function logout() {
  auth.signOut();
  messagesDiv.innerHTML = '';
}

// Enviar mensagem
function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  const user = auth.currentUser;

  if (text && user) {
    db.collection("messages").add({
      text: text,
      sender: user.email,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = '';
  }
}

// Escutar autenticação
auth.onAuthStateChanged(user => {
  if (user) {
    loginSection.style.display = 'none';
    chatSection.style.display = 'block';
    listenMessages();
  } else {
    loginSection.style.display = 'block';
    chatSection.style.display = 'none';
  }
});

// Ouvir mensagens em tempo real
function listenMessages() {
  db.collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
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
