// --- DATA MANAGEMENT ---
let users = [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// Load users from users.json
async function loadUsers() {
  try {
    const response = await fetch("users.json");
    if (!response.ok) {
      throw new Error("Gagal memuat data pengguna");
    }
    users = await response.json();
  } catch (error) {
    console.error("Error loading users:", error);
    showToast("Gagal memuat data pengguna", "error");
  }
}

// Save users to users.json (ini hanya contoh, di production perlu backend)
async function saveUsers() {
  try {
    // Note: Di environment nyata, ini harus dikirim ke server
    console.log("Simpan perubahan ke server:", users);
    // Simpan ke localstorage
    localStorage.setItem("users_backup", JSON.stringify(users));
  } catch (error) {
    console.error("Error saving users:", error);
    showToast("Gagal menyimpan data pengguna", "error");
  }
}

/// Data aplikasi
let bukuList = JSON.parse(localStorage.getItem("bukuList")) || [];
let pinjamList = JSON.parse(localStorage.getItem("pinjamList")) || [];

// --- FUNGSI: INISIALISASI DATA BUKU ---
async function initializeBooks() {
  // Cek apakah localStorage buku sudah ada atau tidak
  if (bukuList.length === 0) {
    try {
      showToast("Memuat data buku awal...", "info");
      // Fetch data dari file JSON
      const response = await fetch("books.json");
      if (!response.ok) {
        throw new Error("Gagal memuat file books.json");
      }
      const books = await response.json();

      // Simpan data ke localStorage
      localStorage.setItem("bukuList", JSON.stringify(books));

      // Update variabel bukuList di memori
      bukuList = books;

      showToast("Data buku awal berhasil dimuat!", "success");
    } catch (error) {
      console.error("Error initializing books:", error);
      showToast(
        "Gagal memuat data buku awal. Aplikasi akan dimulai tanpa data.",
        "error"
      );
    }
  }
}
// --- AUTHENTICATION FUNCTIONS ---
function checkAuthStatus() {
  if (currentUser) {
    showApp();
  } else {
    showLandingPage();
  }
}

function showLandingPage() {
  document.getElementById("auth-container").style.display = "flex";
  document.getElementById("app-container").style.display = "none";
  document
    .querySelectorAll(".auth-page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("landing-page").classList.add("active");
}

function showLoginPage() {
  document
    .querySelectorAll(".auth-page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("login-page").classList.add("active");
}

function showRegisterPage() {
  document
    .querySelectorAll(".auth-page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("register-page").classList.add("active");
}

function showApp() {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("app-container").style.display = "block";
  document.getElementById("current-user-display").textContent =
    currentUser.username;

  buildNavigation(currentUser.role);

  // Determine the first page to show based on role
  const firstPage = currentUser.role === "admin" ? "buku" : "katalog";
  showPage(firstPage);
}

function buildNavigation(role) {
  const nav = document.getElementById("main-nav");
  nav.innerHTML = ""; // Clear existing nav

  const navItems = [
    {
      page: "katalog",
      label: "Katalog Buku",
      icon: "fa-books",
      roles: ["user", "admin"],
    },
    {
      page: "pinjam",
      label: "Peminjaman",
      icon: "fa-hand-holding",
      roles: ["user", "admin"],
    },
    {
      page: "buku",
      label: "Manajemen Buku",
      icon: "fa-cogs",
      roles: ["admin"],
    },
    {
      page: "laporan",
      label: "Laporan",
      icon: "fa-clipboard-list",
      roles: ["admin"],
    },
  ];

  navItems.forEach((item) => {
    if (item.roles.includes(role)) {
      const button = document.createElement("button");
      button.className = "nav-btn";
      button.setAttribute("data-page", item.page);
      button.innerHTML = `<i class="fas ${item.icon}"></i> ${item.label}`;
      button.onclick = () => showPage(item.page);
      nav.appendChild(button);
    }
  });
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  // Pastikan users sudah diload
  await loadUsers();

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    showToast(`Selamat datang, ${user.username}!`, "success");
    showApp();
  } else {
    showToast("Username atau password salah!", "error");
  }
  document.getElementById("login-form").reset();
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  const role = document.getElementById("register-role").value;

  // Pastikan users sudah diload
  await loadUsers();

  if (users.find((u) => u.username === username)) {
    showToast("Username sudah terdaftar!", "error");
    return;
  }

  const newUser = { username, password, role };
  users.push(newUser);

  // Simpan perubahan
  await saveUsers();

  currentUser = newUser;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  showToast(`Akun berhasil dibuat! Selamat datang, ${username}!`, "success");
  showApp();
}

function handleLogout() {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    currentUser = null;
    localStorage.removeItem("currentUser");
    showToast("Anda telah keluar dari sistem.", "info");
    showLandingPage();
  }
}

// --- APP FUNCTIONS ---
function showPage(pageId) {
  // Update navigation buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const activeBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  // Update pages with animation
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
  });

  setTimeout(() => {
    document.getElementById(pageId).classList.add("active");

    // Load appropriate data based on page
    if (pageId === "pinjam") loadBukuPilihan();
    if (pageId === "laporan") loadLaporan();
    if (pageId === "buku") loadBuku();
    if (pageId === "katalog") loadKatalog();
  }, 100);
}

