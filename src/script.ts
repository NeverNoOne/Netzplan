import { TaskListManager, Task } from "./classes";
import { Orientation } from "./enums";
//TODO: localization 

//bootstrap declaration for modal so typescript does not throw an error
declare global {
    interface Window{
        bootstrap: any;
    }
}

//#region constants
const ArrowColor = "WhiteSmoke";
const ArrowColorPrimary = "Orange";
const ArrowPadding_Vertical = 5; //px

const errorModal = document.getElementById("errorModal") as HTMLElement;
const modalInstance = new window.bootstrap.Modal(errorModal);
const errorModalTitle = errorModal.querySelector(".modal-title") as HTMLElement;
const errorModalBody = errorModal.querySelector(".modal-body") as HTMLElement;
const errorModalCloseButton = errorModal.querySelector(".modal-footer")?.querySelector(".btn-primary") as HTMLElement;

const taskTable = document.getElementById("taskTableBody") as HTMLElement;
const orientationSwitch = document.getElementById("orientationSwitch") as HTMLInputElement;
const taskContainer = document.getElementById("taskContainer") as HTMLElement;
//#endregion

//#region eventListeners
window.addEventListener("resize", function(){
    //check constraints for breakpoints
    //if (Math.min(TaskList.map((t) => t.End)))
    reposition_arrows();
});

window.addEventListener("error", function(event) {
    showErrorModal(event.message, "interner Fehler", "Ok");
    console.error(event.message, event.error);
})
//#endregion

//#region variables
var TaskList:TaskListManager = new TaskListManager();
//#endregion

//#region helper functions
const CurOrientation = () => {
    if (orientationSwitch == null){
        return Orientation.unknown;
    }
    if (orientationSwitch.checked){
        return Orientation.Vertical;
    }
    return Orientation.Horizontal;
}
//#endregion

//#region resize functions
//TODO: make sure arrows are not overlapping with each other/adjust end position
function reposition_arrows():void{
    const docArrows = document.getElementsByClassName("arrow");
    for (let index = 0; index < docArrows.length; index++) {
        const arrow = docArrows.item(index) as HTMLElement;
        if (arrow == null){
            return;
        }
        let PredecessorID = arrow.id.split("-")[1];
        let TaskID = arrow.id.split("-")[2];
        if (TaskID == null){
            console.error("TaskID is null\n" + arrow.id);
            return;
        }
        let Task = TaskList.getTaskByID(TaskID);
        if (Task == null){
            console.error("Task is null\n" + TaskID);
            return;
        }

        const startElement = document.getElementById(PredecessorID);
        const endElement = document.getElementById(Task.ID);

        if (startElement == null || endElement == null){
            console.error("Start or End element is null\n" + PredecessorID + " - " + Task.ID);
            return;
        }

        // Get bounding rectangles for start and end elements
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();

        // Calculate the center of both elements (taking into account offsets within the page) depending on the orientation
        var startX
        var startY
        var endX
        var endY
        
        if (CurOrientation() == Orientation.Vertical){
            startX = startRect.left + startRect.width / 2;
            startY = startRect.bottom;
            endX = endRect.left + endRect.width / 2;
            endY = endRect.top;
            // Adjust the start and end Y positions to avoid overlap with the task boxes
            startY += ArrowPadding_Vertical;
            endY -= ArrowPadding_Vertical;

            if (startX > endX){
                endX += 5;
            }
            else if (startX < endX){
                endX -= 5;
            }
        }
        //defaults to horizontal
        else{
            startX = startRect.right;
            startY = startRect.top + startRect.height / 2;
            endX = endRect.left;
            endY = endRect.top + endRect.height / 2;

            if (startY > endY){
                endY += 5;
            }
            else if (startY < endY){
                endY -= 5;
            }
        }

        // calculate the arrow width and angle
        const arrowWidth = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI); // Angle in degrees
        
        // Set the CSS styles for the arrow
        arrow.style.width = `${arrowWidth}px`;
        arrow.style.height = '2px';
        arrow.style.position = 'absolute';
        arrow.style.top = `${startY}px`;
        arrow.style.left = `${startX}px`;
        arrow.style.transformOrigin = '0 50%'; // Set origin for rotation
        arrow.style.transform = `rotate(${angle}deg)`; // Rotate the arrow to the right angle

        //Set arrowhead
        arrow.style.setProperty('--arrowhead-size', '10px');
        arrow.style.setProperty('--arrowhead-color', arrow.style.backgroundColor);
        arrow.style.setProperty('--arrowhead-left', arrowWidth - 5 + 'px'); // 5px from the end of the arrow
        arrow.style.setProperty('--arrowhead-rotation', `${135}deg`); //TODO: make sure heads always point to the end element
        arrow.classList.add('arrow-with-head');
    };
    //console.log("resize");
}
//#endregion

