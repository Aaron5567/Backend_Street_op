module.exports = {
  apps : [{
    name: 'Server',
    script: 'npm',
    args: "run prod",
    // exec_mode: "cluster",
    // instances: 2,
    watch: true,
  }],
};