// --- KATALOG BUKU (USER) ---
function loadKatalog() {
  const grid = document.getElementById("katalog-grid");
  grid.innerHTML = "";

  bukuList.forEach((buku, index) => {
    const bookCard = document.createElement("div");
    bookCard.className = "book-card";
    bookCard.innerHTML = `
      <div class="book-cover-container">
        <img src="${
          buku.gambar || "https://via.placeholder.com/200x300?text=No+Cover"
        }" 
             alt="${buku.judul}" 
             class="book-cover"
             onerror="this.src='https://via.placeholder.com/200x300?text=Gagal+Muat+Gambar'">
      </div>
      <div class="book-info">
        <h3>${buku.judul}</h3>
        <p class="book-author">Oleh: ${buku.penulis}</p>
        <button class="btn-primary" onclick="pinjamDariKatalog('${
          buku.judul
        }')">
          <i class="fas fa-hand-holding"></i> Pinjam
        </button>
      </div>
    `;
    grid.appendChild(bookCard);
  });
}

function pinjamDariKatalog(judulBuku) {
  showPage("pinjam");
  // Pre-fill the select box
  setTimeout(() => {
    document.getElementById("bukuPilihan").value = judulBuku;
  }, 150); // small delay to ensure the page is loaded
}

// --- MANAJEMEN BUKU (ADMIN) ---
document.getElementById("formBuku").addEventListener("submit", function (e) {
  e.preventDefault();
  const judul = document.getElementById("judul").value;
  const penulis = document.getElementById("penulis").value;
  const editIndex = document.getElementById("editIndex").value;

  if (editIndex) {
    bukuList[editIndex] = { judul, penulis };
    document.getElementById("editIndex").value = "";
    showToast("Buku berhasil diperbarui!", "success");
  } else {
    bukuList.push({ judul, penulis });
    showToast("Buku berhasil ditambahkan!", "success");
  }

  localStorage.setItem("bukuList", JSON.stringify(bukuList));
  this.reset();
  loadBuku();
});

function loadBuku() {
  const tableBody = document.querySelector("#daftarBuku tbody");
  tableBody.innerHTML = "";

  if (bukuList.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.textContent = "Belum ada buku yang tersedia.";
    cell.style.textAlign = "center";
    cell.style.fontStyle = "italic";
    return;
  }

  bukuList.forEach((b, i) => {
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = i + 1;
    row.insertCell(1).textContent = b.judul;
    row.insertCell(2).textContent = b.penulis;
    row.insertCell(3).innerHTML = `
      <div class="action-buttons">
        <button class="btn-edit" onclick="editBuku(${i})"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-delete" onclick="hapusBuku(${i})"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    `;
  });
}

function editBuku(i) {
  document.getElementById("judul").value = bukuList[i].judul;
  document.getElementById("penulis").value = bukuList[i].penulis;
  document.getElementById("editIndex").value = i;
  document.getElementById("formBuku").scrollIntoView({ behavior: "smooth" });
}

