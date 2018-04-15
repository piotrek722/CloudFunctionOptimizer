const fs = require('fs');
const path = require('path');
const csvParser = require('fast-csv');

const resourceTimesString = "resourceTimes";

const dagPath = process.argv[2];
const csvPath = process.argv[3];
const outputPath = process.argv[4];

if(!csvPath || !dagPath || !outputPath){
    throw new Error("Provide valid arguments: node time-decorator.js DAG_PATH CSV_PATH OUTPUT_PATH");
}

console.log(`DAG file path is ${dagPath}`);
console.log(`CSV file path is ${csvPath}`);

let dag = fs.readFileSync(dagPath);
dag = JSON.parse(dag);

if(!dag.tasks){
    throw new Error("There are no tasks in dag file");
}

let tasks = dag.tasks;

let idTypeMap = new Map();

csvParser
    .fromPath(csvPath, {delimiter: ' '})
    .on("data", data => {
        let id = data[1];
        let time = data[5];
        let type = data[6];
        if(!idTypeMap.has(id)) idTypeMap.set(id, new Map());
        let typeTimeMap = idTypeMap.get(id);
        if(!typeTimeMap.get(type)) typeTimeMap.set(type, []);
        typeTimeMap.get(type).push( Number(time) / 1000 );
    })
    .on("end", function () {
        let resourceTimes = calculateResourceTimes(idTypeMap);
        decorateTaskWithTime(tasks, resourceTimes);
        fs.writeFile(process.argv[4], JSON.stringify(dag, null, 2), (err) => {
            if (err) throw err;
        });
    });

function calculateResourceTimes(idTimeMap) {
    let resourceTimes = {};

    for(let id of idTimeMap.keys()){
      let typeTimeMap = idTimeMap.get(id);
      for(let type of typeTimeMap.keys()){
        let times = typeTimeMap.get(type);
        let average = calculateAverage(times);
        if (!resourceTimes[id]) resourceTimes[id] = {};
        resourceTimes[id][type] = average;
      }
    }
    return resourceTimes;
}

function calculateAverage(times) {

    let sum = 0;
    for(let i=0; i< times.length; i++){
        sum += times[i];
    }
    return Math.round(sum / times.length * 1000)/1000;
}

function decorateTaskWithTime(tasks, times) {
    tasks.forEach(task => {
        let id = task.config.id;
        let resourceTimes = times[id];
        task[resourceTimesString] = resourceTimes;
    })
}
