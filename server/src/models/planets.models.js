const parse = require('csv-parse');
const fs = require('fs');
const path = require('path');

const planets = require('./planets.mongo')

function isHabitable(planet){
    return planet['koi_disposition'] === 'CONFIRMED' &&
     planet['koi_insol'] > 0.36 &&
     planet['koi_insol'] < 1.11 &&
     planet['koi_prad'] <  1.6;
}


function loadPlanetsData(){
    return new Promise((resolve,reject)=>{
        fs.createReadStream(path.join(__dirname, '..', 'data', 'kepler_data.csv'))
        .pipe(parse({
            comment:'#',
            columns: true
        }))
        .on('data', async (data)=>{
            if(isHabitable(data)){
               savePlanet(data);
            }
        })
        .on('error', (err)=>{
            console.log(err)
            reject(err)
        })
        .on('end', async()=>{
            const countPlanetLength = (await getAllPlanets()).length;
            console.log(`${countPlanetLength} habitable planet found!`);
            resolve()
        })
    })
}

async function savePlanet(planet){
    try{
        await planets.updateOne({keplerName:planet.kepler_name},{keplerName:planet.kepler_name}, {upsert:true})
    }catch(e){
        console.error(`could not save planet ${e}`)
    }
}

async function getAllPlanets(){
   return await planets.find({},{'_id':0, '__v':0 })
}

module.exports = {
    getAllPlanets,
    loadPlanetsData,
}