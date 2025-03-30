"use strict";
const ArrowColor = "WhiteSmoke";
const ArrowColorPrimary = "Orange";
// Resize arrows when the window is resized
window.addEventListener("resize", function () {
    for (let index = 0; index < document.getElementsByClassName("arrow").length; index++) {
        const arrow = document.getElementsByClassName("arrow").item(index);
        if (arrow == null) {
            return;
        }
        let TaskID = arrow.id.split("-")[1];
        if (TaskID == null) {
            console.error("TaskID is null\n" + arrow.id);
            return;
        }
        let Task = TaskElementMap.get(TaskID);
        const startElement = document.getElementById(Task.Predecessor[0]);
        const endElement = document.getElementById(Task.ID);
        if (startElement == null || endElement == null) {
            console.error("Start or End element is null\n" + Task.Predecessor[0] + " - " + Task.ID);
            return;
        }
        // Get bounding rectangles for start and end elements
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();
        // Calculate the center of both elements (taking into account offsets within the page)
        const startX = startRect.right;
        const startY = startRect.top + startRect.height / 2;
        const endX = endRect.left;
        const endY = endRect.top + endRect.height / 2;
        // calculate the arrow width and angle
        const arrowWidth = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI); // Angle in degrees
        // Set the CSS styles for the arrow
        arrow.style.width = `${arrowWidth}px`;
        arrow.style.height = '2px';
        arrow.style.backgroundColor = ArrowColor;
        arrow.style.position = 'absolute';
        arrow.style.top = `${startY}px`;
        arrow.style.left = `${startX}px`;
        arrow.style.transformOrigin = '0 50%'; // Set origin for rotation
        arrow.style.transform = `rotate(${angle}deg)`; // Rotate the arrow to the right angle
    }
    //console.log("resize");
});
function readFile() {
    var _a, _b;
    const file = (_b = (_a = document.getElementById("formFile")) === null || _a === void 0 ? void 0 : _a.files) === null || _b === void 0 ? void 0 : _b[0];
    if (file == null) {
        return;
    }
    if (file.type != "text/csv") {
        alert("Es können nur CSV-Dateien hochgeladen werden.");
        document.getElementById("formFile").value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = function () {
        //console.log(reader.result);
        if (reader.result == null) {
            return;
        }
        mapCSVtoTasks(reader.result);
        drawTasks();
    };
    //console.log(file);
    reader.readAsText(file);
}
function mapCSVtoTasks(csv) {
    csv = csv.toString();
    TaskList = [];
    let lines = csv.split("\r\n");
    for (let index = 0; index < lines.length - 1; index++) {
        const element = lines[index];
        let values = element.split(";");
        let ID = values[0];
        let Name = values[1];
        let Duration = Number(values[2]);
        let Predecessor = values[3];
        let CurTask = new Task(ID, Name, Duration, Predecessor);
        TaskList.push(CurTask);
    }
}
class Task {
    constructor(ID, Name, Duration, Predecessor) {
        this.ID = ID;
        this.Name = Name;
        this.Duration = Number(Duration);
        this.Predecessor = Predecessor.split(",").filter(x => x.trim() != ""); //.map(Number).sort((a, b) => a - b)
        this.Parellel = false;
        this.isDrawn = false;
        if (TaskList.length == 0 || this.Predecessor.length == 0) {
            this.Start = 0;
        }
        else {
            let tmpTaskList = TaskList.filter(task => this.Predecessor.includes(task.ID));
            if (tmpTaskList.length == 0) {
                /** @type {int} */
                this.Start = 0;
            }
            else {
                /** @type {int} */
                this.Start = Math.max(...tmpTaskList.map(task => task.End));
            }
        }
        this.End = this.Start + this.Duration;
        this.BackAnfang = 0;
        this.BackEnde = 0;
        this.Puffer = 0;
    }
    calculateBackValues() {
        //TODO: BackAnfang, BackEnde, Puffer berechnen
        //interesting for the back calculation
        //this.Start = Math.max(...tmpTaskList.map(task => task.End));
        if (TaskList.length != 0) {
            let tmpTaskList = TaskList.filter(task => task.Predecessor.includes(this.ID));
            if (tmpTaskList.length != 0) {
                this.BackEnde = Math.max(...tmpTaskList.map(task => task.Start));
                this.BackAnfang = this.BackEnde - this.Duration;
                this.Puffer = this.BackAnfang - this.Start;
            }
            //TODO: wenn es mehere letzte Tasks gibt, dann den mit dem größten Endwert nehmen
            else {
                this.BackAnfang = this.Start;
                this.BackEnde = this.End;
                this.Puffer = 0;
            }
        }
        this.Predecessor.forEach(pre => {
            let tmpTaskList = TaskList.filter(task => task.Predecessor.includes(pre));
            this.Parellel = tmpTaskList.length > 1;
        });
    }
    getHtml() {
        return `
            <div class="d-inline-block p-3 text-center Task" id="${this.ID}">
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
}
function drawArrow(Task) {
    Task.Predecessor.forEach(Predecessor => {
        const startElement = document.getElementById(Predecessor);
        const endElement = document.getElementById(Task.ID);
        if (startElement == null || endElement == null) {
            return;
        }
        // Get bounding rectangles for start and end elements
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();
        if (startElement == null || endElement == null) {
            return;
        }
        // Calculate the center of both elements (taking into account offsets within the page)
        const startX = startRect.right;
        const startY = startRect.top + startRect.height / 2;
        const endX = endRect.left;
        const endY = endRect.top + endRect.height / 2;
        // Create the arrow (SVG line) dynamically
        const arrow = document.createElement('div');
        arrow.classList.add('arrow');
        arrow.id = `arrow-${Task.ID}`;
        const arrowWidth = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI); // Angle in degrees
        // Set the CSS styles for the arrow
        arrow.style.width = `${arrowWidth}px`;
        arrow.style.height = '2px';
        arrow.style.backgroundColor = ArrowColor;
        arrow.style.position = 'absolute';
        arrow.style.top = `${startY}px`;
        arrow.style.left = `${startX}px`;
        arrow.style.transformOrigin = '0 50%'; // Set origin for rotation
        arrow.style.transform = `rotate(${angle}deg)`; // Rotate the arrow to the right angle
        // Append the arrow to the document
        document.getElementById("taskContainer").innerHTML += arrow.outerHTML;
    });
}
var TaskList = [];
var TaskElementMap = new Map();
function addTask() {
    let ID = document.getElementById("ID").value;
    let Name = document.getElementById("Task").value;
    let Duration = Number(document.getElementById("Duration").value);
    let Predecessor = document.getElementById("Predecessor").value;
    let CurTask = new Task(ID, Name, Duration, Predecessor);
    TaskList.push(CurTask);
    drawTasks();
    clearControl();
}
function clearControl() {
    document.getElementById("ID").value = "";
    document.getElementById("Task").value = "";
    document.getElementById("Duration").value = "";
    document.getElementById("Predecessor").value = "";
}
function orderTasks() {
    /*TODO: sort by Start (chronologically)*/
}
/**
TODO:parallele Tasks darstellen done?
TODO: Pfeile richtig darstellen
TODO: Pfeile richtig darstellen bei mehreren Vorgängern
TODO: bei mehr als 2 parallelen Tasks, testen ob alles richtig dargestellt wird
TODO: primär Pfad kennzeichnen
*/
function drawTasks() {
    TaskElementMap.clear();
    orderTasks();
    //TODO:sort by Start/End descending
    TaskList.forEach(task => {
        task.calculateBackValues();
        task.isDrawn = false;
    });
    let taskContainer = document.getElementById("taskContainer");
    if (taskContainer == null) {
        console.error("taskContainer is null");
        return;
    }
    taskContainer.innerHTML = "";
    TaskList.forEach(task => {
        TaskElementMap.set(task.ID, task);
        if (task.isDrawn) {
            return;
        }
        if (task.Parellel && task.Predecessor.length != 0) {
            let tmpTaskParallel = TaskList.filter(t => t.Predecessor.includes(task.Predecessor[0]));
            //console.log(task.ID);
            //console.log(tmpTaskParallel);
            let tmpDiv = document.createElement("div");
            tmpDiv.classList.add("row", "d-inline-block", "p-3", "text-center", "Task", "parallele");
            tmpDiv.style.marginLeft = "0.75rem";
            tmpDiv.style.marginRight = "0.75rem";
            //Tasks zeichnen
            tmpTaskParallel.forEach(t => {
                TaskList[TaskList.indexOf(t)].isDrawn = true;
                tmpDiv.innerHTML += t.getHtml();
            });
            taskContainer.appendChild(tmpDiv);
            //margin an position anpassen
            tmpTaskParallel.forEach(t => {
                let tmpTaskElement = document.getElementById(t.ID);
                if (t.Predecessor.length == 0) {
                    tmpTaskElement.style.marginRight = "0.75rem";
                }
                else {
                    tmpTaskElement.style.marginLeft = "0.75rem";
                    tmpTaskElement.style.marginRight = "0.75rem";
                }
            });
            //Pfeil zeichnen
            tmpTaskParallel.forEach(t => {
                drawArrow(t);
            });
        }
        else {
            taskContainer.innerHTML += task.getHtml();
            let tmpTaskElement = document.getElementById(task.ID);
            if (task.Predecessor.length == 0) {
                tmpTaskElement.style.marginRight = "0.75rem";
            }
            else {
                tmpTaskElement.style.marginLeft = "0.75rem";
                tmpTaskElement.style.marginRight = "0.75rem";
            }
            task.isDrawn = true;
            //TaskList.indexOf(task) != TaskList.length - 1 || 
            if (task.Predecessor.length != 0) {
                //console.log(`Task: ${TaskList.indexOf(task)} - ${TaskList.length}`);
                //document.getElementById("taskContainer").innerHTML += Arrow(0);
                drawArrow(task);
            }
        }
    });
}
