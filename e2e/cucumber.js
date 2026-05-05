module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['steps/**/*.js', 'support/**/*.js'],
    format: ['progress'],
  },
  epic8: {
    paths: ['features/epic-8-registration-code.feature'],
    require: ['steps/epic-8-registration-code.js', 'support/world.js', 'support/auth.js'],
    format: ['progress'],
  },
  epic9: {
    paths: ['features/epic-9-ui-redesign.feature'],
    require: ['steps/epic-9-ui-redesign.js', 'support/world.js', 'support/auth.js'],
    format: ['progress'],
  },
};
