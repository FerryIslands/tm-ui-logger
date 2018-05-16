const randomstring = require('randomstring')
const moment = require('moment')
const SUT = require('./log-event-converter')

const { describe, it, expect, beforeEach } = window

describe('log-event-converter', () => {
  describe('convertLogObjectToLogEvent', () => {
    describe('converting a non Error', () => {
      let logObject
      let result

      beforeEach(() => {
        logObject = {
          message: randomstring.generate(10),
          level: {
            label: randomstring.generate(5),
            value: Math.floor(Math.random() * 10)
          },
          logger: randomstring.generate(15),
          timestamp: moment().format(),
          stacktrace: randomstring.generate(200)
        }
        result = SUT.convertLogObjectToLogEvent(logObject)
      })

      it('should map level.label to level', async () => {
        expect(result.level).toEqual(logObject.level.label)
      })

      it('should map level.value to severity', async () => {
        expect(result.severity).toEqual(logObject.level.value)
      })

      it('should map message to message', async () => {
        expect(result.message).toEqual(logObject.message)
      })

      it('should map logger to logger', async () => {
        expect(result.logger).toEqual(logObject.logger)
      })

      it('should map timestamp to timestamp', async () => {
        expect(result.timestamp).toEqual(logObject.timestamp)
      })

      it('should map stacktrace to stacktrace', async () => {
        expect(result.stacktrace).toEqual(logObject.stacktrace)
      })
    })

    describe('converting an Error', () => {
      let logObject
      let expectedMessage
      let expectedError
      let result

      beforeEach(() => {
        expectedMessage = randomstring.generate(10)
        expectedError = {
          type: randomstring.generate(10),
          message: randomstring.generate(50)
        }

        logObject = {
          message: `Object{"message":"${expectedMessage}","error":${JSON.stringify(
            expectedError
          )}}`,
          level: {
            label: randomstring.generate(5),
            value: Math.floor(Math.random() * 10)
          },
          logger: randomstring.generate(15),
          timestamp: moment().format(),
          stacktrace: randomstring.generate(200)
        }
        result = SUT.convertLogObjectToLogEvent(logObject)
      })

      it('should map log.level.label to level', async () => {
        expect(result.level).toEqual(logObject.level.label)
      })

      it('should map log.level.value to severity', async () => {
        expect(result.severity).toEqual(logObject.level.value)
      })

      it('should map message to message', async () => {
        expect(result.message).toEqual(expectedMessage)
      })

      it('should map error to error', async () => {
        expect(result.error).toEqual(expectedError)
      })

      it('should map logger to logger', async () => {
        expect(result.logger).toEqual(logObject.logger)
      })

      it('should map timestamp to timestamp', async () => {
        expect(result.timestamp).toEqual(logObject.timestamp)
      })

      it('should not include stacktrace', async () => {
        expect(result.stacktrace).toEqual(undefined)
      })
    })
  })

  describe('convertErrorToLogEvent', () => {
    describe('converting a non Error', () => {
      it('should throw when converting', async () => {
        let error = {}
        let result
        try {
          SUT.convertErrorToLogEvent(error)
        } catch (e) {
          result = e
        }

        expect(result instanceof Error).toEqual(true)
        expect(result.message).toEqual('Only Error objects can be converted')
      })
    })

    describe('converting an Error', () => {
      let error
      let result

      beforeEach(() => {
        error =
          Math.random() > 0.5
            ? new TypeError(randomstring.generate(10))
            : new Error(randomstring.generate(20))

        result = SUT.convertErrorToLogEvent(error)
      })

      it('should map error.message to message', async () => {
        expect(result.message).toEqual(error.message)
      })

      it('should map error.message to error.message', async () => {
        expect(result.error.message).toEqual(error.message)
      })

      it('should map error.name to error.type', async () => {
        expect(result.error.type).toEqual(error.name)
      })

      it('should map error.stack to error.stacktrace', async () => {
        expect(result.error.stacktrace).toEqual(error.stack.split('\n'))
      })

      it('should not map any custom properties', async () => {
        expect(result.error.custom).toEqual(undefined)
      })

      describe('given a Firefox browser', () => {
        beforeEach(() => {
          error.lineNumber = Math.floor(Math.random() * 1000) + 1
          error.columnNumber = Math.floor(Math.random() * 200) + 1
          error.fileName = `${randomstring.generate(10)}.js`

          result = SUT.convertErrorToLogEvent(error)
        })

        it('should map error.lineNumber to error.custom.javascript.line_number', async () => {
          expect(result.error.custom.javascript.line_number).toEqual(
            error.lineNumber
          )
        })

        it('should map error.columnNumber to error.custom.javascript.column_number', async () => {
          expect(result.error.custom.javascript.column_number).toEqual(
            error.columnNumber
          )
        })

        it('should map error.fileName to error.custom.javascript.file_name', async () => {
          expect(result.error.custom.javascript.file_name).toEqual(
            error.fileName
          )
        })
      })

      describe('given a IE browser', () => {
        beforeEach(() => {
          error.number = Math.floor(Math.random() * 10000) + 1

          result = SUT.convertErrorToLogEvent(error)
        })

        it('should map error.number to error.custom.javascript.error_number', async () => {
          expect(result.error.custom.javascript.error_number).toEqual(
            error.number
          )
        })
      })
    })
  })
})
