const mongoose= require('mongoose');

mongoose.connection.once('open', ()=> {
    console.log('MongoDB connection ready')
});

mongoose.connection.on('error', (err)=> {
    console.error(err)
})

const MONGO_URI = 'mongodb+srv://freecodecamp:freecodecamp@mongoflix.tw5gy.mongodb.net/space?retryWrites=true&w=majority'

async function mongoDisconnect(){
    await mongoose.disconnect();
}

async function mongoConnect(){
    mongoose.connect(MONGO_URI, {
        useUnifiedTopology:true 
    });
}

module.exports = {mongoConnect, mongoDisconnect}