function readFile():void {
    const file: File|undefined = (document.getElementById("formFile") as HTMLInputElement)?.files?.[0];
    if (file == null) {
        return;
    }

    if (file.type != "text/csv") {
        alert("Es können nur CSV-Dateien hochgeladen werden.");
        (document.getElementById("formFile") as HTMLInputElement).value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = function() {
        //console.log(reader.result);
        if (reader.result == null) {
            return;
        }
        //mapCSVtoTasks(reader.result);
        TaskList = TaskListManager.fromCSV(reader.result as string);
        drawTasks();
    }
    //console.log(file);
    reader.readAsText(file);
}

function changeOrientation(applyOnFrontend:boolean=false):void{
    if (applyOnFrontend){
        orientationSwitch.checked = !orientationSwitch.checked;
    }
    drawTasks();
}

function addTask():void {
    let ID = (document.getElementById("ID") as HTMLInputElement).value;
    let Name = (document.getElementById("Task") as HTMLInputElement).value;
    let Duration = Number((document.getElementById("Duration") as HTMLInputElement).value);
    let Predecessor = (document.getElementById("Predecessor") as HTMLInputElement).value;
    
    let validationResult = Task.validateValues(ID, Name, Duration, Predecessor);
    if (validationResult.isValid == false){
        // alert(validationResult.errorMessage);
        showErrorModal(validationResult.errorMessage, "Eingabe-Fehler", "Ok");
        return;
    }

    let CurTask = new Task(ID, Name, Duration, Predecessor);
    TaskList.add(CurTask);

    drawTasks();
    clearControl();
}

function clearControl():void {
    (document.getElementById("ID") as HTMLInputElement).value = "";
    (document.getElementById("Task") as HTMLInputElement).value = "";
    (document.getElementById("Duration") as HTMLInputElement).value = "";
    (document.getElementById("Predecessor") as HTMLInputElement).value = "";
}

function showErrorModal(errorMessage:string, title:string = "Fehler", closeButtonText:string = "Ok"):void {
    errorModalTitle.textContent = title;
    errorModalBody.textContent = errorMessage;
    errorModalCloseButton.textContent = closeButtonText;
    modalInstance.show();
}

/**
TODO: primär Pfad kennzeichnen
TODO: Tasks neben/unter Vorgänger zeichnen anstatt nach ID
*/
function drawTasks():void {    
    if (taskContainer == null){
        console.error("taskContainer is null");
        return;
    }
    taskContainer.innerHTML = "";

    switch (CurOrientation()){
        case Orientation.Horizontal:
            taskContainer.classList = "row"
            drawTasks_horizontally(taskContainer);
            break;
        case Orientation.Vertical:
            taskContainer.classList = "container"
            drawTasks_vertical(taskContainer);
            break;
        case Orientation.unknown:
            console.error("Orientation is unknown");
            taskContainer.classList = "row"
            drawTasks_horizontally(taskContainer);
            break;
    }
    //redraw any arrows that are not positioned correctly
    window.dispatchEvent(new Event("resize"));
}

function drawTasks_horizontally(taskContainer:HTMLElement):void {

    let levels = TaskList.getAllLevels().sort((a,b) => a - b);
    //console.log(levels);
    levels.forEach(level => {
        let tmpDiv = document.createElement("div");
        tmpDiv.classList.add("col-auto");
        // tmpDiv.style.marginBottom = "0.75rem";
        tmpDiv.style.alignSelf = "center";

        TaskList.forEach(task => {
            if (task.level == level){
                tmpDiv.appendChild(task.getHtmlElement_horizontal());
                createArrow(task);
            }
        });
        taskContainer.appendChild(tmpDiv);
    });
}

function drawTasks_vertical(taskContainer:HTMLElement):void {

    let levels = TaskList.getAllLevels().sort((a,b) => a - b);
    //console.log(levels);
    levels.forEach(level => {
        let tmpDiv = document.createElement("div");
        tmpDiv.classList.add("row");
        tmpDiv.style.marginBottom = "0.75rem";
        tmpDiv.style.justifySelf = "center";

        TaskList.forEach(task => {
            if (task.level == level){
                tmpDiv.appendChild(task.getHtmlElement_vertical());
                createArrow(task);
            }
        });
        taskContainer.appendChild(tmpDiv);
    });
}

function createArrow(Task:Task):void {
    Task.Predecessor.forEach(Predecessor => {
        // Create the arrow dynamically
        const arrow = document.createElement('div');
        arrow.classList.add('arrow');
        arrow.id = `arrow-${Predecessor}-${Task.ID}`;
        arrow.style.backgroundColor = TaskList.criticalPathContains([Predecessor, Task.ID]) ? ArrowColorPrimary : ArrowColor;
        
        // Append the arrow to the document
        taskContainer.innerHTML += arrow.outerHTML;
    });
}

//TODO: remove this function and use the TaskListManager to populate the table
//TODO: implement remove task function
function populateTaskTable():void{
    taskTable.innerHTML = ""; // Clear the table body

    if (TaskList == null || TaskList.length == 0){
        let element = document.createElement("td");
        element.colSpan = 5;
        element.textContent = "Keine Aufgaben gefunden";
        
        taskTable.appendChild(element);
        return;
    }

    TaskList.forEach(task => {
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

//TODO: remove all trailing tasks
//TODO: make predecessor in table dropdown
function removeTask(taskID:string):void{
    TaskList.removeByID(taskID);
    populateTaskTable();
    drawTasks();
}

(window as any).readFile = readFile;
(window as any).addTask = addTask;
(window as any).changeOrientation = changeOrientation;
(window as any).populateTaskTable = populateTaskTable;
(window as any).removeTask = removeTask;
(window as any).debugTaskList = function(){return TaskList.sort((a,b) => a.level - b.level).map((t) => [t.ID, t.level].join(","));};