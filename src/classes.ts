export { MyTaskList, Task };
/* TODO: Better Name */
class MyTaskList extends Array<Task> {
  constructor(tasks: Task[] = []) {
    super(...(Array.isArray(tasks) ? tasks : []));
  }

  public static fromCSV(csv: string) {
    let tmp = new MyTaskList([]);
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
  }

  remove(task: Task) {
    const index = this.indexOf(task);
    if (index > -1) {
      this.splice(index, 1);
    }
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
        //TODO: wenn es mehere letzte Tasks gibt, dann den mit dem größten Endwert nehmen
        else{
            curTask.BackAnfang = curTask.Start;
            curTask.BackEnde = curTask.End;
            curTask.Puffer = 0;
        }
    }

    curTask.Predecessor.forEach(pre => {
        let tmpTaskList = this.filter(task => task.Predecessor.includes(pre));
        curTask.Parellel = tmpTaskList.length > 1;
        
    });
  }

  orderByStart(){
    this.sort((a, b) => a.Start - b.Start);
  }

  resetDrawn(){
    this.forEach(task => {
        task.isDrawn = false;
    });
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
    Parellel: boolean;
    isDrawn: boolean;
    Start: number;
    End: number;
    BackAnfang: number;
    BackEnde: number;
    Puffer: number;
    constructor(ID:string, Name:any,Duration:number,Predecessor:string) {
        this.ID = ID.trim();
        this.Name = Name;
        this.Duration = Duration;
        this.Predecessor = Predecessor.split(",").filter(x => x.trim() != "").map(x => x.trim());
        this.Parellel = false;
        this.isDrawn = false;
        this.Start = 0;
        this.End = 0;
        this.BackAnfang = 0;
        this.BackEnde = 0;
        this.Puffer = 0;
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
        element.className = "col p-3 text-center Task-horizontal";
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
        let parentElement = document.createElement("div");
        parentElement.className = "row container Task-vertical";
        
        let element = document.createElement("div");
        element.className = "m-3 text-center";
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

        parentElement.appendChild(element);

        return parentElement;
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