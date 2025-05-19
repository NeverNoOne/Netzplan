"use strict";
(() => {
  // src/classes.ts
  var TaskListManager = class _TaskListManager extends Array {
    constructor(tasks = [], onChange_Handler = () => {
    }) {
      super(...Array.isArray(tasks) ? tasks : []);
      this.criticalPath = [];
      this.onChange = () => {
        this.sortByStart();
        this.calculateBackValues();
        this.criticalPath = this.getCriticalPath();
        this.ChangeHandler();
      };
      this.ChangeHandler = onChange_Handler;
    }
    triggerChange() {
      this.onChange();
    }
    static fromCSV(csv, onChange_Handler = () => {
    }) {
      let tmp = new _TaskListManager([], onChange_Handler);
      let splitter = csv[csv.length - 1];
      let lines = csv.split("\n");
      for (let index = 0; index < lines.length - 1; index++) {
        const element = lines[index];
        let values = element.split(";");
        let ID = values[0];
        let Name = values[1];
        let Duration = Number(values[2]);
        let Predecessor = values[3];
        let CurTask = new Task(ID, Name, Duration, Predecessor);
        tmp.add(CurTask);
      }
      return tmp;
    }
    getTaskByID(ID) {
      return this.find((task) => task.ID == ID);
    }
    add(task) {
      if (this.getTaskByID(task.ID) != void 0) {
        console.error("Task already exists", task.ID);
        alert("Task already exists: " + task.ID);
        return;
      }
      if (this.length == 0 || task.Predecessor.length == 0) {
        task.Start = 0;
      } else {
        let tmpTaskList = this.filter((t) => task.Predecessor.includes(t.ID));
        if (tmpTaskList.length == 0) {
          task.Start = 0;
        } else {
          task.Start = Math.max(...tmpTaskList.map((task2) => task2.End));
        }
      }
      task.End = task.Start + task.Duration;
      this.push(task);
      this.triggerChange();
    }
    remove(task) {
      const index = this.indexOf(task);
      if (index > -1) {
        this.splice(index, 1);
      }
      this.triggerChange();
    }
    removeByID(ID) {
      const task = this.getTaskByID(ID);
      if (task == void 0) return;
      this.getAllTrailingTasks(task).forEach((t) => {
        this.remove(t);
      });
      this.remove(task);
      this.filter((t) => t.Predecessor.includes(ID)).forEach((t) => {
        t.Predecessor.splice(t.Predecessor.indexOf(ID), 1);
      });
      this.triggerChange();
    }
    getAllTrailingTasks(task) {
      let trailingTasks = this.filter((t) => t.Predecessor.join(",") == task.ID);
      trailingTasks.forEach((t) => {
        trailingTasks = trailingTasks.concat(this.getAllTrailingTasks(t));
      });
      return trailingTasks;
    }
    calculateBackValues(index = 0) {
      if (index >= this.length) return;
      this.calculateBackValues(index + 1);
      let curTask = this[index];
      if (this.length != 0) {
        let tmpTaskList = this.filter((task) => task.Predecessor.includes(curTask.ID));
        if (tmpTaskList.length != 0) {
          curTask.BackEnde = Math.max(...tmpTaskList.map((task) => task.Start));
          curTask.BackAnfang = curTask.BackEnde - curTask.Duration;
          curTask.Puffer = curTask.BackAnfang - curTask.Start;
        } else {
          curTask.BackAnfang = curTask.Start;
          curTask.BackEnde = curTask.End;
          curTask.Puffer = 0;
        }
      }
      curTask.Predecessor.forEach((pre) => {
        let tmpTaskList = this.filter((task) => task.Predecessor.includes(pre));
        curTask.Parallel = tmpTaskList.length > 1;
      });
      this.setLevel();
    }
    setLevel(index = 0, level = 0) {
      if (index >= this.length) return;
      let curTask = this[index];
      curTask.level = level;
      let tmpTaskList = this.filter((task) => task.Predecessor.includes(curTask.ID));
      tmpTaskList.forEach((task) => {
        this.setLevel(this.indexOf(task), level + 1);
      });
    }
    getAllLevels() {
      let levels = this.map((task) => task.level);
      return Array.from(new Set(levels)).sort((a, b) => a - b);
    }
    sortByStart() {
      this.sort((a, b) => a.Start - b.Start);
    }
    getCriticalPath() {
      let criticalPath = this.filter((task) => task.Puffer == 0);
      return criticalPath;
    }
    criticalPathContains(IDs) {
      let criticalPathIDs = this.criticalPath.map((task) => task.ID);
      return IDs.every((id) => criticalPathIDs.includes(id));
    }
  };
  var ValidationResult = class {
    constructor(isValid, errorMessage) {
      this.isValid = isValid;
      this.errorMessage = errorMessage;
    }
  };
  var Task = class {
    constructor(ID, Name, Duration, Predecessor) {
      this.ID = ID.trim();
      this.Name = Name;
      this.Duration = Duration;
      this.Predecessor = Predecessor.split(",").filter((x) => x.trim() != "").map((x) => x.trim());
      this.Parallel = false;
      this.Start = 0;
      this.End = 0;
      this.BackAnfang = 0;
      this.BackEnde = 0;
      this.Puffer = 0;
      this.level = 0;
    }
    static validateValues(ID, Name, Duration, Predecessor) {
      let isValid = true;
      let errorMessage = "";
      if (ID.trim() == "") {
        isValid = false;
        errorMessage += "Keine ID angegeben, ";
      }
      if (Name.trim() == "") {
        isValid = false;
        errorMessage += "Keine Name angegeben, ";
      }
      if (Duration <= 0) {
        isValid = false;
        errorMessage += "Keine Dauer angegeben, ";
      }
      errorMessage = errorMessage.endsWith(", ") ? errorMessage.slice(0, -2) : errorMessage;
      return new ValidationResult(isValid, errorMessage);
    }
    getHtmlElement_horizontal() {
      let element = document.createElement("div");
      element.className = "row-auto container p-3 text-center Task-horizontal";
      element.id = this.ID;
      let row1 = this.getNewRow([
        this.getNewCol("col-3 border rounded-topleft", this.ID),
        this.getNewCol("col border rounded-topright", this.Name)
      ]);
      element.appendChild(row1);
      let row2 = this.getNewRow([
        this.getNewCol("col-3 border", this.Start.toString()),
        this.getNewCol("col-3 border", this.Duration.toString()),
        this.getNewCol("col-3 border", ""),
        this.getNewCol("col-3 border", this.End.toString())
      ]);
      element.appendChild(row2);
      let row3 = this.getNewRow([
        this.getNewCol("col-3 border rounded-bottomleft", this.BackAnfang.toString()),
        this.getNewCol("col-3 border", this.Puffer.toString()),
        this.getNewCol("col-3 border", this.Puffer.toString()),
        this.getNewCol("col-3 border rounded-bottomright", this.BackEnde.toString())
      ]);
      element.appendChild(row3);
      return element;
    }
    getHtmlElement_vertical() {
      let element = document.createElement("div");
      element.className = "col container m-3 text-center Task-vertical";
      element.id = this.ID;
      let row1 = this.getNewRow([
        this.getNewCol("col-3 border rounded-topleft", this.ID),
        this.getNewCol("col border rounded-topright", this.Name)
      ]);
      element.appendChild(row1);
      let row2 = this.getNewRow([
        this.getNewCol("col-3 border", this.Start.toString()),
        this.getNewCol("col-3 border", this.Duration.toString()),
        this.getNewCol("col-3 border", ""),
        this.getNewCol("col-3 border", this.End.toString())
      ]);
      element.appendChild(row2);
      let row3 = this.getNewRow([
        this.getNewCol("col-3 border rounded-bottomleft", this.BackAnfang.toString()),
        this.getNewCol("col-3 border", this.Puffer.toString()),
        this.getNewCol("col-3 border", this.Puffer.toString()),
        this.getNewCol("col-3 border rounded-bottomright", this.BackEnde.toString())
      ]);
      element.appendChild(row3);
      return element;
    }
    getNewRow(cols, className = "") {
      let row = document.createElement("div");
      if (className != "") {
        row.className = className;
      } else {
        row.className = "row";
      }
      cols.forEach((col) => {
        row.appendChild(col);
      });
      return row;
    }
    getNewCol(className, content) {
      let col = document.createElement("div");
      col.className = className;
      col.innerHTML = content;
      return col;
    }
  };

  // src/script.ts
  var ArrowColor = "WhiteSmoke";
  var ArrowColorPrimary = "Orange";
  var ArrowPadding_Vertical = 5;
  var errorModal = document.getElementById("errorModal");
  var modalInstance = new window.bootstrap.Modal(errorModal);
  var errorModalTitle = errorModal.querySelector(".modal-title");
  var errorModalBody = errorModal.querySelector(".modal-body");
  var errorModalCloseButton = errorModal.querySelector(".modal-footer")?.querySelector(".btn-primary");
  var taskTable = document.getElementById("taskTableBody");
  var orientationSwitch = document.getElementById("orientationSwitch");
  var taskContainer = document.getElementById("taskContainer");
  var alertElementTemplate = document.getElementById("alert");
  var alertTitleTemplate = document.getElementById("alertTitle");
  var alertBodyTemplate = document.getElementById("alertMessage");
  var alertContainer = document.getElementById("toastContainer");
  window.addEventListener("resize", function() {
    const startTaskRect = getStartTaskRect();
    const endTaskRect = getEndTaskRect();
    if (CurOrientation() != 2 /* Vertical */ && startTaskRect != void 0 && endTaskRect != void 0 && startTaskRect.top != endTaskRect.top) {
      changeOrientation(true);
      console.log("Orientation changed to vertical");
      triggerAlert("Info", "Orientation changed to vertical");
    }
    reposition_arrows();
  });
  window.addEventListener("error", function(event) {
    showErrorModal(event.message, "interner Fehler", "Ok");
    console.error(event.message, event.error);
  });
  var TaskList = new TaskListManager([], drawTasks);
  function CurOrientation() {
    if (orientationSwitch == null) {
      return 0 /* unknown */;
    }
    if (orientationSwitch.checked) {
      return 2 /* Vertical */;
    }
    return 1 /* Horizontal */;
  }
  function getStartTaskRect() {
    const task = TaskList.find((task2) => task2.Start == 0);
    if (task == null) return void 0;
    const taskElement = document.getElementById(task.ID);
    if (taskElement == null) return void 0;
    return taskElement.getBoundingClientRect();
  }
  function getEndTaskRect() {
    const task = TaskList.find((task2) => task2.level == Math.max(...TaskList.map((t) => t.level)));
    if (task == null) return void 0;
    const taskElement = document.getElementById(task.ID);
    if (taskElement == null) return void 0;
    return taskElement.getBoundingClientRect();
  }
  function triggerAlert(title, message) {
    alertTitleTemplate.textContent = title;
    alertBodyTemplate.textContent = message;
    const alertElement = alertElementTemplate.cloneNode(true);
    alertElement.id = "alert-" + Date.now();
    alertContainer.appendChild(alertElement);
    const toast = new window.bootstrap.Toast(alertElement);
    toast.show();
    alertElement.addEventListener("hidden.bs.toast", () => {
      alertElement.remove();
    });
  }
  function reposition_arrows() {
    const docArrows = document.getElementsByClassName("arrow");
    for (let index = 0; index < docArrows.length; index++) {
      const arrow = docArrows.item(index);
      if (arrow == null) {
        return;
      }
      let PredecessorID = arrow.id.split("-")[1];
      let TaskID = arrow.id.split("-")[2];
      if (TaskID == null) {
        console.error("TaskID is null\n" + arrow.id);
        return;
      }
      let Task2 = TaskList.getTaskByID(TaskID);
      if (Task2 == null) {
        console.error("Task is null\n" + TaskID);
        return;
      }
      const startElement = document.getElementById(PredecessorID);
      const endElement = document.getElementById(Task2.ID);
      if (startElement == null || endElement == null) {
        console.error("Start or End element is null\n" + PredecessorID + " - " + Task2.ID);
        return;
      }
      const startRect = startElement.getBoundingClientRect();
      const endRect = endElement.getBoundingClientRect();
      var startX;
      var startY;
      var endX;
      var endY;
      if (CurOrientation() == 2 /* Vertical */) {
        startX = startRect.left + startRect.width / 2;
        startY = startRect.bottom;
        endX = endRect.left + endRect.width / 2;
        endY = endRect.top;
        startY += ArrowPadding_Vertical;
        endY -= ArrowPadding_Vertical;
        if (startX > endX) {
          endX += 5;
        } else if (startX < endX) {
          endX -= 5;
        }
      } else {
        startX = startRect.right;
        startY = startRect.top + startRect.height / 2;
        endX = endRect.left;
        endY = endRect.top + endRect.height / 2;
        if (startY > endY) {
          endY += 5;
        } else if (startY < endY) {
          endY -= 5;
        }
      }
      endY += window.pageYOffset;
      startY += window.pageYOffset;
      const arrowWidth = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
      arrow.style.width = `${arrowWidth}px`;
      arrow.style.height = "2px";
      arrow.style.position = "absolute";
      arrow.style.top = `${startY}px`;
      arrow.style.left = `${startX}px`;
      arrow.style.transformOrigin = "0 50%";
      arrow.style.transform = `rotate(${angle}deg)`;
      arrow.style.setProperty("--arrowhead-size", "10px");
      arrow.style.setProperty("--arrowhead-color", arrow.style.backgroundColor);
      arrow.style.setProperty("--arrowhead-left", arrowWidth - 5 + "px");
      arrow.style.setProperty("--arrowhead-rotation", `${135}deg`);
      arrow.classList.add("arrow-with-head");
    }
    ;
  }
  function readFile() {
    const file = document.getElementById("formFile")?.files?.[0];
    if (file == null) {
      return;
    }
    if (file.type != "text/csv") {
      alert("Es k\xF6nnen nur CSV-Dateien hochgeladen werden.");
      document.getElementById("formFile").value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = function() {
      if (reader.result == null) {
        return;
      }
      TaskList = TaskListManager.fromCSV(reader.result, drawTasks);
      drawTasks();
    };
    reader.readAsText(file);
  }
  function changeOrientation(applyOnFrontend = false) {
    if (applyOnFrontend) {
      orientationSwitch.checked = !orientationSwitch.checked;
    }
    drawTasks();
  }
  function addTask() {
    let ID = document.getElementById("ID").value;
    let Name = document.getElementById("Task").value;
    let Duration = Number(document.getElementById("Duration").value);
    let Predecessor = document.getElementById("Predecessor").value;
    let validationResult = Task.validateValues(ID, Name, Duration, Predecessor);
    if (validationResult.isValid == false) {
      showErrorModal(validationResult.errorMessage, "Eingabe-Fehler", "Ok");
      return;
    }
    let CurTask = new Task(ID, Name, Duration, Predecessor);
    TaskList.add(CurTask);
    clearControl();
  }
  function clearControl() {
    document.getElementById("ID").value = "";
    document.getElementById("Task").value = "";
    document.getElementById("Duration").value = "";
    document.getElementById("Predecessor").value = "";
  }
  function showErrorModal(errorMessage, title = "Fehler", closeButtonText = "Ok") {
    errorModalTitle.textContent = title;
    errorModalBody.textContent = errorMessage;
    errorModalCloseButton.textContent = closeButtonText;
    modalInstance.show();
  }
  function drawTasks() {
    if (taskContainer == null) {
      console.error("taskContainer is null");
      return;
    }
    taskContainer.innerHTML = "";
    switch (CurOrientation()) {
      case 1 /* Horizontal */:
        taskContainer.classList = "row";
        drawTasks_horizontally(taskContainer);
        break;
      case 2 /* Vertical */:
        taskContainer.classList = "container";
        drawTasks_vertical(taskContainer);
        break;
      case 0 /* unknown */:
        console.error("Orientation is unknown");
        taskContainer.classList = "row";
        drawTasks_horizontally(taskContainer);
        break;
    }
    window.dispatchEvent(new Event("resize"));
  }
  function drawTasks_horizontally(taskContainer2) {
    let levels = TaskList.getAllLevels().sort((a, b) => a - b);
    levels.forEach((level) => {
      let tmpDiv = document.createElement("div");
      tmpDiv.classList.add("col-auto");
      tmpDiv.style.alignSelf = "center";
      TaskList.forEach((task) => {
        if (task.level == level) {
          tmpDiv.appendChild(task.getHtmlElement_horizontal());
          createArrow(task);
        }
      });
      taskContainer2.appendChild(tmpDiv);
    });
  }
  function drawTasks_vertical(taskContainer2) {
    let levels = TaskList.getAllLevels().sort((a, b) => a - b);
    levels.forEach((level) => {
      let tmpDiv = document.createElement("div");
      tmpDiv.classList.add("row");
      tmpDiv.style.marginBottom = "0.75rem";
      tmpDiv.style.justifySelf = "center";
      TaskList.forEach((task) => {
        if (task.level == level) {
          tmpDiv.appendChild(task.getHtmlElement_vertical());
          createArrow(task);
        }
      });
      taskContainer2.appendChild(tmpDiv);
    });
  }
  function createArrow(Task2) {
    Task2.Predecessor.forEach((Predecessor) => {
      const arrow = document.createElement("div");
      arrow.classList.add("arrow");
      arrow.id = `arrow-${Predecessor}-${Task2.ID}`;
      arrow.style.backgroundColor = TaskList.criticalPathContains([Predecessor, Task2.ID]) ? ArrowColorPrimary : ArrowColor;
      taskContainer.innerHTML += arrow.outerHTML;
    });
  }
  function populateTaskTable() {
    taskTable.innerHTML = "";
    if (TaskList == null || TaskList.length == 0) {
      let element = document.createElement("td");
      element.colSpan = 5;
      element.textContent = "Keine Aufgaben gefunden";
      taskTable.appendChild(element);
      return;
    }
    TaskList.forEach((task) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${task.ID}</td>
            <td>${task.Name}</td>
            <td>${task.Duration}</td>
            <td>${task.Predecessor.join(", ")}</td>
            <td>
                <button type="button" class="btn-close" onclick="removeTask('${task.ID}')"></button>
            </td>
        `;
      taskTable.appendChild(row);
    });
  }
  function removeTask(taskID) {
    TaskList.removeByID(taskID);
    populateTaskTable();
  }
  window.readFile = readFile;
  window.addTask = addTask;
  window.changeOrientation = changeOrientation;
  window.populateTaskTable = populateTaskTable;
  window.removeTask = removeTask;
  window.debugTaskList = function() {
    return TaskList.sort((a, b) => a.level - b.level).map((t) => [t.ID, t.level].join(","));
  };
})();
