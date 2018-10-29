#!/usr/bin/env node

module.exports = function (ctx) {
    var fs = ctx.requireCordovaModule('fs'),
        path = ctx.requireCordovaModule('path'),
        os = require("os"),
        readline = require("readline"),
        deferral = ctx.requireCordovaModule('q').defer();

    const gradlePath = path.join(ctx.opts.projectRoot, 'platforms/android/build.gradle');
    fs.readFile(gradlePath, 'utf8', (error, gradleContents) => {

        if (error) throw error;

        var hasJackConfig = gradleContents.indexOf("jackOptions") > -1;

        var lineReader = readline.createInterface({
            terminal: false,
            input: fs.createReadStream('platforms/android/build.gradle')
        });
        lineReader.on("line", function (line) {
            if (/.*\ sourceCompatibility .*/.test(line)) {
                line = '\t\tsourceCompatibility JavaVersion.VERSION_1_8';
            }
            if (/.*\ targetCompatibility .*/.test(line)) {
                line = '\t\ttargetCompatibility JavaVersion.VERSION_1_8';
            }
            fs.appendFileSync('./build.gradle', line.toString() + os.EOL);
            if (/.*\ dependencies \{.*/.test(line)) {
                fs.appendFileSync('./build.gradle', '\t\tclasspath "io.realm:realm-gradle-plugin:3.7.2"' + os.EOL);
            }
            if (/.*\ defaultConfig \{.*/.test(line) && !hasJackConfig) {
                fs.appendFileSync('./build.gradle', '\t\tjackOptions {' + os.EOL + '\t\t\t\tenabled true' + os.EOL + '\t\t}' + os.EOL);
            }
        }).on("close", function () {
            fs.rename('./build.gradle', 'platforms/android/build.gradle', deferral.resolve);
        });

        return deferral.promise;
    });
}