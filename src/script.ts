import { MyTaskList, Task } from "./classes";
//#region constants
const ArrowColor = "WhiteSmoke";
const ArrowColorPrimary = "Orange";
//#endregion

//#region eventListeners
// Resize arrows when the window is resized
window.addEventListener("resize", function(){
    reposition_arrows();
    let firstTaskRect = document.getElementById(TaskList[0].ID)?.getBoundingClientRect();
    if (firstTaskRect == null){
        return;
    }

    for (let index = 0; index < TaskList.length; index++) {
        const task = TaskList[index];
        let tmpTaskRect = document.getElementById(task.ID)?.getBoundingClientRect()
        if (tmpTaskRect == null){
            continue;
        }
        if (tmpTaskRect.top > firstTaskRect?.top){
            console.log("More than one row");
            return;
        }
    }

});
//#endregion

//#region variables
var TaskList:MyTaskList = new MyTaskList([]);
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
        TaskList = MyTaskList.fromCSV(reader.result as string);
        drawTasks();
    }
    //console.log(file);
    reader.readAsText(file);
}

function addTask():void {
    let ID = (document.getElementById("ID") as HTMLInputElement).value;
    let Name = (document.getElementById("Task") as HTMLInputElement).value;
    let Duration = Number((document.getElementById("Duration") as HTMLInputElement).value);
    let Predecessor = (document.getElementById("Predecessor") as HTMLInputElement).value;
    
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

/**
TODO:parallele Tasks darstellen done?
TODO: Pfeile richtig darstellen
TODO: Pfeile richtig darstellen bei mehreren Vorgängern
TODO: bei mehr als 2 parallelen Tasks, testen ob alles richtig dargestellt wird
TODO: primär Pfad kennzeichnen
*/
function drawTasks():void {
    TaskList.resetDrawn();
    TaskList.orderByStart();
    //TODO:sort by Start/End descending
    TaskList.calculateBackValues();
    let taskContainer = document.getElementById("taskContainer") as HTMLElement;
    if (taskContainer == null){
        console.error("taskContainer is null");
        return;
    }
    taskContainer.innerHTML = "";

    TaskList.forEach(task =>{
        if (task.isDrawn){
            return;
        }
        if (task.Parellel && task.Predecessor.length != 0){
            let tmpTaskParallel = TaskList.filter(t => t.Predecessor.includes(task.Predecessor[0]));
            //console.log(task.ID);
            //console.log(tmpTaskParallel);
            let tmpDiv = document.createElement("div");
            tmpDiv.classList.add("row", "d-inline-block","p-3", "text-center", "Task", "parallele");
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
            taskContainer.innerHTML += task.getHtml();
            let tmpTaskElement = document.getElementById(task.ID) as HTMLElement;
            if (task.Predecessor.length == 0){
                tmpTaskElement.style.marginRight = "0.75rem";
            }
            else{
                tmpTaskElement.style.marginLeft = "0.75rem";
                tmpTaskElement.style.marginRight = "0.75rem";
            }
            task.isDrawn = true;
            //TaskList.indexOf(task) != TaskList.length - 1 || 
            if (task.Predecessor.length != 0){
                //console.log(`Task: ${TaskList.indexOf(task)} - ${TaskList.length}`);
                //document.getElementById("taskContainer").innerHTML += Arrow(0);
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

        // Get bounding rectangles for start and end elements
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();

        if (startElement == null || endElement == null){
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
        arrow.id = `arrow-${Predecessor}-${Task.ID}`;
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
        (document.getElementById("taskContainer") as HTMLElement).innerHTML += arrow.outerHTML;
    });
}

(window as any).readFile = readFile;
(window as any).addTask = addTask;