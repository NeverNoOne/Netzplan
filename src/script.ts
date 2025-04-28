import { TaskListManager, Task } from "./classes";
import { Orientation } from "./enums";
//TODO: localization 
//TODO: on Orientation change, redraw tasks

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
    reposition_arrows();
});

window.addEventListener("error", function(event) {
    showErrorModal(event.message, "interner Fehler", "Ok");
    console.error(event.message, event.error);
})
//#endregion

//#region variables
var TaskList:TaskListManager = new TaskListManager([]);
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
function reposition_arrows():void{
    for (let index = 0; index < document.getElementsByClassName("arrow").length; index++) {
        const arrow = document.getElementsByClassName("arrow").item(index) as HTMLElement;
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
        }
        //defaults to horizontal
        else{
            startX = startRect.right;
            startY = startRect.top + startRect.height / 2;
            endX = endRect.left;
            endY = endRect.top + endRect.height / 2;
        }


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
function changeOrientation():void{
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
TODO: Pfeile richtig darstellen
TODO: bei mehr als 2 parallelen Tasks, testen ob alles richtig dargestellt wird
TODO: primär Pfad kennzeichnen
*/
function drawTasks():void {
    TaskList.resetDrawn();
    TaskList.orderByStart();
    TaskList.calculateBackValues();
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
}

function drawTasks_horizontally(taskContainer:HTMLElement):void {
    TaskList.forEach(task =>{
        if (task.isDrawn){
            return;
        }
        if (task.Parallel && task.Predecessor.length != 0){
            let tmpTaskParallel = TaskList.filter(t => t.Predecessor.includes(task.Predecessor[0]));
            //console.log(task.ID);
            //console.log(tmpTaskParallel);
            let tmpDiv = document.createElement("div");
            tmpDiv.classList.add("col","p-3", "text-center", "Task-horizontal");
            tmpDiv.style.marginLeft = "0.75rem";
            tmpDiv.style.marginRight = "0.75rem";

            //Tasks zeichnen
            tmpTaskParallel.forEach(t => {
                TaskList[TaskList.indexOf(t)].isDrawn = true;
                tmpDiv.appendChild(t.getHtmlElement_vertical());
            });
            taskContainer.appendChild(tmpDiv);

            //Pfeil zeichnen
            tmpTaskParallel.forEach(t => {
                drawArrow(t);
            });
        }
        else{
            taskContainer.appendChild(task.getHtmlElement_horizontal());
            let tmpTaskElement = document.getElementById(task.ID) as HTMLElement;
            if (task.Predecessor.length == 0){
                tmpTaskElement.style.marginRight = "0.75rem";
            }
            else{
                tmpTaskElement.style.marginLeft = "0.75rem";
                tmpTaskElement.style.marginRight = "0.75rem";
            }
            task.isDrawn = true;
            if (task.Predecessor.length != 0){
                drawArrow(task);
            }
        }
    });
    //redraw any arrows that are not positioned correctly
    window.dispatchEvent(new Event("resize"));
}

function drawTasks_vertical(taskContainer:HTMLElement):void {

    TaskList.forEach(task =>{
        if (task.isDrawn){
            return;
        }
        if (task.Parallel && task.Predecessor.length != 0){
            let tmpTaskParallel = TaskList.filter(t => t.Predecessor.includes(task.Predecessor[0]));
            //console.log(task.ID);
            //console.log(tmpTaskParallel);
            let tmpDiv = document.createElement("div");
            tmpDiv.classList.add("row", "p-3", "text-center");
            tmpDiv.style.minWidth = "150px";
            tmpDiv.style.justifySelf = "center";

            //Tasks zeichnen
            tmpTaskParallel.forEach(t => {
                TaskList[TaskList.indexOf(t)].isDrawn = true;
                tmpDiv.appendChild(t.getHtmlElement_horizontal());
            });
            taskContainer.appendChild(tmpDiv);

            //margin an position anpassen
            tmpTaskParallel.forEach(t => {
                let tmpTaskElement = document.getElementById(t.ID) as HTMLElement;
                if (t.Predecessor.length == 0){
                    tmpTaskElement.style.marginRight = "0.75rem";
                }
                else{
                    tmpTaskElement.style.marginLeft = "0.75rem";
                    tmpTaskElement.style.marginRight = "0.75rem";
                }
            });

            //Pfeil zeichnen
            tmpTaskParallel.forEach(t => {
                drawArrow(t);
            });
        }
        else{
            taskContainer.appendChild(task.getHtmlElement_vertical());

            task.isDrawn = true; 
            if (task.Predecessor.length != 0){
                drawArrow(task);
            }
        }
    });

    //redraw any arrows that are not positioned correctly
    window.dispatchEvent(new Event("resize"));
}

function drawArrow(Task:Task):void {
    Task.Predecessor.forEach(Predecessor => {
        const startElement = document.getElementById(Predecessor);
        const endElement = document.getElementById(Task.ID);

        if (startElement == null || endElement == null){
            return;
        }

        // Create the arrow (SVG line) dynamically
        const arrow = document.createElement('div');
        arrow.classList.add('arrow');
        arrow.id = `arrow-${Predecessor}-${Task.ID}`;
        
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
                <button type="button" class="btn-close"></button>
            </td>
        `;
        taskTable.appendChild(row);
    });

}

(window as any).readFile = readFile;
(window as any).addTask = addTask;
(window as any).changeOrientation = changeOrientation;
(window as any).populateTaskTable = populateTaskTable;