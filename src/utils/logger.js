module.exports = {
  logger: require('tracer').colorConsole({
    level: 'trace',
    dateformat: 'HH:MM:ss.L',
    format: '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})'
  })
}

