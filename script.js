const API = "https://w8dac3s836.execute-api.ap-south-1.amazonaws.com";

// -------- FORMAT FILE NAME --------
function formatFileName(name) {
  if (!name) return 'Document';

  let ext = '';
  const extIndex = name.lastIndexOf('.');
  if (extIndex > -1) {
    ext = name.substring(extIndex);
    name = name.substring(0, extIndex);
  }

  // Clean Formats: "Semester 4" -> "Sem4"
  name = name.replace(/Semester\s*/gi, 'Sem');
  name = name.replace(/SemSem/gi, 'Sem');

  // Remove UUIDs
  name = name.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '');

  // Remove MongoDB ObjectIds (24 hex chars)
  name = name.replace(/[0-9a-f]{24}/gi, '');

  // Remove trailing/leading timestamps (10 to 14 digits)
  name = name.replace(/(^[-_]?\d{10,14}[-_]?|[-_]?\d{10,14}$)/g, '');

  // Remove trailing/leading alphanumeric random strings (20+ chars)
  name = name.replace(/(^[-_]?[a-zA-Z0-9]{20,}[-_]?|[-_]?[a-zA-Z0-9]{20,}$)/g, '');

  // Clean trailing/leading/multiple dashes and underscores
  name = name.replace(/[-_]{2,}/g, '_').replace(/^[-_]+|[-_]+$/g, '');

  // If we accidentally removed everything, give a fallback
  if (!name.trim()) name = 'Document';

  return name + ext;
}

// -------- TOAST COMPONENT --------
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container") || createToastContainer();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  if (type === "waiting") icon = "⏳";

  toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400); // Wait for transition
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toast-container";
  container.className = "toast-container";
  document.body.appendChild(container);
  return container;
}

// -------- ROLE SYSTEM --------
function getCurrentUserRole() {
  const email = localStorage.getItem("user_email");
  if (email === "3107aloksingh@gmail.com") {
    return "admin";
  }
  return "user";
}

// 🔑 Navigation toggle
function showSection(sectionId) {
  document.getElementById('homeSection').style.display = 'none';
  document.getElementById('uploadSection').style.display = 'none';
  document.getElementById('notesSection').style.display = 'none';
  document.getElementById('adminSection').style.display = 'none';

  document.getElementById(sectionId).style.display = 'block';

  document.getElementById('btnHome').className = sectionId === 'homeSection' ? 'btn-primary' : 'btn-outline';
  document.getElementById('btnNotes').className = sectionId === 'notesSection' ? 'btn-primary' : 'btn-outline';
  document.getElementById('btnUpload').className = sectionId === 'uploadSection' ? 'btn-primary' : 'btn-outline';

  const user = localStorage.getItem("user_email");
  const ADMIN_EMAIL = "3107aloksingh@gmail.com";

  if (user === ADMIN_EMAIL) {
    document.getElementById('btnAdmin').className = sectionId === 'adminSection' ? 'btn-primary' : 'btn-outline';
  }
}

// 🔑 Check Role for Admin Panel
function checkRole() {
  const user = localStorage.getItem("user_email");
  const btnAdmin = document.getElementById("btnAdmin");

  const ADMIN_EMAIL = "3107aloksingh@gmail.com"; // 👈 apna email

  if (user === ADMIN_EMAIL) {
    btnAdmin.style.display = "inline-flex";
    document.getElementById("homeSection").querySelector("h2").innerText = "Welcome Admin! 🛡️";
    loadPending();
  } else {
    btnAdmin.style.display = "none";
  }

  showSection('homeSection');
}

// 🔐 LOGIN (dummy session)
function login() {
  const email = document.getElementById("email").value;

  if (!email) {
    showToast("Enter email", "error");
    return;
  }

  localStorage.setItem("user_email", email);

  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("appDiv").style.display = "block";

  loadNotes();
  checkRole();
}

// 🔓 LOGOUT
function logout() {
  localStorage.clear();
  location.reload();
}

// 🔁 AUTO LOGIN
if (localStorage.getItem("user_email")) {
  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("appDiv").style.display = "block";

  loadNotes();
  checkRole();
}

