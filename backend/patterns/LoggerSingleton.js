class Logger {
    constructor() {
        this.logs = [];
    }
    
    get count_logs() {
        return this.logs.length;
    }

    info(message) {
        const timestamp = new Date().toISOString();
        this.logs.push({ message, timestamp });
        console.log(`Info message: ${timestamp} - ${message}`);
    }
    
    error(message) {
        const timestamp = new Date().toISOString();
        this.logs.push( {message, timestamp });
        console.log(`Error message: ${timestamp} - ${message}`);
    }
}

const logger = new Logger();

module.exports = { Logger, logger };