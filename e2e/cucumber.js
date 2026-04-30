module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['steps/**/*.js', 'support/**/*.js'],
    format: ['progress'],
  },
};
