"use strict";
(() => {
  // src/classes.ts
  var MyTaskList = class _MyTaskList extends Array {
    constructor(tasks = []) {
      super(...Array.isArray(tasks) ? tasks : []);
    }
    static fromCSV(csv) {
      let tmp = new _MyTaskList([]);
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
        curTask.Parellel = tmpTaskList.length > 1;
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
  var Task = class {
    constructor(ID, Name, Duration, Predecessor) {
      this.ID = ID.trim();
      this.Name = Name;
      this.Duration = Duration;
      this.Predecessor = Predecessor.split(",").filter((x) => x.trim() != "").map((x) => x.trim());
      this.Parellel = false;
      this.isDrawn = false;
      this.Start = 0;
      this.End = 0;
      this.BackAnfang = 0;
      this.BackEnde = 0;
      this.Puffer = 0;
    }
    getHtml() {
      return `
        <div class="col d-inline-block p-3 text-center Task" id="${this.ID}">
            <div class="row">
                <div class="col-3 border rounded-topleft">
                    ${this.ID}
                </div>
                <div class="col border rounded-topright">
                    ${this.Name}
                </div>
            </div>
            <div class="row">
                <div class="col-3 border">
                    ${this.Start}
                </div>
                <div class="col-3 border">
                    ${this.Duration}
                </div>
                <div class="col-3 border">
                    
                </div>
                <div class="col-3 border">
                    ${this.End}
                </div>
            </div>
            <div class="row">
                <div class="col-3 border rounded-bottomleft">
                    ${this.BackAnfang}
                </div>
                <div class="col-3 border">
                    ${this.Puffer}
                </div>
                <div class="col-3 border">
                    ${this.Puffer}
                </div>
                <div class="col-3 border rounded-bottomright">
                    ${this.BackEnde}
                </div>
            </div>
        </div>
        `;
    }
  };

  // src/script.ts
  var ArrowColor = "WhiteSmoke";
  window.addEventListener("resize", function() {
    reposition_arrows();
    let firstTaskRect = document.getElementById(TaskList[0].ID)?.getBoundingClientRect();
    if (firstTaskRect == null) {
      return;
    }
    for (let index = 0; index < TaskList.length; index++) {
      const task = TaskList[index];
      let tmpTaskRect = document.getElementById(task.ID)?.getBoundingClientRect();
      if (tmpTaskRect == null) {
        continue;
      }
      if (tmpTaskRect.top > firstTaskRect?.top) {
        console.log("More than one row");
        return;
      }
    }
  });
  var TaskList = new MyTaskList([]);
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
      const startX = startRect.right;
      const startY = startRect.top + startRect.height / 2;
      const endX = endRect.left;
      const endY = endRect.top + endRect.height / 2;
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
      TaskList = MyTaskList.fromCSV(reader.result);
      drawTasks();
    };
    reader.readAsText(file);
  }
  function addTask() {
    let ID = document.getElementById("ID").value;
    let Name = document.getElementById("Task").value;
    let Duration = Number(document.getElementById("Duration").value);
    let Predecessor = document.getElementById("Predecessor").value;
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
    TaskList.forEach((task) => {
      if (task.isDrawn) {
        return;
      }
      if (task.Parellel && task.Predecessor.length != 0) {
        let tmpTaskParallel = TaskList.filter((t) => t.Predecessor.includes(task.Predecessor[0]));
        let tmpDiv = document.createElement("div");
        tmpDiv.classList.add("row", "d-inline-block", "p-3", "text-center", "Task", "parallele");
        tmpDiv.style.marginLeft = "0.75rem";
        tmpDiv.style.marginRight = "0.75rem";
        tmpTaskParallel.forEach((t) => {
          TaskList[TaskList.indexOf(t)].isDrawn = true;
          tmpDiv.innerHTML += t.getHtml();
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
        taskContainer.innerHTML += task.getHtml();
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
  function drawArrow(Task2) {
    Task2.Predecessor.forEach((Predecessor) => {
      const startElement = document.getElementById(Predecessor);
      const endElement = document.getElementById(Task2.ID);
      if (startElement == null || endElement == null) {
        return;
      }
      const startRect = startElement.getBoundingClientRect();
      const endRect = endElement.getBoundingClientRect();
      if (startElement == null || endElement == null) {
        return;
      }
      const startX = startRect.right;
      const startY = startRect.top + startRect.height / 2;
      const endX = endRect.left;
      const endY = endRect.top + endRect.height / 2;
      const arrow = document.createElement("div");
      arrow.classList.add("arrow");
      arrow.id = `arrow-${Predecessor}-${Task2.ID}`;
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
      document.getElementById("taskContainer").innerHTML += arrow.outerHTML;
    });
  }
  window.readFile = readFile;
  window.addTask = addTask;
})();
