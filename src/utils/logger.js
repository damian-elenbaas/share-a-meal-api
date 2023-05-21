module.exports = {
  logger: require('tracer').colorConsole({
    level: 'warn',
    dateformat: 'HH:MM:ss.L',
    format: '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})'
  })
}

