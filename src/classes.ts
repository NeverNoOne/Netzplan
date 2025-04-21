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

    getHtml(){
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
}