// -------- Upload --------
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("file");
  if (!fileInput.files.length) {
    showToast("Please select a file to upload.", "error");
    return;
  }
  const file = fileInput.files[0];
  const reader = new FileReader();

  // Reference input fields correctly
  const subCode = document.getElementById("subject_code").value;
  const subName = document.getElementById("subject_name").value;
  const sem = document.getElementById("semester").value;
  const unitNum = document.getElementById("unit_no").value;
  const unitName = document.getElementById("unit_name").value;

  if (!subCode || !subCode.trim() || !subName || !subName.trim()) {
    showToast("Please provide both a subject code and a subject name.", "error");
    return;
  }

  if (!unitNum || !unitName || !unitName.trim()) {
    showToast("Please select a unit number and enter a unit name.", "error");
    return;
  }

  const role = getCurrentUserRole();
  console.log("Role:", role);

  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];

    await fetch(API + "/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: base64,
        file_name: file.name,
        file_type: "application/pdf",
        subject_code: subCode,
        subject_name: subName,
        semester: sem,
        unit_no: unitNum,
        unit_name: unitName,
        uploaded_by: role
      })
    });

    if (role === "admin") {
      showToast("Uploaded & Approved ✅", "success");
    } else {
      showToast("Waiting for approval ⏳", "waiting");
    }

    document.getElementById("uploadForm").reset();

    // Reset flow UI
    document.getElementById("up_subject").style.display = "none";
    document.getElementById("up_subject_manual").style.display = "none";
    document.getElementById("up_unit").style.display = "none";
    const upUnitNameDiv = document.getElementById("up_unit_name_div");
    if (upUnitNameDiv) upUnitNameDiv.style.display = "none";
    document.getElementById("up_file_div").style.display = "none";

    loadNotes();
  };

  reader.readAsDataURL(file);
});

// -------- UPLOAD STEP FLOW --------
function up_onSemesterChange() {
  const sem = document.getElementById("up_semester").value;
  document.getElementById("semester").value = sem;

  // Populate subjects based on existing data
  const filtered = allNotesData.filter(n => {
    return String(n.semester).trim() === String(sem).trim();
  });

  const grouped = {};
  filtered.forEach(n => {
    const key = n.subject_code + " - " + n.subject_name;
    grouped[key] = { code: n.subject_code, name: n.subject_name };
  });

  const upSubject = document.getElementById("up_subject");
  upSubject.innerHTML = '<option value="" disabled selected>2. Select Subject</option>';

  Object.keys(grouped).forEach(k => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k;
    upSubject.appendChild(opt);
  });

  const optManual = document.createElement("option");
  optManual.value = "OTHER";
  optManual.textContent = "➕ Add New Subject...";
  upSubject.appendChild(optManual);

  upSubject.style.display = "block";
  document.getElementById("up_subject_manual").style.display = "none";
  document.getElementById("up_unit").style.display = "none";
  const upUnitNameDiv = document.getElementById("up_unit_name_div");
  if (upUnitNameDiv) upUnitNameDiv.style.display = "none";
  document.getElementById("up_file_div").style.display = "none";

  upSubject.value = "";
  document.getElementById("up_unit").value = "";
  const unitNameDisp = document.getElementById("up_unit_name_display");
  if (unitNameDisp) unitNameDisp.value = "";
}

function up_onSubjectChange() {
  const val = document.getElementById("up_subject").value;

  if (val === "OTHER") {
    document.getElementById("up_subject_manual").style.display = "flex";
    document.getElementById("subject_code").value = document.getElementById("manual_subject_code").value;
    document.getElementById("subject_name").value = document.getElementById("manual_subject_name").value;
  } else {
    document.getElementById("up_subject_manual").style.display = "none";
    const parts = val.split(" - ");
    document.getElementById("subject_code").value = parts[0] ? parts[0].trim() : "";
    document.getElementById("subject_name").value = parts.slice(1).join(" - ").trim();
  }

  document.getElementById("up_unit").style.display = "block";
  const upUnitNameDiv = document.getElementById("up_unit_name_div");
  if (upUnitNameDiv) upUnitNameDiv.style.display = "none";
  document.getElementById("up_file_div").style.display = "none";
  document.getElementById("up_unit").value = "";
  const unitNameDisp = document.getElementById("up_unit_name_display");
  if (unitNameDisp) unitNameDisp.value = "";
}

function up_updateManualSubject() {
  document.getElementById("subject_code").value = document.getElementById("manual_subject_code").value;
  document.getElementById("subject_name").value = document.getElementById("manual_subject_name").value;
}

