module.exports = function(grunt)
{

	grunt.initConfig(
	{
		pkg: grunt.file.readJSON("package.json"),
		jshint:
		{
			files: ["assets/js/app.js", "tests/tests.js", "Gruntfile.js"],
			options:
			{
				globals:
				{
					jQuery: true,
					console: true,
					module: true,
					document: true
				}
			}
		},
		"jsbeautifier":
		{
			files: ["assets/js/app.js", "tests/tests.js", "Gruntfile.js"],
			options:
			{
				js:
				{
					braceStyle: "expand",
					indentWithTabs: true,
					indentSize: 1,
					maxPreserveNewlines: 2
				}
			}
		},
		nodewebkit:
		{
			options:
			{
				platforms: ["win32", "osx64", "linux32"],
				version: "0.11.6",
				buildDir: "./build",
				macIcns: "./assets/logo.icns"
			},
			src: ["index.html", "package.json", "assets/**", "node_modules/{marked,highlight.js}/**"]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-jsbeautifier");
	grunt.loadNpmTasks('grunt-node-webkit-builder');

	grunt.registerTask("test", ["jshint"]);
	grunt.registerTask("clean", ["jsbeautifier"]);
	grunt.registerTask("build", ["nodewebkit"]);
	grunt.registerTask("default", ["jshint"]);

};
