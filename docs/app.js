// ask for notification permission once
if ('Notification' in window) {
  Notification.requestPermission().then(p => {
    console.log('Notification permission:', p);
  });
}

let tasks = [];
let reminderTimers = [];

// clear tasks on every page load
document.addEventListener("DOMContentLoaded", () => {
  localStorage.removeItem('tasks');
  tasks = [];
  updateTasksList();
  updateStats();
  scheduleAllReminders();
});

// save to localStorage (not really used since we clear on load)
const saveTasks = () => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

// cancel all pending timers
function clearAllReminders() {
  reminderTimers.forEach(clearTimeout);
  reminderTimers = [];
}

// fire a notification immediately
function notify(task, idx) {
  console.log(`[notify] Task #${idx} (“${task.text}”)`);
  new Notification('⏰ Task Reminder', {
    body: `"${task.text}" is due at ${new Date(task.due).toLocaleString()}`
  });
}

// schedule or catch up “late” reminders
function scheduleAllReminders() {
  clearAllReminders();
  if (Notification.permission !== 'granted') return;

  const now = Date.now();
  tasks.forEach((task, idx) => {
    if (!task.due || task.reminderOffset == null || task.completed) return;

    const remindAt = task.due - task.reminderOffset;
    const delay    = remindAt - now;
    console.log(`Task #${idx} (“${task.text}”) → remind in ${delay} ms`);

    if (delay > 0) {
      const id = setTimeout(() => notify(task, idx), delay);
      reminderTimers.push(id);

    } else if (now < task.due) {
      // missed the remind window but still before due
      notify(task, idx);
    }
    // else: too late, skip
  });
}

// helper to build a true-local timestamp from the picker value
function parseLocalDateTime(value) {
  // "YYYY-MM-DDTHH:MM"
  const [date, time] = value.split('T');
  const [y,m,d]      = date.split('-').map(Number);
  const [h,min]      = time.split(':').map(Number);
  return new Date(y, m-1, d, h, min).getTime();
}

// helper to format a timestamp back to "YYYY-MM-DDTHH:MM"
function formatLocalDateTime(ms) {
  const dt = new Date(ms);
  const pad = n => n.toString().padStart(2,'0');
  const YYYY = dt.getFullYear();
  const MM   = pad(dt.getMonth()+1);
  const DD   = pad(dt.getDate());
  const hh   = pad(dt.getHours());
  const mm   = pad(dt.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

// add a new task
const addTask = () => {
  const textInput = document.getElementById('taskInput');
  const dueInput  = document.getElementById('dueTimeInput');
  const offsetSel = document.getElementById('reminderOffset');
  const text = textInput.value.trim();
  if (!text) return;

  const dueTimestamp = dueInput.value
    ? parseLocalDateTime(dueInput.value)
    : null;
  const reminderOffset = dueTimestamp
    ? parseInt(offsetSel.value, 10)
    : null;

  tasks.push({ text, completed: false, due: dueTimestamp, reminderOffset });

  // reset fields
  textInput.value = '';
  dueInput.value  = '';
  offsetSel.selectedIndex = 0;

  updateTasksList();
  updateStats();
  saveTasks();
  scheduleAllReminders();
};

// delete & re-schedule
const deleteTask = i => {
  tasks.splice(i,1);
  updateTasksList();
  updateStats();
  saveTasks();
  scheduleAllReminders();
};

// prefill for edit
const editTask = i => {
  const t = tasks[i];
  document.getElementById('taskInput').value = t.text;
  const dueInput = document.getElementById('dueTimeInput');
  if (t.due) dueInput.value = formatLocalDateTime(t.due);
  else       dueInput.value = '';
  if (t.reminderOffset != null)
    document.getElementById('reminderOffset').value = t.reminderOffset;

  tasks.splice(i,1);
  updateTasksList();
  saveTasks();
  scheduleAllReminders();
};

// toggle complete
const toggleTaskComplete = i => {
  tasks[i].completed = !tasks[i].completed;
  updateTasksList();
  updateStats();
  saveTasks();
  scheduleAllReminders();
};

// update progress & celebrate
const updateStats = () => {
  const done = tasks.filter(t=>t.completed).length;
  const total = tasks.length;
  const pct = total ? (done/total)*100 : 0;
  document.getElementById('progress').style.width = pct + '%';
  document.getElementById('numbers').innerText = `${done} / ${total}`;
  if (total && done === total) blast();
};

// render tasks
const updateTasksList = () => {
  const ul = document.getElementById('task-list');
  ul.innerHTML = '';
  tasks.forEach((t,i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="taskItem">
        <div class="task ${t.completed?'completed':''}">
          <input type="checkbox" ${t.completed?'checked':''}/>
          <p>
            ${t.text}
            ${t.due 
              ? `<br><small>Due: ${new Date(t.due).toLocaleString()}</small>` 
              : ''}
          </p>
        </div>
        <div class="icons">
          <i class="fa-solid fa-pen-to-square" onclick="editTask(${i})"></i>
          <i class="fa-solid fa-trash" onclick="deleteTask(${i})"></i>
        </div>
      </div>
    `;
    li.querySelector('input').addEventListener('change',()=>toggleTaskComplete(i));
    ul.appendChild(li);
  });
};

// hook up “+” button
document.getElementById('newTask').addEventListener('click', e => {
  e.preventDefault();
  addTask();
});

// confetti!
const blast = () => {
  const count = 200, defaults = { origin: { y: 0.7 } };
  function fire(r, opts) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count*r) });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};