function up_onUnitChange() {
  const unitNum = document.getElementById("up_unit").value;
  document.getElementById("unit_no").value = unitNum;

  const unitNameDiv = document.getElementById("up_unit_name_div");
  const unitNameDisplay = document.getElementById("up_unit_name_display");
  const unitLockedLabel = document.getElementById("unit_locked_label");

  unitNameDiv.style.display = "flex";

  const subCode = document.getElementById("subject_code").value;

  // Find if this unit already has approved notes
  const existingNote = allNotesData.find(n =>
    n.subject_code === subCode &&
    String(n.unit_no) === String(unitNum) &&
    (n.status === 'approved' || n.status === undefined)
  );

  if (existingNote && existingNote.unit_name) {
    // Lock the input
    unitNameDisplay.value = existingNote.unit_name;
    document.getElementById("unit_name").value = existingNote.unit_name;

    unitNameDisplay.readOnly = true;
    unitNameDisplay.style.opacity = "0.7";
    unitNameDisplay.style.cursor = "not-allowed";
    unitLockedLabel.style.display = "inline-block";
  } else {
    // Unlock for user entry
    unitNameDisplay.value = "";
    document.getElementById("unit_name").value = "";

    unitNameDisplay.readOnly = false;
    unitNameDisplay.style.opacity = "1";
    unitNameDisplay.style.cursor = "text";
    unitLockedLabel.style.display = "none";
  }

  document.getElementById("up_file_div").style.display = "flex";
}

function up_onUnitNameChange() {
  document.getElementById("unit_name").value = document.getElementById("up_unit_name_display").value;
}

// -------- SUBJECT GROUP UI --------
let allNotesData = [];

async function loadNotes() {
  try {
    const res = await fetch(API + "/notes");
    allNotesData = await res.json();
    renderSubjects();
  } catch (e) {
    document.getElementById("notesList").innerHTML = `<div class="empty-state">Failed to load notes.</div>`;
  }
}

function renderSubjects() {
  const selectedSemester = document.getElementById("semesterSelect").value;
  const div = document.getElementById("notesList");
  div.innerHTML = "";

  const user = localStorage.getItem("user_email");
  const isAdmin = user === "3107aloksingh@gmail.com";

  if (!selectedSemester) {
    div.innerHTML = `<div class="empty-state">Please select a semester to view course materials.</div>`;
    return;
  }

  // Filter notes by semester
  const filteredNotes = allNotesData.filter(n => {
    return String(n.semester).trim() === String(selectedSemester).trim();
  });

  if (filteredNotes.length === 0) {
    div.innerHTML = `<div class="empty-state">No notes available for ${selectedSemester}.</div>`;
    return;
  }

  // Group by Subject
  const groupedBySubject = {};
  filteredNotes.forEach(n => {
    const subKey = n.subject_code + " - " + n.subject_name;
    if (!groupedBySubject[subKey]) groupedBySubject[subKey] = [];
    groupedBySubject[subKey].push(n);
  });

  const subjectKeys = Object.keys(groupedBySubject);

  let htmlString = "";
  for (let subject of subjectKeys) {
    htmlString += `
      <details class="subject-box">
        <summary class="subject-title">${subject}</summary>
        <div class="subject-content">
    `;

    // 5 Units dropdown
    for (let u = 1; u <= 5; u++) {
      const unitDocs = groupedBySubject[subject].filter(n => parseInt(n.unit_no) === u);
      const unitName = (unitDocs.length > 0 && unitDocs[0].unit_name) ? unitDocs[0].unit_name : `Unit ${u}`;

      const badgeHtml = unitDocs.length > 0
        ? `<span class="unit-badge">${unitDocs.length} PDF${unitDocs.length > 1 ? 's' : ''}</span>`
        : `<span class="unit-empty">(No PDFs)</span>`;

      htmlString += `
        <details class="unit-box">
          <summary class="unit-title">
            <span>Unit ${u} - ${unitName}</span>
            <div style="display: flex; align-items: center;">
              ${badgeHtml}
            </div>
          </summary>
          <div class="unit-content">
      `;

      if (unitDocs.length === 0) {
        htmlString += `<div class="empty-state" style="padding: 1rem; font-size: 0.85rem; margin: 0;">No PDFs uploaded for this unit.</div>`;
      } else {
        unitDocs.forEach(n => {
          const cleanName = formatFileName(n.file_name);
          htmlString += `
            <div class="card file-card">
              <div class="card-info" style="overflow: hidden; display: flex; align-items: center; gap: 0.75rem;">
                <div class="file-icon">📄</div>
                <div style="min-width: 0; flex: 1;">
                   <div class="card-title text-truncate" title="${cleanName}">${cleanName}</div>
                   <div class="card-subtitle"><span class="badge-pdf">PDF</span> ${n.subject_code} • Unit ${n.unit_no}</div>
                </div>
              </div>
              <div class="file-actions">
                <a href="${n.file_url}" target="_blank" class="btn-open btn-rounded">Open</a>
                ${isAdmin ? `<button onclick="deleteNote('${n.id}')" class="btn-danger btn-icon btn-reject" title="Delete">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>` : ''}
              </div>
            </div>
          `;
        });
      }

      htmlString += `
          </div>
        </details>
      `;
    }

    htmlString += `</div></details>`;
  }
  div.innerHTML = htmlString;

  // Trigger reveal animation for newly added elements
  if (window.observeElements) setTimeout(window.observeElements, 50);
}

