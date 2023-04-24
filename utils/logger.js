module.exports = {
  logger: require('tracer').colorConsole({
    level: 'debug',
    dateformat: 'HH:MM:ss.L',
    format: '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})'
  })
}

