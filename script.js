const toggleBtn = document.getElementById("theme-toggle");
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

function copyIP() {
  const ip = document.getElementById("server-ip").textContent;
  navigator.clipboard.writeText(ip).then(() => {
    alert("IP copiato negli appunti: " + ip);
  });
}
// Gestione del form di invio skin
skinForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const skinDesc = skinForm['skin-desc'].value;
    const user = auth.currentUser; // Ottiene l'utente loggato

    if (user) {
        try {
            // Salva i dati della skin in una nuova "collezione" nel database
            await db.collection('skin-requests').add({
                userId: user.uid,
                username: user.displayName || user.email.split('@')[0],
                description: skinDesc,
                status: 'pending', // Aggiunge uno stato iniziale alla richiesta
                timestamp: firebase.firestore.FieldValue.serverTimestamp() // Data e ora della richiesta
            });

            console.log("Richiesta skin inviata con successo!");
            alert("La tua richiesta è stata inviata!");
            skinForm.reset(); // Svuota il modulo

        } catch (error) {
            console.error("Errore nell'invio della richiesta:", error);
            alert("Errore: " + error.message);
        }
    } else {
        alert("Devi effettuare l'accesso per inviare una richiesta.");
    }
});
