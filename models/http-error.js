class HttpError extends Error {
    constructor(message, errorCode){
      super(message);            // Add a "message" property  // super key word calls parent class's constructor, in this case the parent class is Error
      this.code = errorCode     // Adds a "code" property 
    }
}


module.exports = HttpError