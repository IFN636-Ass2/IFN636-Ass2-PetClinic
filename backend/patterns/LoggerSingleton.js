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
        console.log(`Info: ${timestamp} - ${message}`);
    }
    
    error(message) {
        const timestamp = new Date().toISOString();
        this.logs.push( {message, timestamp });
        console.log(`Error: ${timestamp} - ${message}`);
    }
}

class Singleton {

  constructor() {
      if (!Singleton.instance) {
          Singleton.instance = new Logger();
      }
  }

  getInstance() {
      return Singleton.instance;
  }

}

module.exports = { Singleton };

// const logger = new Logger();

// module.exports = { Logger, logger };