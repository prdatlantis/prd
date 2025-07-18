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
