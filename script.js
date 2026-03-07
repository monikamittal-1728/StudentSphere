// =============================================
// SHARED CONFIG
// =============================================

const dbName = "studentDB";

/**
 * Validates a single field value against a rule set.
 */
function validateField(value, type) {
  if (!value) return "All fields are required.";

  switch (type) {
    case "name":
      // Student name: letters and spaces only
      if (!/^[A-Za-z\s]+$/.test(value))
        return "Student name must contain characters only.";
      break;

    case "id":
      // Student ID: digits only
      if (!/^[0-9]+$/.test(value))
        return "Student ID must be numeric.";
      break;

    case "contact":
      // Contact: digits only, minimum 10 digits
      if (!/^[0-9]{10,}$/.test(value))
        return "Contact number must be at least 10 numeric digits.";
      break;

    case "email":
      // Email: standard format check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Please enter a valid email address.";
      break;
  }

  return null; // valid
}

/**
 * Runs all four validations and shows the first error as a toast.
 * true if all fields pass, false otherwise
 */
function validateAll(name, id, contact, email) {
  const checks = [
    validateField(name,    "name"),
    validateField(id,      "id"),
    validateField(contact, "contact"),
    validateField(email,   "email"),
  ];

  for (const error of checks) {
    if (error) {
      showToast(error, "error");
      return false;
    }
  }

  return true;
}

// =============================================
// REGISTER PAGE  (index.html)
// =============================================

const form = document.querySelector(".input-form");

if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name    = document.getElementById("studentName").value.trim();
    const id      = document.getElementById("studentId").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const email   = document.getElementById("email").value.trim();

    // Run JS-only validation — stop if any field fails
    if (!validateAll(name, id, contact, email)) return;

    // Persist the new record to localStorage
    const studentList = JSON.parse(localStorage.getItem(dbName) || "[]");
    studentList.push({ name, id, contact, email });
    localStorage.setItem(dbName, JSON.stringify(studentList));

    form.reset();
    showToast(`Student "${name}" registered successfully!`, "success");
  });
}

// =============================================
// RECORDS PAGE  (record.html)
// =============================================

const tableBody = document.getElementById("tableBody");

if (tableBody) {
  // Render the table as soon as the DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    loadPage();
    addDynamicScrollbar(); // Task 6: add vertical scrollbar via JavaScript
  });
}

// =============================================
// DYNAMIC SCROLLBAR  
// =============================================

/**
 * Adds a vertical scrollbar to the table wrapper dynamically via JavaScript.
 * Sets overflow-y to "auto" and caps the wrapper height so that a native
 * scrollbar appears once the content exceeds 10 rows.
 */
function addDynamicScrollbar() {
  const wrapper = document.getElementById("tableWrapper");
  if (!wrapper) return;

  wrapper.style.overflowY = "auto";
  wrapper.style.maxHeight = "528px"; // thead (~44px) + 10 rows (~44px each)
}

// =============================================
// TABLE RENDERING
// =============================================

/** Reads localStorage and re-renders the full table */
function loadPage() {
  const studentList = JSON.parse(localStorage.getItem(dbName) || "[]");
  renderTable(studentList);
}

/**
 * Renders the provided student array into the records table.
 * Shows the empty-state element when the list is empty.
 */
