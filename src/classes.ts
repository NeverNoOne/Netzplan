export { TaskListManager , Task };

type VoidFunction = () => void;

class TaskListManager extends Array<Task> {
    criticalPath: Task[] = [];
    private ChangeHandler: VoidFunction;
    onChange: () => void = () => {
        this.sortByStart();
        this.calculateBackValues();
        this.criticalPath = this.getCriticalPath();
        //call custom change handler if set
        this.ChangeHandler();
    };

  constructor(tasks: Task[] = [], onChange_Handler:VoidFunction = () => {}) {
    super(...(Array.isArray(tasks) ? tasks : []));
    this.ChangeHandler = onChange_Handler;
  }

  private triggerChange(){
    this.onChange();
  }

  public static fromCSV(csv: string, onChange_Handler:VoidFunction = () => {}): TaskListManager {
    let tmp = new TaskListManager([], onChange_Handler);
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

  getTaskByID(ID: string) {
    return this.find(task => task.ID == ID);
  }

  add(task: Task) {
    //check if task already exists
    if(this.getTaskByID(task.ID) != undefined){
        console.error("Task already exists", task.ID);
        alert("Task already exists: " + task.ID);
        return;
    }

    //Task initialization Start, End values
    if (this.length == 0 || task.Predecessor.length == 0){
        task.Start = 0;
    }
    else{
        let tmpTaskList = this.filter(t => task.Predecessor.includes(t.ID));
        if (tmpTaskList.length == 0){
            task.Start = 0;
        }
        else{
            task.Start = Math.max(...tmpTaskList.map(task => task.End));
        }
    }
    task.End = task.Start + task.Duration;

    //push task to the list
    this.push(task);
    this.triggerChange();
  }

  remove(task: Task) {
    const index = this.indexOf(task);
    if (index > -1) {
      this.splice(index, 1);
    }
    this.triggerChange();
  }

  removeByID(ID:string){
    const task = this.getTaskByID(ID);
    if (task == undefined) return;
    //remove all trailing tasks
    this.getAllTrailingTasks(task).forEach(t => {
        this.remove(t);
    })
    this.remove(task);
    //remove all references to the task in other tasks
    this.filter(t => t.Predecessor.includes(ID)).forEach(t => {
        t.Predecessor.splice(t.Predecessor.indexOf(ID), 1);
    })
    this.triggerChange();
  }

  private getAllTrailingTasks(task:Task):Task[]{
    let trailingTasks:Task[] = this.filter(t => t.Predecessor.join(",") == task.ID);
    trailingTasks.forEach(t => {
        trailingTasks = trailingTasks.concat(this.getAllTrailingTasks(t));
    });
    return trailingTasks;
  }

  calculateBackValues(index:number = 0) {
    if (index >= this.length) return;
    this.calculateBackValues(index + 1);
    //console.log("calculateBackValues", index);
    let curTask:Task = this[index];
    
    if (this.length != 0){
        let tmpTaskList = this.filter(task => task.Predecessor.includes(curTask.ID));
        if (tmpTaskList.length != 0){
            curTask.BackEnde = Math.max(...tmpTaskList.map(task => task.Start));
            curTask.BackAnfang = curTask.BackEnde - curTask.Duration;
            curTask.Puffer = curTask.BackAnfang - curTask.Start;
        }
        else{
            curTask.BackAnfang = curTask.Start;
            curTask.BackEnde = curTask.End;
            curTask.Puffer = 0;
        }
    }

    curTask.Predecessor.forEach(pre => {
        let tmpTaskList = this.filter(task => task.Predecessor.includes(pre));
        curTask.Parallel = tmpTaskList.length > 1;
        
    });
    this.setLevel();
  }

  private setLevel(index:number = 0, level:number = 0){
    if (index >= this.length) return;
    let curTask:Task = this[index];
    curTask.level = level;
    let tmpTaskList = this.filter(task => task.Predecessor.includes(curTask.ID));
    tmpTaskList.forEach(task => {
        this.setLevel(this.indexOf(task), level + 1);
    });
  }

  getAllLevels():number[]{
    let levels = this.map(task => task.level);
    return Array.from(new Set(levels)).sort((a, b) => a - b);
  }

  sortByStart(){
    this.sort((a, b) => a.Start - b.Start);
  }

  getCriticalPath():Task[]{
    let criticalPath:Task[] = this.filter(task => task.Puffer == 0);
    return criticalPath;
  }

  criticalPathContains(IDs:string[]):boolean{
    let criticalPathIDs = this.criticalPath.map(task => task.ID);
    return IDs.every(id => criticalPathIDs.includes(id));
  }
}

class ValidationResult{
    isValid:boolean;
    errorMessage:string;
    constructor(isValid:boolean, errorMessage:string){
        this.isValid = isValid;
        this.errorMessage = errorMessage;
    }
}

class Task {
    ID: string;
    Name: any;
    Duration: number;
    Predecessor: string[];
    Parallel: boolean;
    Start: number;
    End: number;
    BackAnfang: number;
    BackEnde: number;
    Puffer: number;
    level:number;
    
