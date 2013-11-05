module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		meta: {
			prefix: "(function(ko, $, prefix) {\n\"use strict\";\n",
			postfix: "\n})(window.ko, window.jQuery, \"jqm\");" 
		},
		concat: {
			options: {
				banner: "<%= meta.prefix %>",
				footer: "<%= meta.postfix %>",
				separator: "\n"
			},
			dist: {
				dest: "dist/jqm-knockout.js",
				src: ["src/utils.js", "src/**/*"]
			}
		},
		uglify: {
			options: {
				banner: "/* <%= pkg.name %> <%= grunt.template.today('yyyy-mm-dd') %> */\n"
			},
			build: {
				files: {
					"dist/jqm-knockout.min.js": "dist/jqm-knockout.js" 
				}
			}
		},
		jshint: {
			files: ["dist/jqm-knockout.js"],
			options: {
				eqnull: true,
				curly: true,
				forin: true,
				newcap: true,
				noempty: false,
				plusplus: false,
				quotmark: "double",
				nonew: false,
				unused: true
			}
		}
	});


	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-concat");

	grunt.registerTask("default", ["concat","jshint","uglify"]);
};