const SUPABASE_URL = "https://wvcqvsmjlrtaoytedvts.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Y3F2c21qbHJ0YW95dGVkdnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjU2NDksImV4cCI6MjA3MTM0MTY0OX0.gz4N_eOpGSex2GYXSF8rvWJ6kzCjnM7jEJ4nYan4_A8";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginFormSection = document.getElementById('login-form');
const skinFormSection = document.getElementById('skin-form');
const logoutBtn = document.getElementById('logout-btn');
const accountCounter = document.getElementById('account-counter');
const skinDescInput = document.getElementById('skin-desc');
const purchaseHistory = document.getElementById('purchase-history');
const merchRulesBtn = document.getElementById('merch-rules-btn');
const merchRulesText = document.getElementById('merch-rules-text');
const skinNameInput = document.getElementById('skin-name');

let currentUsername = null;

async function updateUI() {
    if (!currentUsername) return;
    
    const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('balance')
        .eq('username', currentUsername)
        .single();

    if (userError) {
        console.error(userError);
        accountCounter.textContent = 'Errore';
    } else {
        accountCounter.textContent = userData.balance;
    }

    const { data: requestsData, error: requestsError } = await supabaseClient
        .from('skin_requests')
        .select('*')
        .eq('username', currentUsername);
    
    if (requestsError) {
        console.error(requestsError);
        return;
    }

    const gallery = document.getElementById('skins-gallery');
    gallery.innerHTML = '';
    requestsData.forEach(req => {
        const reqDiv = document.createElement('div');
        reqDiv.className = 'skin-status';
        let htmlContent = `
            <p>ID Richiesta: ${req.request_id}</p>
            <p>Testo: ${req.request_text}</p>
            <p>Stato: ${req.status}</p>
        `;

        if (req.price) {
          htmlContent += `<p>Prezzo: ${req.price} Coral</p>`;
        }
        
        if (req.status === 'Acquistato' && req.download_link) {
            htmlContent += `<p>Download: <a href="${req.download_link}" target="_blank">Clicca qui</a></p>`;
        }

        reqDiv.innerHTML = htmlContent;
        
        // Mostra il pulsante "Acquista" solo se il prezzo è impostato e la skin non è già stata acquistata
        if (req.price && req.status !== 'Acquistato') {
          const buyButton = document.createElement('button');
          buyButton.textContent = 'Acquista';
          buyButton.className = 'btn';
          buyButton.onclick = () => purchaseSkin(req.request_id, req.price);
          reqDiv.appendChild(buyButton);
        }
        gallery.appendChild(reqDiv);
    });
}

async function purchaseSkin(requestId, price) {
  if (!currentUsername) {
      alert("Devi essere loggato per acquistare.");
      return;
  }
  
  const confirmPurchase = confirm(`Sei sicuro di voler acquistare questa skin per ${price} Coral?`);
  if (!confirmPurchase) {
      return;
  }

  // 1. Leggi il saldo attuale dell'utente
  const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('balance')
      .eq('username', currentUsername)
      .single();
  
  if (userError || !userData) {
      alert('Errore nel leggere il tuo saldo. Riprova più tardi.');
      return;
  }

  if (userData.balance < price) {
      alert("Saldo insufficiente per l'acquisto.");
      return;
  }

  const newBalance = userData.balance - price;

  // 2. Aggiorna il saldo e lo stato della richiesta
  const { error: balanceUpdateError } = await supabaseClient
      .from('users')
      .update({ balance: newBalance })
      .eq('username', currentUsername);

  if (balanceUpdateError) {
      alert("Errore nell'aggiornare il tuo saldo.");
      console.error("Errore UPDATE users:", balanceUpdateError);
      return;
  }

  const { error: requestUpdateError } = await supabaseClient
      .from('skin_requests')
      .update({ status: 'Acquistato' })
      .eq('request_id', requestId);

  if (requestUpdateError) {
      alert("Errore nell'aggiornare lo stato della richiesta.");
      console.error("Errore UPDATE skin_requests:", requestUpdateError);
      return;
  }
  
  alert("Acquisto completato con successo!");
  updateUI(); // Aggiorna la UI per mostrare il nuovo saldo e lo stato della skin
}

async function handleAuth(isRegister, data) {
    const { username, password } = data;
    let result = {};
    if (isRegister) {
        const { data: existingUser } = await supabaseClient
            .from('users')
            .select('username')
            .eq('username', username);
        if (existingUser.length > 0) {
            alert("Nome utente già esistente.");
            return;
        }
        const { data: newUser, error } = await supabaseClient
            .from('users')
            .insert([{ username: username, password: password, balance: 0 }]);
        if (error) {
            result.message = 'Errore di registrazione: ' + error.message;
        } else {
            result.message = "Registrazione avvenuta con successo!";
            handleSuccess(username);
        }
    } else {
        const { data: user, error } = await supabaseClient
            .from('users')
            .select('password')
            .eq('username', username)
            .single();
        
        if (error) {
          console.error("Errore di query Supabase:", error);
          result.message = "Errore di connessione. Riprova più tardi.";
        } else if (user && user.password === password) {
            result.message = "Accesso riuscito!";
            handleSuccess(username);
        } else {
            result.message = "Credenziali non valide.";
        }
    }
    alert(result.message);
}

function handleSuccess(username) {
    currentUsername = username;
    localStorage.setItem('user_session', username);
    loginFormSection.classList.add('hidden');
    skinFormSection.classList.remove('hidden');
    purchaseHistory.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    merchRulesBtn.classList.remove('hidden');
    skinNameInput.value = currentUsername;
    updateUI();
}

document.getElementById('login').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    handleAuth(false, { username, password });
});

document.getElementById('register-btn').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    handleAuth(true, { username, password });
});

document.getElementById('skin-submission').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('skin-name').value;
    const request_text = skinDescInput.value;
    
    const { data, error } = await supabaseClient
        .from('skin_requests')
        .insert([{ username: username, request_text: request_text }]);
    
    if (error) {
        alert('Errore nell\'invio della richiesta: ' + error.message);
    } else {
        alert("Richiesta inviata con successo!");
        skinDescInput.value = '';
        updateUI();
    }
});

document.getElementById('logout-btn').addEventListener('click', function() {
    localStorage.removeItem('user_session');
    currentUsername = null;
    loginFormSection.classList.remove('hidden');
    skinFormSection.classList.add('hidden');
    purchaseHistory.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    merchRulesBtn.classList.add('hidden');
    merchRulesText.classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    accountCounter.textContent = '0';
    alert("Logout effettuato.");
});

// Funzione per controllare la sessione all'avvio
document.addEventListener('DOMContentLoaded', () => {
    const savedUsername = localStorage.getItem('user_session');
    if (savedUsername) {
        handleSuccess(savedUsername);
    }
});

// Gestione del nuovo tasto "Regolamento Merch"
merchRulesBtn.addEventListener('click', () => {
    merchRulesText.classList.toggle('hidden');
});
