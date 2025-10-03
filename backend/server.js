
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
// const {logger} = require('../backend/patterns/LoggerSingleton');
const { Singleton } = require('../backend/patterns/LoggerSingleton');
const logger = new Singleton().getInstance();
dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/pets', require('./routes/petRoutes'));


// Export the app object for testing
if (require.main === module) {
    connectDB();
    // If the file is run directly, start the server
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  }


module.exports = app