function hapusBuku(i) {
  if (confirm(`Hapus buku "${bukuList[i].judul}"?`)) {
    bukuList.splice(i, 1);
    localStorage.setItem("bukuList", JSON.stringify(bukuList));
    loadBuku();
    showToast("Buku berhasil dihapus!", "error");
  }
  [
    {
      judul: "Laskar Pelangi",
      penulis: "Andrea Hirata",
    },
    {
      judul: "Sapiens: Riwayat Singkat Umat Manusia",
      penulis: "Yuval Noah Harari",
    },
    {
      judul: "Atomic Habits",
      penulis: "James Clear",
    },
    {
      judul: "Filosofi Teras",
      penulis: "Henry Manampiring",
    },
    {
      judul: "Ikigai",
      penulis: "Héctor García & Francesc Miralles",
    },
    {
      judul: "Clean Code",
      penulis: "Robert C. Martin",
    },
    {
      judul: "The Pragmatic Programmer",
      penulis: "David Thomas & Andrew Hunt",
    },
    {
      judul: "Educated",
      penulis: "Tara Westover",
    },
    {
      judul: "Bumi Manusia",
      penulis: "Pramoedya Ananta Toer",
    },
    {
      judul: "Cantik Itu Luka",
      penulis: "Eka Kurniawan",
    },
    {
      judul: "Negeri 5 Menara",
      penulis: "Ahmad Fuadi",
    },
    {
      judul: "Supernova",
      penulis: "Dee Lestari",
    },
  ];
}

// --- PEMINJAMAN (USER & ADMIN) ---
function loadBukuPilihan() {
  const select = document.getElementById("bukuPilihan");
  select.innerHTML = '<option value="">-- Pilih Buku --</option>';

  if (bukuList.length === 0) {
    select.innerHTML =
      '<option value="" disabled>Tidak ada buku tersedia</option>';
    return;
  }

  bukuList.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.judul;
    opt.textContent = `${b.judul} - ${b.penulis}`;
    select.appendChild(opt);
  });
}

document.getElementById("formPinjam").addEventListener("submit", function (e) {
  e.preventDefault();
  const buku = document.getElementById("bukuPilihan").value;
  const nama = document.getElementById("namaPeminjam").value;
  const tanggal = document.getElementById("tanggal").value;

  pinjamList.push({ buku, nama, tanggal, status: "dipinjam" });

  localStorage.setItem("pinjamList", JSON.stringify(pinjamList));
  showToast(`Buku "${buku}" berhasil dipinjam oleh ${nama}!`, "success");
  this.reset();
});

// --- LAPORAN (ADMIN) ---
function loadLaporan() {
  const tableBody = document.querySelector("#daftarPinjam tbody");
  tableBody.innerHTML = "";

  if (pinjamList.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = "Belum ada data peminjaman.";
    cell.style.textAlign = "center";
    cell.style.fontStyle = "italic";
    return;
  }

  pinjamList.forEach((p, i) => {
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = i + 1;
    row.insertCell(1).textContent = p.buku;
    row.insertCell(2).textContent = p.nama;

    const formattedDate = new Date(p.tanggal).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    row.insertCell(3).textContent = formattedDate;

    const statusCell = row.insertCell(4);
    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge status-${p.status}`;
    statusBadge.textContent =
      p.status === "dipinjam" ? "Dipinjam" : "Dikembalikan";
    statusCell.appendChild(statusBadge);

    const aksiCell = row.insertCell(5);
    if (p.status === "dipinjam") {
      aksiCell.innerHTML = `
        <div class="action-buttons">
          <button class="btn-return" onclick="kembalikanBuku(${i})"><i class="fas fa-undo"></i> Kembalikan</button>
        </div>
      `;
    } else {
      aksiCell.innerHTML = `<span style="color: var(--text-secondary);">-</span>`;
    }
  });
}

function kembalikanBuku(i) {
  if (confirm(`Tandai buku "${pinjamList[i].buku}" sebagai dikembalikan?`)) {
    pinjamList[i].status = "dikembalikan";
    localStorage.setItem("pinjamList", JSON.stringify(pinjamList));
    loadLaporan();
    showToast("Buku berhasil dikembalikan!", "info");
  }
}

// --- Toast notification system ---
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case "info":
      icon = '<i class="fas fa-info-circle"></i>';
      break;
  }

  toast.innerHTML = `${icon} <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideIn 0.4s ease reverse";
    setTimeout(() => toastContainer.removeChild(toast), 400);
  }, 3000);
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async function () {
  // 1. Inisialisasi data pengguna
  await loadUsers();

  // 2. Inisialisasi data buku
  await initializeBooks();

  // 2. Setelah itu, baru cek status autentikasi
  checkAuthStatus();

  // Add event listeners for auth forms
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document
    .getElementById("register-form")
    .addEventListener("submit", handleRegister);
});
