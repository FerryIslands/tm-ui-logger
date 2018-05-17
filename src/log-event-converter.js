const extend = require('deep-extend')

module.exports = {
  convertLogObjectToLogEvent: log => {
    let logEvent = extend({}, log)
    logEvent.level = log.level.label
    logEvent.severity = log.level.value

    const keyword = 'Object'
    if (log.message.indexOf(keyword) === 0) {
      const parsed = JSON.parse(log.message.substring(keyword.length))
      logEvent.message = parsed.message
      if (parsed.error) {
        logEvent.error = parsed.error
        delete logEvent['stacktrace']
      }
    }

    return logEvent
  },

  convertErrorToLogEvent: error => {
    if (!(error instanceof Error)) {
      throw new Error('Only Error objects can be converted')
    }
    let logEvent = {
      message: error.message,
      error: {
        type: error.name,
        message: error.message,
        stacktrace: error.stack.split('\n')
      }
    }

    if (
      error.number ||
      error.lineNumber ||
      error.columnNumber ||
      error.fileName
    ) {
      logEvent.error.custom = {
        javascript: {
          error_number: error.number,
          line_number: error.lineNumber,
          column_number: error.columnNumber,
          file_name: error.fileName
        }
      }
    }
    return logEvent
  }
}
