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
        
    }
    
    error(message) {
        const timestamp = new Date().toISOString();
        this.logs.push( {message, timestamp });
    
    }
}

const logger = new Logger();

module.exports = { Logger, logger };