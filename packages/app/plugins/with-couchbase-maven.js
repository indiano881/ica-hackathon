const { withProjectBuildGradle, withSettingsGradle } = require("@expo/config-plugins");

function withCouchbaseMaven(config) {
  // Add to settings.gradle dependencyResolutionManagement
  config = withSettingsGradle(config, (cfg) => {
    const contents = cfg.modResults.contents;
    const mavenLine = `maven { url "https://mobile.maven.couchbase.com/maven2/dev/" }`;

    if (!contents.includes("mobile.maven.couchbase.com")) {
      // Add maven repo inside dependencyResolutionManagement.repositories
      cfg.modResults.contents = contents.replace(
        /(dependencyResolutionManagement\s*\{[\s\S]*?repositories\s*\{)/,
        `$1\n        ${mavenLine}`
      );
    }
    return cfg;
  });

  // Also add to project-level build.gradle allprojects
  config = withProjectBuildGradle(config, (cfg) => {
    const contents = cfg.modResults.contents;
    const mavenLine = `maven { url "https://mobile.maven.couchbase.com/maven2/dev/" }`;

    if (!contents.includes("mobile.maven.couchbase.com")) {
      if (contents.includes("allprojects")) {
        cfg.modResults.contents = contents.replace(
          /(allprojects\s*\{\s*repositories\s*\{)/,
          `$1\n        ${mavenLine}`
        );
      } else {
        cfg.modResults.contents += `
allprojects {
    repositories {
        ${mavenLine}
    }
}
`;
      }
    }
    return cfg;
  });

  return config;
}

module.exports = withCouchbaseMaven;
