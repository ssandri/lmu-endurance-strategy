module.exports = {
  default: {
    paths: ['e2e/features/**/*.feature'],
    require: ['e2e/steps/**/*.js', 'e2e/support/**/*.js'],
    format: ['progress', 'json:reports/results.json'],
    publishQuiet: true,
  },
};
