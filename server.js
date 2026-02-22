require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/confing/db');


connectDB().then(() => {
    try {
        app.listen(3000, () => {
            console.log('Server started at PORT 3000');
        })
    }catch(err){
        console.log('Error starting server: ',err);
    }
})

