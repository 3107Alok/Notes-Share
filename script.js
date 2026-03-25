const API = "https://w8dac3s836.execute-api.ap-south-1.amazonaws.com";

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
  if(!fileInput.files.length) {
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
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        file: base64,
        file_name: file.name,
        file_type: file.name.split('.').pop(),
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
    if(upUnitNameDiv) upUnitNameDiv.style.display = "none";
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
    const s1 = n.semester ? n.semester.toString().toLowerCase().trim() : "";
    const s2 = sem.toLowerCase().trim();
    return s1 === s2 || s2.includes(s1) || s1.includes(s2.replace("semester", "").trim());
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
  if(upUnitNameDiv) upUnitNameDiv.style.display = "none";
  document.getElementById("up_file_div").style.display = "none";
  
  upSubject.value = "";
  document.getElementById("up_unit").value = "";
  const unitNameDisp = document.getElementById("up_unit_name_display");
  if(unitNameDisp) unitNameDisp.value = "";
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
  if(upUnitNameDiv) upUnitNameDiv.style.display = "none";
  document.getElementById("up_file_div").style.display = "none";
  document.getElementById("up_unit").value = "";
  const unitNameDisp = document.getElementById("up_unit_name_display");
  if(unitNameDisp) unitNameDisp.value = "";
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
  } catch(e) {
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
    const sem = n.semester ? n.semester.toString().toLowerCase().trim() : "";
    const sel = selectedSemester.toLowerCase().trim();
    return sem === sel || sel.includes(sem) || sem.includes(sel.replace("semester", "").trim());
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
          htmlString += `
            <div class="card" style="margin: 0; padding: 0.75rem 1rem;">
              <div class="card-info">
                <div class="card-title" style="margin-bottom: 0;">${n.file_name || 'Document'}</div>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <a href="${n.file_url}" target="_blank" class="btn-open">📄 Open</a>
                ${isAdmin ? `<button onclick="deleteNote('${n.id}')" class="btn-danger" style="padding: 0.5rem 1rem; font-size: 0.85rem;">🗑 Delete</button>` : ''}
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
      htmlString += `
        <div class="pending-card">
          <div class="card-info">
            <div class="card-title">${n.subject_code} - ${n.subject_name}</div>
            <div class="card-subtitle" style="margin-top:0.25rem; color:var(--text-muted);">Unit ${n.unit_no} • ${n.unit_name}</div>
          </div>

          <div class="pending-actions">
            <a href="${n.file_url}" target="_blank" class="btn-outline" style="text-decoration:none;">👁 Preview</a>
            <button class="btn-success" onclick="approve('${n.id}')">Approve</button>
            <button class="btn-danger" onclick="reject('${n.id}')">Reject</button>
          </div>
        </div>
      `;
    });
    div.innerHTML = htmlString;
  } catch(e) {
    document.getElementById("pendingList").innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">Failed to load pending notes.</div>`;
  }
}

// -------- APPROVE --------
async function approve(id) {
  try {
    await fetch(API + "/approve", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ id })
    });

    loadPending();
    loadNotes();
  } catch(e) {
    showToast("Error approving logic.", "error");
  }
}

// -------- REJECT --------
async function reject(id) {
  try {
    await fetch(API + "/reject", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ id })
    });

    loadPending();
  } catch(e) {
    showToast("Error rejecting note.", "error");
  }
}

// -------- DELETE --------
async function deleteNote(id) {
  if (!confirm("Are you sure you want to delete this note?")) {
    return;
  }

  try {
    await fetch(API + "/delete", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ id })
    });

    loadNotes();
    const user = localStorage.getItem("user_email");
    if (user === "3107aloksingh@gmail.com") {
      loadPending();
    }
  } catch(e) {
    showToast("Error deleting note.", "error");
  }
}