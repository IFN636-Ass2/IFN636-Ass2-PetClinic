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
        console.log(`Info: ${timestamp} - ${massage}`);
    }
    
    error(message) {
        const timestamp = new Date().toISOString();
        this.logs.push( {message, timestamp });
        console.log(`Error: ${timestamp} - ${massage}`);
    }
}

const logger = new Logger();

module.exports = { Logger, logger };