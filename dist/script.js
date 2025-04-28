"use strict";
(() => {
  // src/classes.ts
  var TaskListManager = class _TaskListManager extends Array {
    constructor(tasks = []) {
      super(...Array.isArray(tasks) ? tasks : []);
    }
    static fromCSV(csv) {
      let tmp = new _TaskListManager([]);
      let lines = csv.split("\r\n");
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
    }
    remove(task) {
      const index = this.indexOf(task);
      if (index > -1) {
        this.splice(index, 1);
      }
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
    }
    orderByStart() {
      this.sort((a, b) => a.Start - b.Start);
    }
    resetDrawn() {
      this.forEach((task) => {
        task.isDrawn = false;
      });
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
      this.isDrawn = false;
      this.Start = 0;
      this.End = 0;
      this.BackAnfang = 0;
      this.BackEnde = 0;
      this.Puffer = 0;
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
      element.className = "col p-3 text-center Task-horizontal";
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
      let parentElement = document.createElement("div");
      parentElement.className = "row container Task-vertical";
      let element = document.createElement("div");
      element.className = "m-3 text-center";
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
      parentElement.appendChild(element);
      return parentElement;
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
  var ArrowPadding_Vertical = 5;
  var errorModal = document.getElementById("errorModal");
  var modalInstance = new window.bootstrap.Modal(errorModal);
  var errorModalTitle = errorModal.querySelector(".modal-title");
  var errorModalBody = errorModal.querySelector(".modal-body");
  var errorModalCloseButton = errorModal.querySelector(".modal-footer")?.querySelector(".btn-primary");
  var taskTable = document.getElementById("taskTableBody");
  window.addEventListener("resize", function() {
    reposition_arrows();
  });
  window.addEventListener("error", function(event) {
    showErrorModal(event.message, "interner Fehler", "Ok");
    console.error(event.message, event.error);
  });
  var TaskList = new TaskListManager([]);
  var CurOrientation = () => {
    let element = document.getElementById("orientationSwitch");
    if (element == null) {
      return 0 /* unknown */;
    }
    if (element.checked) {
      return 2 /* Vertical */;
    }
    return 1 /* Horizontal */;
  };
  function reposition_arrows() {
    for (let index = 0; index < document.getElementsByClassName("arrow").length; index++) {
      const arrow = document.getElementsByClassName("arrow").item(index);
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
      } else {
        startX = startRect.right;
        startY = startRect.top + startRect.height / 2;
        endX = endRect.left;
        endY = endRect.top + endRect.height / 2;
      }
      const arrowWidth = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
      arrow.style.width = `${arrowWidth}px`;
      arrow.style.height = "2px";
      arrow.style.backgroundColor = ArrowColor;
      arrow.style.position = "absolute";
      arrow.style.top = `${startY}px`;
      arrow.style.left = `${startX}px`;
      arrow.style.transformOrigin = "0 50%";
      arrow.style.transform = `rotate(${angle}deg)`;
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
      TaskList = TaskListManager.fromCSV(reader.result);
      drawTasks();
    };
    reader.readAsText(file);
  }
  function changeOrientation() {
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
    drawTasks();
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
    TaskList.resetDrawn();
    TaskList.orderByStart();
    TaskList.calculateBackValues();
    let taskContainer = document.getElementById("taskContainer");
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
  }
  function drawTasks_horizontally(taskContainer) {
    TaskList.forEach((task) => {
      if (task.isDrawn) {
        return;
      }
      if (task.Parallel && task.Predecessor.length != 0) {
        let tmpTaskParallel = TaskList.filter((t) => t.Predecessor.includes(task.Predecessor[0]));
        let tmpDiv = document.createElement("div");
        tmpDiv.classList.add("col", "p-3", "text-center", "Task-horizontal");
        tmpDiv.style.marginLeft = "0.75rem";
        tmpDiv.style.marginRight = "0.75rem";
        tmpTaskParallel.forEach((t) => {
          TaskList[TaskList.indexOf(t)].isDrawn = true;
          tmpDiv.appendChild(t.getHtmlElement_vertical());
        });
        taskContainer.appendChild(tmpDiv);
        tmpTaskParallel.forEach((t) => {
          drawArrow(t);
        });
      } else {
        taskContainer.appendChild(task.getHtmlElement_horizontal());
        let tmpTaskElement = document.getElementById(task.ID);
        if (task.Predecessor.length == 0) {
          tmpTaskElement.style.marginRight = "0.75rem";
        } else {
          tmpTaskElement.style.marginLeft = "0.75rem";
          tmpTaskElement.style.marginRight = "0.75rem";
        }
        task.isDrawn = true;
        if (task.Predecessor.length != 0) {
          drawArrow(task);
        }
      }
    });
    window.dispatchEvent(new Event("resize"));
  }
  function drawTasks_vertical(taskContainer) {
    TaskList.forEach((task) => {
      if (task.isDrawn) {
        return;
      }
      if (task.Parallel && task.Predecessor.length != 0) {
        let tmpTaskParallel = TaskList.filter((t) => t.Predecessor.includes(task.Predecessor[0]));
        let tmpDiv = document.createElement("div");
        tmpDiv.classList.add("row", "p-3", "text-center");
        tmpDiv.style.minWidth = "150px";
        tmpDiv.style.justifySelf = "center";
        tmpTaskParallel.forEach((t) => {
          TaskList[TaskList.indexOf(t)].isDrawn = true;
          tmpDiv.appendChild(t.getHtmlElement_horizontal());
        });
        taskContainer.appendChild(tmpDiv);
        tmpTaskParallel.forEach((t) => {
          let tmpTaskElement = document.getElementById(t.ID);
          if (t.Predecessor.length == 0) {
            tmpTaskElement.style.marginRight = "0.75rem";
          } else {
            tmpTaskElement.style.marginLeft = "0.75rem";
            tmpTaskElement.style.marginRight = "0.75rem";
          }
        });
        tmpTaskParallel.forEach((t) => {
          drawArrow(t);
        });
      } else {
        taskContainer.appendChild(task.getHtmlElement_vertical());
        task.isDrawn = true;
        if (task.Predecessor.length != 0) {
          drawArrow(task);
        }
      }
    });
    window.dispatchEvent(new Event("resize"));
  }
  function drawArrow(Task2) {
    Task2.Predecessor.forEach((Predecessor) => {
      const startElement = document.getElementById(Predecessor);
      const endElement = document.getElementById(Task2.ID);
      if (startElement == null || endElement == null) {
        return;
      }
      const arrow = document.createElement("div");
      arrow.classList.add("arrow");
      arrow.id = `arrow-${Predecessor}-${Task2.ID}`;
      document.getElementById("taskContainer").innerHTML += arrow.outerHTML;
    });
  }
  function populateTaskTable() {
    taskTable.innerHTML = "";
    TaskList.forEach((task) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${task.ID}</td>
            <td>${task.Name}</td>
            <td>${task.Duration}</td>
            <td>${task.Predecessor.join(", ")}</td>
            <td>
                <button type="button" class="btn-close"></button>
            </td>
        `;
      taskTable.appendChild(row);
    });
  }
  window.readFile = readFile;
  window.addTask = addTask;
  window.changeOrientation = changeOrientation;
  window.populateTaskTable = populateTaskTable;
})();
