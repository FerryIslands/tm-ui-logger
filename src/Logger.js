import log from 'loglevel'
import extend from 'deep-extend'
import prefix from 'loglevel-plugin-prefix'
import remote from 'loglevel-plugin-remote'
import converter from './log-event-converter'

class DefaultOptions {
  constructor (options) {
    options = options || {}
    this.application = options.application || 'unknown'
    this.logScope = options.logScope || 'unknown'
    this.minLevel = options.minLevel || 'debug'
  }
}

let defaultOptions = new DefaultOptions()
let initialized = false

export default class Logger {
  constructor (options) {
    this.setOptions(options)
    this.createFunctions(['trace', 'debug', 'info', 'warn', 'error'])
  }

  static initialize (options) {
    if (!initialized) {
      options = options || {}

      Logger.setDefaultOptions(options)

      const prefixConfig = extend(
        {},
        {
          enabled: true,
          timestampFormatter: date => date.toISOString(),
          levelFormatter: level =>
            level.charAt(0).toUpperCase() + level.substr(1),
          nameFormatter: name => name || 'global'
        },
        options.prefixConfig
      )

      const remoteConfig = extend(
        {},
        {
          enabled: true,
          url: `/api/log/${options.application}/`,
          timeout: 1000,
          trace: ['error'],
          format: converter.convertLogObjectToLogEvent
        },
        options.remoteConfig
      )

      remoteConfig.depth = prefixConfig.enabled ? 1 : 0

      if (prefixConfig.enabled) {
        prefix.reg(log)
        prefix.apply(log, prefixConfig)
      }

      if (remoteConfig.enabled) {
        remote.apply(log, remoteConfig)
      }

      initialized = true
    }
  }

  static getDefaultOptions () {
    return defaultOptions
  }

  static setDefaultOptions (options) {
    defaultOptions = new DefaultOptions(options)
  }

  getOptions () {
    return extend({}, Logger.getDefaultOptions(), this._options)
  }

  setOptions (options) {
    options = options || {}
    this._options = options
  }

  createFunctions (levels) {
    levels.forEach(level => {
      this[level.toLowerCase()] = ((...args) => {
        let level = args[0]
        let msgArgs = Array.prototype.slice.call(args, 1)
        let logScope = this.getLogScope()
        let logger = log.getLogger(logScope)
        logger.setLevel(this.getOptions().minLevel)
        if (msgArgs.length === 1 && msgArgs[0] instanceof Error) {
          logger[level]('%o', converter.convertErrorToLogEvent(msgArgs[0]))
        } else {
          logger[level](...msgArgs)
        }
      }).bind(null, level)
    })
  }

  getLogScope () {
    let options = this.getOptions()
    return options.logScope || this.constructor.name
  }

  /* Used to allow jest mocking */
  trace () {}
  debug () {}
  info () {}
  warn () {}
  error () {}
}
