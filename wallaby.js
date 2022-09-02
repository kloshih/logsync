
export default (wallaby) => {
  return {
    testFramework: 'mocha',

    files: [
      'package.json',
      { pattern:'{lib,test}/*.json' },
      { pattern:'.env', instrument:false },
      'lib/**/*.js', 
      '!lib/**/*.spec.js',
      { pattern:'node_modules', instrument:false },
    ],

    tests: [
      'lib/**/*.spec.js',
      'test/**/*.test.js',
    ],

    env: {
      type: 'node',
    },

    smartStart: [
      { pattern:'test/**/*.e2e.test.js', 
        startMode:'never' },
      { pattern:'test/**/*.basic.test.js', 
        startMode:'always' },
      { pattern:'.env', startMode:'edit' },
      { startMode:'edit' },
    ],

    setup: async (wallaby) => {
      require('dotenv').config()
    },

  }
}