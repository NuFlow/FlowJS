module.exports = () => {
  return {
    files: [
      'build/*.js',
    ],
    tests: [
      'tests/*'
    ],
    env: {
      type: 'node',
    },
    debug: true
  };
};