    constructor(ID:string, Name:any,Duration:number,Predecessor:string) {
        this.ID = ID.trim();
        this.Name = Name;
        this.Duration = Duration;
        this.Predecessor = Predecessor.split(",").filter(x => x.trim() != "").map(x => x.trim());
        this.Parallel = false;
        this.Start = 0;
        this.End = 0;
        this.BackAnfang = 0;
        this.BackEnde = 0;
        this.Puffer = 0;
        this.level = 0;
    }

    public static validateValues(ID:string, Name:any, Duration:number, Predecessor:string):ValidationResult{
        let isValid = true;
        let errorMessage = "";
        if (ID.trim() == ""){
            isValid = false;
            errorMessage += "Keine ID angegeben, ";
        }
        if (Name.trim() == ""){
            isValid = false;
            errorMessage += "Keine Name angegeben, ";
        }
        if (Duration <= 0){
            isValid = false;
            errorMessage += "Keine Dauer angegeben, ";
        }
        errorMessage = errorMessage.endsWith(", ") ? errorMessage.slice(0, -2) : errorMessage;
        //predecessor doesn't need to be validated, because it can be empty
        return new ValidationResult(isValid, errorMessage);
    }

    getHtmlElement_horizontal():HTMLElement{
        let element = document.createElement("div");
        element.className = "row-auto container p-3 text-center Task-horizontal";
        element.id = this.ID;

        //first row
        let row1 = this.getNewRow([
            this.getNewCol("col-3 border rounded-topleft", this.ID),
            this.getNewCol("col border rounded-topright", this.Name)
        ])
        element.appendChild(row1);

        //second row
        let row2 = this.getNewRow([
            this.getNewCol("col-3 border", this.Start.toString()),
            this.getNewCol("col-3 border", this.Duration.toString()),
            this.getNewCol("col-3 border", ""),
            this.getNewCol("col-3 border", this.End.toString())
        ]);
        element.appendChild(row2);

        //third row
        let row3 = this.getNewRow([
            this.getNewCol("col-3 border rounded-bottomleft", this.BackAnfang.toString()),
            this.getNewCol("col-3 border", this.Puffer.toString()),
            this.getNewCol("col-3 border", this.Puffer.toString()),
            this.getNewCol("col-3 border rounded-bottomright", this.BackEnde.toString())
        ]);
        element.appendChild(row3);

        return element;
    }

    getHtmlElement_vertical():HTMLElement{
        
        let element = document.createElement("div");
        element.className = "col container m-3 text-center Task-vertical";
        element.id = this.ID;

        //first row
        let row1 = this.getNewRow([
            this.getNewCol("col-3 border rounded-topleft", this.ID),
            this.getNewCol("col border rounded-topright", this.Name)
        ])
        element.appendChild(row1);

        //second row
        let row2 = this.getNewRow([
            this.getNewCol("col-3 border", this.Start.toString()),
            this.getNewCol("col-3 border", this.Duration.toString()),
            this.getNewCol("col-3 border", ""),
            this.getNewCol("col-3 border", this.End.toString())
        ]);
        element.appendChild(row2);

        //third row
        let row3 = this.getNewRow([
            this.getNewCol("col-3 border rounded-bottomleft", this.BackAnfang.toString()),
            this.getNewCol("col-3 border", this.Puffer.toString()),
            this.getNewCol("col-3 border", this.Puffer.toString()),
            this.getNewCol("col-3 border rounded-bottomright", this.BackEnde.toString())
        ]);
        element.appendChild(row3);

        return element;
    }

    private getNewRow(cols:HTMLElement[], className:string=""):HTMLElement{
        let row = document.createElement("div");
        if (className != ""){
            row.className = className;
        }
        else{
            row.className = "row";
        }
        cols.forEach(col => {
            row.appendChild(col);
        });

        return row;
    }

    private getNewCol(className:string, content:string):HTMLElement{
        let col = document.createElement("div");
        col.className = className;
        col.innerHTML = content;
        return col;
    }
}