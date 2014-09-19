module.exports = function(grunt)
{

	grunt.initConfig(
	{
		pkg: grunt.file.readJSON("package.json"),
		jshint:
		{
			files: ["app.js", "tests/tests.js", "Gruntfile.js"],
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
			files: ["app.js", "tests/tests.js", "Gruntfile.js"],
			options:
			{
				js:
				{
					braceStyle: "expand",
					indentWithTabs: true,
					indentSize: 4,
					maxPreserveNewlines: 2
				}
			}
		},
		nodewebkit:
		{
			options:
			{
				platforms: ["win", "osx", "linux64"],
				buildDir: "./build"
			},
			src: ["index.html", "app.js", "style.css", "package.json", "js/**", "components/**", "elements/**", "node_modules/{marked,highlight.js}/**"]
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