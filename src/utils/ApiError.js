class ApiError extends Error{
    constructor(message="something went wrong",statusCode=500,error=[],stack=""){
        if (typeof message === "number") {
            const originalStatusCode = message;
            message = typeof statusCode === "string" ? statusCode : "something went wrong";
            statusCode = originalStatusCode;
        }

        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.data=null;
        this.success = false;
        if(stack) {
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor);
        }

    }
}

export default ApiError;