// -------- PENDING --------
async function loadPending() {
  try {
    const res = await fetch(API + "/pending");
    const data = await res.json();

    const div = document.getElementById("pendingList");
    div.innerHTML = "";

    if (!data || data.length === 0) {
      div.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">No pending notes for approval.</div>`;
      return;
    }

    let htmlString = "";
    data.forEach(n => {
      const cleanName = formatFileName(n.file_name);
      htmlString += `
        <div class="pending-card">
          <div class="card-info" style="margin-bottom: 0.75rem;">
            <div class="card-title text-truncate" title="${cleanName}" style="font-size: 1.05rem; margin-bottom: 0.5rem;">📄 ${cleanName}</div>
            <div class="card-subtitle" style="color:var(--text-muted);">
              <span class="badge-pdf">PDF</span> ${n.subject_code} - ${n.subject_name} <br>
              <span style="font-size: 0.8rem; opacity: 0.8;">Unit ${n.unit_no} • ${n.unit_name}</span>
            </div>
          </div>

          <div class="pending-actions">
            <a href="${n.file_url}" target="_blank" class="btn-outline btn-rounded" style="text-decoration:none;">👁 Preview</a>
            <button class="btn-success btn-rounded" onclick="approve('${n.id}', this)">✅ Approve</button>
            <button class="btn-danger btn-rounded btn-reject" onclick="reject('${n.id}', this)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; margin-bottom: -2px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Reject
            </button>
          </div>
        </div>
      `;
    });
    div.innerHTML = htmlString;
  } catch (e) {
    document.getElementById("pendingList").innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">Failed to load pending notes.</div>`;
  }

  // Trigger reveal animation for newly added elements
  if (window.observeElements) setTimeout(window.observeElements, 50);
}

// -------- APPROVE --------
async function approve(id, btnElement) {
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = "⏳ Approving...";
  }

  try {
    const res = await fetch(API + "/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("API Error");

    showToast("Approved Successfully", "success");

    if (btnElement) {
      const card = btnElement.closest('.pending-card');
      if (card) {
        card.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => {
          card.remove();
          checkEmptyPending();
        }, 300);
      } else {
        loadPending();
      }
    } else {
      loadPending();
    }
    loadNotes(); // Update notes listing in background
  } catch (e) {
    showToast("Error approving note.", "error");
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = "✅ Approve";
    }
  }
}

// -------- REJECT --------
async function reject(id, btnElement) {
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = "⏳ Rejecting...";
  }

  try {
    const res = await fetch(API + "/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("API Error");

    showToast("Rejected Successfully", "error");

    if (btnElement) {
      const card = btnElement.closest('.pending-card');
      if (card) {
        card.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        setTimeout(() => {
          card.remove();
          checkEmptyPending();
        }, 300);
      } else {
        loadPending();
      }
    } else {
      loadPending();
    }
    loadNotes(); // Dynamically update main list to avoid stale data
  } catch (e) {
    showToast("Error rejecting note.", "error");
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = "🗑️ Reject";
    }
  }
}

// -------- Helper to show empty state if all removed --------
function checkEmptyPending() {
  const div = document.getElementById("pendingList");
  if (div && div.querySelectorAll('.pending-card').length === 0) {
    div.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; animation: fadeInScale 0.4s ease-out forwards;">No pending notes for approval.</div>`;
  }
}

// -------- DELETE --------
async function deleteNote(id) {
  try {
    await fetch(API + "/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    showToast("Note Deleted", "error");
    loadNotes();
    const user = localStorage.getItem("user_email");
    if (user === "3107aloksingh@gmail.com") {
      loadPending();
    }
  } catch (e) {
    showToast("Error deleting note.", "error");
  }
}

// -------- SCROLL REVEAL ANIMATION --------
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -20px 0px"
};

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("reveal-visible");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

window.observeElements = () => {
  document.querySelectorAll('.card, .subject-box, .pending-card, .panel').forEach(el => {
    if (!el.classList.contains("reveal-visible") && !el.classList.contains("reveal-hidden")) {
      el.classList.add("reveal-hidden");
      revealObserver.observe(el);
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(window.observeElements, 100);
});

// Patch showSection to re-observe when switching tabs
const originalShowSection = window.showSection;
window.showSection = function (sectionId) {
  if (originalShowSection) originalShowSection(sectionId);
  setTimeout(window.observeElements, 50);
};