const axios = require('axios');

const planets = require('./planets.mongo');
const launchesDataBase = require('./launches.mongo');



async function getAllLaunches(skip,limit){
    return await launchesDataBase
    .find({},{'_id':0, '__v':0})
    .sort({flightNumber:1})
    .skip(skip)
    .limit(limit);
}

async function existLaunchWithId(launchId){
    return await findLaunch({flightNumber:launchId});
}

async function scheduleNewLaunch(launch){
    const planet = await planets.findOne({keplerName: launch.target});
    if(!planet){
        throw new Error('No matching planet was found');
    }
    const newFlightNumber = await getLatestFlightNumber() +1
    const newLaunch = Object.assign(launch,{
        success:true,
        upcoming:true,
        customers: ['ZTM', 'NASA'],
        flightNumber: newFlightNumber
    });
    await saveLaunch(newLaunch)
}


async function abortLaunchById(launchId){
    const aborted = await launchesDataBase.updateOne({flightNumber:launchId}, {
        upcoming:false, success: false
    })
    return aborted.ok === 1 && aborted.nModified ===1;
}

async function getLatestFlightNumber(){
    const defaultFlightNumber = 100;
    const latestLaunch= await launchesDataBase.findOne().sort('-flightNumber') ;
    if(!latestLaunch){
        defaultFlightNumber;
    }
    return latestLaunch.flightNumber;
}

async function saveLaunch(launch){
    
    await launchesDataBase.findOneAndUpdate({flightNumber:launch.flightNumber},launch, {upsert:true})
}

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches(){
    console.log('Downloading launch data...');
    const response = await axios.post(SPACEX_API_URL, {
        query:{},
        options:{
            pagination:false,
            populate:[
                {
                    path:'rocket',
                    select:{
                        name:1
                    }
                },
                {
                    path:'payloads',
                    select:{
                        customers:1
                    }
                }
            ]
        }
    });
    if(response.status!==200){
        console.log('error loadind data')
        throw new Error('Launch data download fail');
    }
    const launchDocs = response.data.docs;
    for(const launchDoc of launchDocs ){
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap(payload=> payload['customers'])
        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local '],
            upcoming: launchDoc.upcoming,
            success: launchDoc.success,
            customers: customers
        }
        console.log(`${launch.flightNumber} ${launch.mission}`);
        saveLaunch(launch)
    }
}
async function loadLaunchData(){
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket:'Falcon 1',
        mission:'FalconSat'
    });
    if(firstLaunch){
        console.log('launch data already loaded!');
    }else{
        await populateLaunches()
    }
}

async function findLaunch (filter){
    return launchesDataBase.findOne(filter)
}
module.exports = {getAllLaunches, existLaunchWithId, abortLaunchById, scheduleNewLaunch, loadLaunchData};