function renderTable(list) {
  const emptyState = document.getElementById("emptyState");
  tableBody.innerHTML = "";

  // Remove any previously rendered mobile cards
  const oldCards = document.getElementById("mobileCards");
  if (oldCards) oldCards.remove();

  if (list.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  // ── Desktop/Tablet: render standard table rows ──
  list.forEach((student, index) => {
    const realIndex = getRealIndex(student);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(student.name)}</td>
      <td>${escapeHtml(student.id)}</td>
      <td>${escapeHtml(student.email)}</td>
      <td>${escapeHtml(student.contact)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" onclick="openEditModal(${realIndex})">
            <i class="fa-regular fa-pen-to-square"></i>
            <span class="btn-label">Edit</span>
          </button>
          <button class="btn-delete" onclick="openDeleteModal(${realIndex})">
            <i class="fa-regular fa-trash-can"></i>
            <span class="btn-label">Delete</span>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // ── Mobile: render card list only when viewport is ≤ 640px ──
  // matchMedia keeps this in sync with the CSS breakpoint so cards
  // never appear on desktop even after a window resize.
  if (window.matchMedia("(max-width: 640px)").matches) {
    const cardContainer = document.createElement("div");
    cardContainer.id = "mobileCards";

    list.forEach((student, index) => {
      const realIndex = getRealIndex(student);
      const card = document.createElement("div");
      card.className = "student-card";
      card.innerHTML = `
        <div class="card-header">
          <span class="card-index">#${index + 1}</span>
          <div class="card-actions">
            <button class="btn-edit" onclick="openEditModal(${realIndex})">
              <i class="fa-regular fa-pen-to-square"></i> Edit
            </button>
            <button class="btn-delete" onclick="openDeleteModal(${realIndex})">
              <i class="fa-regular fa-trash-can"></i> Delete
            </button>
          </div>
        </div>
        <div class="card-row">
          <span class="card-label">Name</span>
          <span class="card-value">${escapeHtml(student.name)}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Student ID</span>
          <span class="card-value">${escapeHtml(student.id)}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Email</span>
          <span class="card-value">${escapeHtml(student.email)}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Contact</span>
          <span class="card-value">${escapeHtml(student.contact)}</span>
        </div>
      `;
      cardContainer.appendChild(card);
    });

    document.getElementById("tableWrapper").appendChild(cardContainer);
  }
}

// Re-render on window resize so switching between mobile and desktop
// instantly shows the correct view (table vs cards) without a page reload.
window.addEventListener("resize", function () {
  if (tableBody) loadPage();
});

/**
 * Finds the real index of a student in the full localStorage array.
 */
function getRealIndex(student) {
  const studentList = JSON.parse(localStorage.getItem(dbName) || "[]");
  return studentList.findIndex(
    (s) =>
      s.name    === student.name &&
      s.id      === student.id &&
      s.email   === student.email
  );
}

/**
 * Escapes HTML special characters in user-entered strings
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// =============================================
// DELETE MODAL
// =============================================

/** Stores the index of the record pending deletion */
let deleteIndex = -1;

/** Opens the delete confirmation modal for the given record index */
function openDeleteModal(index) {
  deleteIndex = index;
  document.getElementById("deleteModal").classList.remove("hidden");
}

/** Permanently removes the selected record from localStorage and refreshes the table */
function confirmDelete() {
  if (deleteIndex === -1) return;

  const studentList = JSON.parse(localStorage.getItem(dbName) || "[]");
  studentList.splice(deleteIndex, 1);
  localStorage.setItem(dbName, JSON.stringify(studentList));
  deleteIndex = -1;

  closeDeleteModal();
  loadPage();
  showToast("Student record deleted.", "error");
}

/** Closes the delete modal without making any changes */
function closeDeleteModal() {
  deleteIndex = -1;
  document.getElementById("deleteModal").classList.add("hidden");
}

// =============================================
// EDIT MODAL
// =============================================

/** Stores the index of the record currently being edited */
let editModalIndex = -1;

/**
 * Opens the edit modal pre-filled with the selected student's data.
 */
function openEditModal(index) {
  const studentList = JSON.parse(localStorage.getItem(dbName) || "[]");
  const s = studentList[index];
  if (!s) return;

  editModalIndex = index;

  document.getElementById("editName").value      = s.name;
  document.getElementById("editStudentId").value = s.id;
  document.getElementById("editContact").value   = s.contact;
  document.getElementById("editEmail").value     = s.email;

  document.getElementById("editModal").classList.remove("hidden");
}

/**
 * Validates edited fields via JS and saves the updated record to localStorage.
 * Uses the same validateAll() rules as the registration form.
 */
function saveEdit() {
  if (editModalIndex === -1) return;

  const name    = document.getElementById("editName").value.trim();
  const id      = document.getElementById("editStudentId").value.trim();
  const contact = document.getElementById("editContact").value.trim();
  const email   = document.getElementById("editEmail").value.trim();

  // Run JS-only validation — stop if any field fails
  if (!validateAll(name, id, contact, email)) return;

  // Persist updated record
  const studentList = JSON.parse(localStorage.getItem(dbName) || "[]");
  studentList[editModalIndex] = { name, id, contact, email };
  localStorage.setItem(dbName, JSON.stringify(studentList));

  editModalIndex = -1;
  closeEditModal();
  loadPage();
  showToast("Record updated successfully!", "info");
}

/** Closes the edit modal without saving */
function closeEditModal() {
  editModalIndex = -1;
  document.getElementById("editModal").classList.add("hidden");
}

// Close any open modal when clicking the backdrop overlay
document.addEventListener("click", function (e) {
  if (e.target.id === "editModal")   closeEditModal();
  if (e.target.id === "deleteModal") closeDeleteModal();
});

// Close any open modal when the Escape key is pressed
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeEditModal();
    closeDeleteModal();
  }
});

// =============================================
// TOAST NOTIFICATION
// =============================================

/** Timer handle used to auto-hide the toast */
let toastTimer = null;

/**
 * Displays a brief toast notification at the bottom of the screen.
 */
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  // Auto-dismiss after 3 seconds
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}