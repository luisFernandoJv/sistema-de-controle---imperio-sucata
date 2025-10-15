import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDLXoxjkme_riekPnFIZbIoxOijgbN1tsw",
  authDomain: "imperio-sucata.firebaseapp.com",
  projectId: "imperio-sucata",
  storageBucket: "imperio-sucata.firebasestorage.app",
  messagingSenderId: "850725484808",
  appId: "1:850725484808:web:1e1d714d7355d7e45b14bd",
  measurementId: "G-96NNCRWXXJ",
}

let app
let db

try {
  console.log("[v0] Inicializando Firebase...")
  app = initializeApp(firebaseConfig)
  console.log("[v0] Firebase inicializado com sucesso")

  // Inicializar Firestore
  db = getFirestore(app)
  console.log("[v0] Firestore inicializado com sucesso")

  // Verificar se está em desenvolvimento
  if (import.meta.env.DEV) {
    console.log("[v0] Modo desenvolvimento detectado")
  }
} catch (error) {
  console.error("[v0] Erro ao inicializar Firebase:", error)
  throw error
}

export { db }
export default app
