if (!window.API) {
  window.API = "https://w8dac3s836.execute-api.ap-south-1.amazonaws.com";
}
const CLIENT_ID = "5od2a8lalfgpjgo3271g92lgh6";
const DOMAIN = "https://ap-south-1ohbqo6utl.auth.ap-south-1.amazoncognito.com";
const REDIRECT_URI = "https://3107alok.github.io/Notes-Share/";

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
function parseToken() {
  try {
    const token = localStorage.getItem("idToken");
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired() {
  const payload = parseToken();
  if (!payload) return true;
  return Date.now() > payload.exp * 1000;
}

async function apiFetch(url, options = {}) {
  try {
    const token = localStorage.getItem("idToken");

    if (!token) {
      showToast("Login again 🔐", "error");
      logout();
      return null;
    }

    const res = await fetch(API + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    return res;

  } catch (err) {
    showToast("Network error 🌐", "error");
    return null;
  }
}

function getUserEmail() {
  const payload = parseToken();
  return payload?.email || null;
}

function isAdmin() {
  const payload = parseToken();
  return payload?.["cognito:groups"]?.includes("admin") || false;
}

function getCurrentUserRole() {
  if (isAdmin()) {
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
  
  const pyqSection = document.getElementById('pyq-section');
  if (pyqSection) pyqSection.style.display = 'none';

  document.getElementById(sectionId).style.display = 'block';

  document.getElementById('btnHome').className = sectionId === 'homeSection' ? 'btn-primary' : 'btn-outline';
  document.getElementById('btnNotes').className = sectionId === 'notesSection' ? 'btn-primary' : 'btn-outline';
  
  const btnPyq = document.getElementById('btnPYQ');
  if (btnPyq) btnPyq.className = sectionId === 'pyq-section' ? 'btn-primary' : 'btn-outline';
  
  document.getElementById('btnUpload').className = sectionId === 'uploadSection' ? 'btn-primary' : 'btn-outline';

  if (isAdmin()) {
    document.getElementById('btnAdmin').className = sectionId === 'adminSection' ? 'btn-primary' : 'btn-outline';
  }
}

function showPYQ() {
  showSection('pyq-section');
}

// 🔑 Check Role for Admin Panel
function checkRole() {
  const btnAdmin = document.getElementById("btnAdmin");

  if (isAdmin()) {
    btnAdmin.style.display = "inline-flex";
    document.getElementById("homeSection").querySelector("h2").innerText = "Welcome Admin! 🛡️";
    loadPending();
  } else {
    btnAdmin.style.display = "none";
  }

  showSection('homeSection');
}

// 🔐 LOGIN
function login() {
  window.location.href =
    `${DOMAIN}/login?client_id=${CLIENT_ID}` +
    `&response_type=token` +
    `&scope=openid+email+profile` +   // ✅ FINAL FIX
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

// 🔓 LOGOUT
function logout() {
  localStorage.clear();

  window.location.href = `${DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

function handleAuth() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const idToken = params.get("id_token");
  const accessToken = params.get("access_token");

  console.log("ID:", idToken);
  console.log("ACCESS:", accessToken);

  // 🔥 FORCE FIX (important)
  if (!idToken) return;

  localStorage.setItem("idToken", idToken);

  // agar accessToken missing ho tab bhi fallback
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
  } else {
    console.log("⚠️ accessToken missing from Cognito");
  }

  window.history.replaceState({}, document.title, window.location.pathname);
  location.reload();
}


if (window.location.hash.includes("id_token=") && !localStorage.getItem("idToken")) {
  handleAuth();
}

// 🔁 AUTO LOGIN
if (localStorage.getItem("idToken") && !isTokenExpired()) {
  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("appDiv").style.display = "block";

  if (localStorage.getItem("justLoggedIn")) {
    showToast("Welcome back " + getUserEmail(), "success");
    localStorage.removeItem("justLoggedIn");
  }

  loadNotes();
  checkRole();
} else {
  localStorage.clear();
}

if (!localStorage.getItem("idToken")) {
  document.getElementById("loginDiv").style.display = "block";
}

// -------- Upload --------
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = document.querySelector("#uploadForm button[type='submit']");
  if (submitBtn) submitBtn.disabled = true;

  const fileInput = document.getElementById("file");
  if (!fileInput.files.length) {
    showToast("Please select a file to upload.", "error");
    if (submitBtn) submitBtn.disabled = false;
    return;
  }
  
  const files = Array.from(fileInput.files);

  const subCode = document.getElementById("subject_code").value;
  const subName = document.getElementById("subject_name").value;
  const yearStr = document.getElementById("year").value;
  const unitNum = document.getElementById("unit_no").value;
  
  const uploadedBy = getUserEmail() || "Anonymous";
  const noteTypeVal = "typed";

  if (!subCode || !subCode.trim() || !subName || !subName.trim()) {
    showToast("Please provide both a subject code and a subject name.", "error");
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  if (!unitNum) {
    showToast("Please select unit", "error");
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  openAiModal();
  
  let successCount = 0;
  let failCount = 0;
  let lastError = "";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progressText = document.getElementById("aiProgressText");
    if (progressText) {
       progressText.innerText = `Processing document ${i + 1} of ${files.length}...`;
    }

    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });

    const cleanSubject = subName.replace(/\s+/g, '-');
    const unit = unitNum;

    const existingCount = allNotesData.filter(n =>
      n.subject_code === subCode &&
      String(n.unit_no) === String(unitNum)
    ).length;

    const newFileName = `${cleanSubject}_Unit-${unit}_Notes_${existingCount + 1 + i}.pdf`;

    try {
      const res = await apiFetch("/upload", {
        method: "POST",
        body: JSON.stringify({
          file_data: base64,
          file_name: newFileName,
          subject_code: subCode,
          subject_name: subName,
          year: yearStr,
          unit_no: unitNum,
          uploaded_by: uploadedBy,
          note_type: noteTypeVal
        })
      });

      if (!res || !res.ok) {
        failCount++;
        lastError = "Network Error";
      } else {
        const data = await res.json();
        if (data.score !== undefined && data.score >= 0.5) {
          successCount++;
        } else {
          failCount++;
          lastError = "Low AI Score";
        }
      }
    } catch (err) {
      failCount++;
      lastError = "Network Error";
    }
  }

  if (failCount === 0) {
    showAiResult(true);
  } else if (successCount > 0) {
    // Partial success
    showAiResult(false, `Partially uploaded. ${successCount} successful, ${failCount} failed.`);
  } else {
    showAiResult(false, lastError === "Low AI Score" ? "Your notes do not match the syllabus for this unit.\nPlease upload correct notes with proper course content." : "Network Error\nPlease try again");
  }

  if (submitBtn) submitBtn.disabled = false;
  document.getElementById("uploadForm").reset();

  // Reset flow UI
  document.getElementById("up_subject").style.display = "none";
  document.getElementById("up_subject_manual").style.display = "none";
  document.getElementById("up_unit").style.display = "none";
  const upUnitNameDiv = document.getElementById("up_unit_name_div");
  if (upUnitNameDiv) upUnitNameDiv.style.display = "none";
  document.getElementById("up_file_div").style.display = "none";

  loadNotes();
});

// -------- UPLOAD STEP FLOW --------
async function getSyllabusByYear(year) {
  const res = await apiFetch(`/syllabus?year=${year}`);
  if (!res || !res.ok) return [];
  return await res.json();
}

async function getUnitsBySubject(subject_code) {
  const res = await apiFetch(`/syllabus?subject_code=${subject_code}`);
  if (!res || !res.ok) return [];
  return await res.json();
}
async function up_onYearChange() {
  const year = document.getElementById("up_year").value;
  document.getElementById("year").value = year;

  const data = await getSyllabusByYear(year);

  const subjectSelect = document.getElementById("up_subject");

  subjectSelect.innerHTML = `<option disabled selected>Select Subject</option>`;

  const unique = {};
  data.forEach(item => {
    unique[item.subject_code] = item.subject_name;
  });

  Object.keys(unique).forEach(code => {
    subjectSelect.innerHTML += `
      <option value="${code}">
        ${code} - ${unique[code]}
      </option>
    `;
  });

  // 🔥 ALWAYS ADD MANUAL OPTION
  subjectSelect.innerHTML += `
    <option value="OTHER">➕ Add New Subject</option>
  `;

  subjectSelect.style.display = "block";
  
  // hide cascading layers
  document.getElementById("up_unit").style.display = "none";
  document.getElementById("up_file_div").style.display = "none";
  const scrSyllabus = document.getElementById("syllabusContainer");
  if (scrSyllabus) scrSyllabus.innerHTML = "";
}

async function up_onSubjectChange() {
  const val = document.getElementById("up_subject").value;
  const container = document.getElementById("syllabusContainer");

  if (val === "OTHER") {
    // 👉 SHOW MANUAL INPUT
    document.getElementById("up_subject_manual").style.display = "flex";
    
    // Auto-populate generic units so the upload isn't infinitely blocked
    const unitSelect = document.getElementById("up_unit");
    unitSelect.innerHTML = `<option disabled selected>Select Unit</option>
        <option value="1">Unit 1 - Custom Entry</option>
        <option value="2">Unit 2 - Custom Entry</option>
        <option value="3">Unit 3 - Custom Entry</option>
        <option value="4">Unit 4 - Custom Entry</option>
        <option value="5">Unit 5 - Custom Entry</option>`;
    unitSelect.style.display = "block";
    
    // Clear the hidden API variables until user types
    document.getElementById("subject_code").value = "";
    document.getElementById("subject_name").value = "";
    document.getElementById("up_file_div").style.display = "none";
    if (container) container.innerHTML = "";
    return;
  }

  document.getElementById("up_subject_manual").style.display = "none";

  const selectedText =
    document.getElementById("up_subject").selectedOptions[0].text;

  const subject_code = val;
  const subject_name = selectedText.split(" - ")[1];

  document.getElementById("subject_code").value = subject_code;
  document.getElementById("subject_name").value = subject_name;

  const units = await getUnitsBySubject(subject_code);

  // 🔥 SORT
  units.sort((a, b) => parseInt(a.unit_no) - parseInt(b.unit_no));

  // ---------- 🔥 SYLLABUS TILES ----------
  let html = `<h3 style="margin-bottom:10px;">📘 Syllabus</h3>`;

  units.forEach(u => {
    html += `
      <div class="card" style="margin-bottom:10px;">
        <div style="font-weight:600; margin-bottom:5px;">
          Unit ${u.unit_no} - ${u.unit_name}
        </div>
        <div style="font-size:0.9rem; color:#94a3b8;">
          ${u.syllabus || "No syllabus available"}
        </div>
      </div>
    `;
  });

  if (container) container.innerHTML = html;

  const unitSelect = document.getElementById("up_unit");

  unitSelect.innerHTML = `<option disabled selected>Select Unit</option>`;

  units.forEach(u => {
    unitSelect.innerHTML += `
      <option value="${u.unit_no}">
        Unit ${u.unit_no} - ${u.unit_name}
      </option>
    `;
  });

  unitSelect.style.display = "block";
  document.getElementById("up_file_div").style.display = "none";
}

function up_updateManualSubject() {
  document.getElementById("subject_code").value = document.getElementById("manual_subject_code").value.trim().toUpperCase();
  document.getElementById("subject_name").value = document.getElementById("manual_subject_name").value.trim();
}

function up_onUnitChange() {
  const unit_no = document.getElementById("up_unit").value;
  const subject_val = document.getElementById("up_subject").value;
  
  document.getElementById("unit_no").value = unit_no;

  if (subject_val === "OTHER") {
    document.getElementById("unit_name").value = "Manual Upload";
  } else {
    const text = document.getElementById("up_unit").selectedOptions[0].text;
    const unit_name = text.split("-")[1].trim();
    document.getElementById("unit_name").value = unit_name;
  }

  document.getElementById("up_file_div").style.display = "flex";
}

// -------- SUBJECT GROUP UI --------
let allNotesData = [];

async function loadNotes() {
  try {
    const res = await apiFetch("/notes");
    if (!res) return;
    allNotesData = await res.json();
    await renderSubjects();
  } catch (e) {
    document.getElementById("notesList").innerHTML = `<div class="empty-state">Failed to load notes.</div>`;
  }
}

async function renderSubjects() {
  const selectedYear = document.getElementById("yearSelect").value;
  const div = document.getElementById("notesList");
  div.innerHTML = `<div class="empty-state">Loading notes and syllabus...</div>`;

  const user = getUserEmail();
  const userIsAdmin = isAdmin();

  if (!selectedYear) {
    div.innerHTML = `<div class="empty-state">Please select a year to view course materials.</div>`;
    return;
  }

  // Filter notes by year
  const filteredNotes = allNotesData.filter(n => {
    return String(n.year).trim() === String(selectedYear).trim();
  });

  // 🔥 STEP 1: syllabus fetch karo (ALL subjects)
  const syllabusData = await getSyllabusByYear(selectedYear);

  if (!syllabusData || syllabusData.length === 0) {
    div.innerHTML = `<div class="empty-state">No syllabus or subjects configured for Year ${selectedYear}.</div>`;
    return;
  }

  // 🔥 STEP 2: unique subjects nikalo
  const subjectsMap = {};

  syllabusData.forEach(item => {
    subjectsMap[item.subject_code] = item.subject_name;
  });

  let htmlString = "";

  // 🟢 Step 3: UI render karo
  for (const subjectCode of Object.keys(subjectsMap)) {
    const subjectName = subjectsMap[subjectCode];
    const subjectTitle = `${subjectCode} - ${subjectName}`;
    const subjectNotes = filteredNotes.filter(n => n.subject_code === subjectCode);

    // 🔥 syllabus data fetch karo
    const unitsData = await getUnitsBySubject(subjectCode);

    // sort
    unitsData.sort((a,b)=> parseInt(a.unit_no) - parseInt(b.unit_no));

    // 🔥 syllabus UI
    let syllabusHTML = `
  <details class="unit-box" style="margin-bottom:15px;">
    <summary class="unit-title">
      <span>📘 Syllabus</span>
      <div style="display:flex; align-items:center;">
        <span class="unit-empty">Click to view</span>
      </div>
    </summary>
    <div class="unit-content">
`;

    unitsData.forEach(u=>{
      syllabusHTML += `
        <div style="margin-bottom:10px;">
          <strong>Unit ${u.unit_no} - ${u.unit_name}</strong><br>
          <span style="color:#94a3b8; font-size:0.85rem;">
            ${u.syllabus || "No syllabus"}
          </span>
        </div>
      `;
    });

    syllabusHTML += `</div></details>`;

    htmlString += `
      <details class="subject-box">
        <summary class="subject-title">${subjectTitle}</summary>
        <div class="subject-content">
          ${syllabusHTML}
    `;

    // Units loop mapping directly over Syllabus data structure
    unitsData.forEach(u => {
      const unitDocs = subjectNotes.filter(n => parseInt(n.unit_no) === parseInt(u.unit_no));
      const unitName = u.unit_name; // 🔥 ALWAYS from syllabus

      const badgeHtml = unitDocs.length > 0
        ? `<span class="unit-badge">${unitDocs.length} PDF${unitDocs.length > 1 ? 's' : ''}</span>`
        : `<span class="unit-empty">(No PDFs)</span>`;

      htmlString += `
        <details class="unit-box">
          <summary class="unit-title">
            <span>Unit ${u.unit_no} - ${unitName}</span>
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
          const uploaderName = n.uploaded_by ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Uploaded by: <span style="font-weight: 500;">${n.uploaded_by}</span></div>` : '';
          const score = n.score ?? (n.match_score ? (n.match_score * 10).toFixed(1) : null);
          
          htmlString += `
            <div class="card file-card">
              <div class="card-info" style="overflow: hidden; display: flex; align-items: center; gap: 0.75rem; width: 100%;">
                <div class="file-icon" style="font-size: 1.5rem;">📄</div>
                <div style="min-width: 0; flex: 1;">
                   <div class="card-title text-truncate" title="${cleanName}">${cleanName}</div>
                   <div class="card-subtitle">
                     <span class="badge-pdf">PDF</span> ${n.subject_code} • Unit ${n.unit_no}
                     ${uploaderName}
                     ${n.admin_comment ? `
                       <div style="font-size:0.8rem; color:#94a3b8; margin-top:4px;">
                         🧑‍💼 Admin: ${n.admin_comment}
                       </div>
                     ` : ""}
                     ${score ? `
                       <div style="margin-top:6px; font-size:0.85rem; font-weight:600;">
                         ⭐ ${score} / 10
                       </div>
                     ` : ""}
                   </div>
                </div>
              </div>
              <div class="file-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap; width: 100%; align-items: center;">
                <a href="${n.file_url}" target="_blank" class="btn-outline btn-rounded" style="text-decoration:none;"><span style="margin-right:4px;">👁</span> Preview</a>
                <a href="${n.file_url}" download>
                  ⬇ Download
                </a>
                ${userIsAdmin ? `<button onclick="deleteNote('${n.id}')" class="btn-danger btn-icon btn-reject" title="Delete">
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
    });

    htmlString += `</div></details>`;
  }
  div.innerHTML = htmlString;

  // Trigger reveal animation for newly added elements
  if (window.observeElements) setTimeout(window.observeElements, 50);
}

// -------- PENDING --------
async function loadPending() {
  try {
    const res = await apiFetch("/pending");
    if (!res) return;
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
            
            <div style="font-size:0.8rem; color:#94a3b8; margin-top:8px;">
              🤖 AI Score: ${n.score ?? (n.match_score ? (n.match_score * 10).toFixed(1) : "N/A")} / 10
            </div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:4px; margin-bottom: 4px;">
              💬 AI: ${n.ai_response || "No response"}
            </div>
          </div>

          <textarea placeholder="Add comment (optional)" class="admin-comment" style="width: 100%; margin-bottom: 0.75rem; padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border-light); background: var(--bg-main); color: var(--text-color); font-family: inherit; resize: vertical; min-height: 48px; font-size: 0.85rem; transition: border-color 0.2s;"></textarea>

          <div class="pending-actions">
            <a href="${n.file_url}" target="_blank" class="btn-outline btn-rounded" style="text-decoration:none;">👁 Preview</a>
            <button class="btn-success btn-rounded" onclick="approveWithComment('${n.id}', this)">✅ Approve</button>
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
async function approveWithComment(id, btn) {
  if (btn.dataset.loading) return;

  const card = btn.closest('.pending-card');
  const textarea = card.querySelector('.admin-comment');
  const comment = (textarea && textarea.value.trim()) ? textarea.value.trim() : "No comment provided";

  btn.dataset.loading = "true";
  btn.disabled = true;
  btn.innerHTML = "⏳ Approving...";

  try {
    const res = await apiFetch("/approve", {
      method: "POST",
      body: JSON.stringify({
        id: id,
        comment: comment
      })
    });

    if (!res || !res.ok) {
      showToast("Error approving ❌", "error");
      btn.disabled = false;
      btn.innerHTML = "✅ Approve";
      delete btn.dataset.loading;
      return;
    }

    showToast("Approved with comment ✅", "success");

    if (card) {
      card.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      setTimeout(() => {
        card.remove();
        if (typeof checkEmptyPending === 'function') {
          checkEmptyPending();
        }
      }, 300);
    } else {
      loadPending();
    }

    loadNotes(); // refresh notes
  } catch (e) {
    showToast("Error approving note.", "error");
    btn.disabled = false;
    btn.innerHTML = "✅ Approve";
    delete btn.dataset.loading;
  }
}

async function approve(id, btnElement) {
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = "⏳ Approving...";
  }

  try {
    const res = await apiFetch("/approve", {
      method: "POST",
      body: JSON.stringify({ id })
    });

    if (!res || !res.ok) {
      showToast("Something went wrong ❌", "error");
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = "✅ Approve";
      }
      return;
    }

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
    const res = await apiFetch("/reject", {
      method: "POST",
      body: JSON.stringify({ id })
    });

    if (!res || !res.ok) {
      showToast("Something went wrong ❌", "error");
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = "🗑️ Reject";
      }
      return;
    }

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
    const res = await apiFetch("/delete", {
      method: "POST",
      body: JSON.stringify({ id })
    });

    if (!res || !res.ok) {
      showToast("Something went wrong ❌", "error");
      return;
    }

    showToast("Note Deleted", "error");
    loadNotes();
    if (isAdmin()) {
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

// -------- PYQ SYSTEM --------
async function pyq_onYearChange() {
  const year = document.getElementById("pyqYearSelect").value;
  const data = await getSyllabusByYear(year);
  const subjectSelect = document.getElementById("pyqSubjectSelect");
  
  subjectSelect.innerHTML = `<option disabled selected>2. Select Subject</option>`;
  const unique = {};
  data.forEach(item => { unique[item.subject_code] = item.subject_name; });
  Object.keys(unique).forEach(code => {
    subjectSelect.innerHTML += `<option value="${code}">${code} - ${unique[code]}</option>`;
  });
  
  subjectSelect.style.display = "block";
  document.getElementById("pyqTypeButtons").style.display = "none";
  document.getElementById("pyq-container").innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">Select a subject and type.</div>`;
}

function pyq_onSubjectChange() {
  document.getElementById("pyqTypeButtons").style.display = "flex";
}

async function loadPYQ(type) {
  const subjectSelect = document.getElementById("pyqSubjectSelect");
  if (!subjectSelect || !subjectSelect.value) {
    showToast("Please select a subject", "error");
    return;
  }
  
  const subject_code = subjectSelect.value.trim().toUpperCase();

  const container = document.getElementById("pyq-container");
  if (container) container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">Loading PYQs...</div>`;

  try {
    const res = await apiFetch(`/pyq?subject_code=${encodeURIComponent(subject_code)}&type=${encodeURIComponent(type)}`);
    if (!res || !res.ok) {
        showToast("Error loading PYQs", "error");
        if (container) container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">Failed to load.</div>`;
        return;
    }
    const data = await res.json();
    renderPYQ(data);
  } catch(e) {
    showToast("Network Error", "error");
    if (container) container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">Network Error.</div>`;
  }
}

function renderPYQ(pyqs) {
  const container = document.getElementById("pyq-container");
  if (!container) return;

  if (!pyqs || pyqs.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">No PYQs found for this subject and exam type.</div>`;
    return;
  }

  container.innerHTML = pyqs.map(p => `
    <div class="pyq-card">
      <div class="pyq-card-header">
        <div class="pyq-icon">📄</div>
        <div class="pyq-info">
          <div class="pyq-title" title="${p.file_name}">${p.file_name || "PYQ Document"}</div>
          <div class="pyq-subtitle">${p.subject_code} • ${p.type ? p.type.toUpperCase() : "Exam"}</div>
        </div>
      </div>
      <div class="pyq-actions">
        <a href="${p.file_url}" target="_blank" class="btn-outline">👁 Preview</a>
        <a href="${p.file_url}" download class="btn-primary-gradient">⬇ Download</a>
      </div>
    </div>
  `).join("");
}

async function up_pyq_onYearChange() {
  const year = document.getElementById("up_pyq_year").value;
  const data = await getSyllabusByYear(year);
  const subjectSelect = document.getElementById("up_pyq_subject");
  
  subjectSelect.innerHTML = `<option disabled selected>2. Select Subject</option>`;
  const unique = {};
  data.forEach(item => { unique[item.subject_code] = item.subject_name; });
  Object.keys(unique).forEach(code => {
    subjectSelect.innerHTML += `<option value="${code}">${code} - ${unique[code]}</option>`;
  });
  
  subjectSelect.style.display = "block";
  document.getElementById("up_pyq_details_div").style.display = "none";
}

function up_pyq_onSubjectChange() {
  document.getElementById("up_pyq_details_div").style.display = "flex";
}

async function uploadPYQ() {
  const fileInput = document.getElementById("pyqFile");
  const subjectSelect = document.getElementById("up_pyq_subject");
  const type = document.getElementById("pyqType").value;
  const btn = document.getElementById("uploadPYQBtn");

  const file = fileInput.files[0];

  if (!file) {
    showToast("Select file", "error");
    return;
  }
  if (!subjectSelect || !subjectSelect.value) {
    showToast("Select Subject", "error");
    return;
  }
  if (!type) {
    showToast("Select Type", "error");
    return;
  }
  
  if (btn) btn.disabled = true;
  openAiModal();

  const subject_code = subjectSelect.value;
  const reader = new FileReader();

  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];

    try {
      const res = await apiFetch(`/pyq-upload`, {
        method: "POST",
        body: JSON.stringify({
          subject_code: subject_code,
          subject_name: subject_code, // simple for now
          type: type,
          file_name: formatFileName(file.name) || file.name,
          file_data: base64,
          uploaded_by: getUserEmail() || "user"
        })
      });

      if (!res || !res.ok) {
        showAiResult(false, "Upload failed");
        if (btn) btn.disabled = false;
        return;
      }

      await res.json();
      showAiResult(true, "PYQ Uploaded Successfully");
      
      fileInput.value = "";
      document.getElementById("pyqType").value = "";
      document.getElementById("up_pyq_subject").style.display = "none";
      document.getElementById("up_pyq_details_div").style.display = "none";
      document.getElementById("up_pyq_year").selectedIndex = 0;
      if (btn) btn.disabled = false;
    } catch (e) {
      showAiResult(false, "Network Error");
      if (btn) btn.disabled = false;
    }
  };

  reader.readAsDataURL(file);
}

// -------- SYLLABUS SYSTEM --------
function showUpload(type) {
  document.getElementById("upload-notes").style.display = "none";
  document.getElementById("upload-pyq").style.display = "none";
  document.getElementById("upload-syllabus").style.display = "none";

  document.getElementById("btnUploadNotes").className = "btn-outline";
  document.getElementById("btnUploadPYQ").className = "btn-outline";
  document.getElementById("btnUploadSyllabus").className = "btn-outline";

  if (type === 'notes') {
    document.getElementById("upload-notes").style.display = "block";
    document.getElementById("btnUploadNotes").className = "btn-primary";
  } else if (type === 'pyq') {
    document.getElementById("upload-pyq").style.display = "block";
    document.getElementById("btnUploadPYQ").className = "btn-primary";
  } else if (type === 'syllabus') {
    document.getElementById("upload-syllabus").style.display = "block";
    document.getElementById("btnUploadSyllabus").className = "btn-primary";
  }
}

async function uploadSyllabus() {
  const fileInput = document.getElementById("sy_file");
  const file = fileInput.files ? fileInput.files[0] : null;

  const year = document.getElementById("sy_year").value;
  const subject_code = document.getElementById("sy_code").value;
  const subject_name = document.getElementById("sy_name").value;

  if (!year || !subject_code || !file) {
    showToast("Fill all required fields", "error");
    return;
  }

  const btn = document.querySelector('button[onclick="uploadSyllabus()"]');
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Uploading..."; // For visual feedback on btn
  }
  
  openAiModal();

  const reader = new FileReader();

  reader.onload = async function () {
    const base64 = reader.result.split(",")[1];

    try {
      const res = await apiFetch("/upload-syllabus", {
        method: "POST",
        body: JSON.stringify({
          year: year,
          subject_code: subject_code.toUpperCase(),
          subject_name: subject_name,
          file_data: base64
        })
      });

      if (res && res.ok) {
        showAiResult(true, "Syllabus Uploaded Successfully");
        fileInput.value = "";
        document.getElementById("sy_code").value = "";
        document.getElementById("sy_name").value = "";
        document.getElementById("sy_year").value = "";
      } else {
        showAiResult(false, "Upload failed");
      }
    } catch(e) {
      showAiResult(false, "Network Error");
    }

    if (btn) {
      btn.disabled = false;
      btn.innerText = "Upload Syllabus";
    }
  };

  reader.readAsDataURL(file);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(window.observeElements, 100);
  
  const pyqBtn = document.getElementById("uploadPYQBtn");
  if (pyqBtn) {
    pyqBtn.addEventListener("click", uploadPYQ);
  }
});

// Patch showSection to re-observe when switching tabs
const originalShowSection = window.showSection;
window.showSection = function (sectionId) {
  if (originalShowSection) originalShowSection(sectionId);
  setTimeout(window.observeElements, 50);
};

// -------- AI UPLOAD MODAL --------
let aiInterval;

function openAiModal() {
  document.getElementById("aiModal").style.display = "flex";
  document.getElementById("aiModalLoading").style.display = "flex";
  document.getElementById("aiModalResult").style.display = "none";
  
  const bar = document.getElementById("aiProgressBar");
  const txt = document.getElementById("aiProgressText");
  const heading = document.querySelector("#aiModalLoading h3");
  
  if (heading) heading.innerText = "Uploading...";
  bar.style.width = "0%";
  txt.innerText = "Uploading file...";
  
  let progress = 0;
  aiInterval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress >= 90) progress = 90;
    bar.style.width = `${progress}%`;
    
    if (progress > 30) txt.innerText = "Processing...";
    if (progress > 70) txt.innerText = "Finalizing...";
  }, 300);
}

function closeAiModal() {
  document.getElementById("aiModal").style.display = "none";
}

function showAiResult(success, message) {
  clearInterval(aiInterval);
  document.getElementById("aiProgressBar").style.width = "100%";
  document.getElementById("aiProgressText").innerText = success ? "Done!" : "Error";
  
  setTimeout(() => {
    document.getElementById("aiModalLoading").style.display = "none";
    document.getElementById("aiModalResult").style.display = "flex";
    
    const icon = document.getElementById("aiModalIcon");
    const title = document.getElementById("aiModalResultTitle");
    const text = document.getElementById("aiModalResultText");
    
    if (success) {
      icon.innerText = "✅";
      title.innerText = "Upload Complete";
      title.style.color = "var(--success)";
      text.innerText = message || "Your file has been successfully uploaded.";
      setTimeout(() => {
        closeAiModal();
      }, 2000);
    } else {
      icon.innerText = "❌";
      title.innerText = "Upload Failed";
      title.style.color = "var(--danger)";
      text.innerText = message || "An error occurred. Please try again.";
    }
  }, 500);
}
