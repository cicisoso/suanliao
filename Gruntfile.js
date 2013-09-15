/* jshint node: true */

module.exports = function(grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*!\n' +
              '* Suanzi v<%= pkg.version %> by @spricity and @cicisoso\n' +
              '* Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
              '* Licensed under <%= _.pluck(pkg.licenses, "url").join(", ") %>\n' +
              '*\n' +
              '* Designed and built with all the love in the world by @mdo and @fat.\n' +
              '*/\n',
    //jqueryCheck: 'if (!jQuery) { throw new Error(\"Bootstrap requires jQuery\") }\n\n',

    // Task configuration.
    clean: {
      dist: ['dist']
    },

    copy: {
    	prepare: {
      		src:['js/common/adapter.js'],
      		dest: 'dist/adapter.js'
      	},
      	extensions: {
	        expand: true,
	        flatten: true,
	        src: ["js/extensions/*.js"],
	        dest: 'dist/extensions'
      	}
    },

    concat: {
		options: {
			banner: '<%= banner %>',
			stripBanners: false
		},
		bar: {
			src: ['js/bar/*.js'],
			//dest: 'dist/js/bar/<%= pkg.name %>.js'
			dest: 'dist/toolbar.js'
		},
		calendar: {
			src: [
		  		'js/calendar/*.js'
			],
			//dest: 'dist/js/bar/<%= pkg.name %>.js'
			dest: 'dist/calendar.js'
		},
    	uimixins_tmp: {
	    	src: ['js/common/component/uibase/*.js'],
	    	dest: 'js/common/tmp/uimixins.js'
	    },
	    component_tmp: {
	    	src: ['js/common/tmp/uimixins.js', 'js/common/component/*.js'],
	    	dest: 'js/common/tmp/component.js'	
	    },
	    common: {
	    	src: ['js/common/common.js', 'js/common/util.js', 'js/common/array.js', 'js/common/observable.js', 'js/common/ua.js', 'js/common/json.js', 'keycode.js', 'date.js', 'base.js', 'js/common/tmp/component.js'],
	    	dest: 'dist/common.js'
	    },
	    tree : {
          src: [
            'js/tree/*.js'
          ],
          dest: 'dist/tree.js'
        },

        tooltip : {
            src: [
              'js/tooltip/*.js'
            ],
            dest: 'dist/tooltip.js'
        },
        
        tab : {
            src: [
              'js/tab/*.js'
            ],
            dest: 'dist/tab.js'
        },
        
        select : {
            src: [
              'jslect/*.js'
            ],
            dest: 'distlect.js'
        },
        
        progressbar : {
            src: [
              'js/progressbar/*.js'
            ],
            dest: 'dist/progressbar.js'
        },
 
        picker : {
            src: [
              'js/picker/*.js'
            ],
            dest: 'dist/picker.js'
        },

        overlay : {
            src: [
              'js/overlay/*.js'
            ],
            dest: 'dist/overlay.js'
        },
        
        menu : {
            src: [
              'js/menu/*.js'
            ],
            dest: 'dist/menu.js'
        },
        
        mask : {
            src: [
              'js/mask/*.js'
            ],
            dest: 'dist/mask.js'
        }, 
        
        
        loader : {
            src: [
              'js/loader/*.js'
            ],
            dest: 'dist/loader.js'
        }, 
 
        list : {
            src: [
              'jsst/*.js'
            ],
            dest: 'distst.js'
        }, 

        grid : {
            src: [
              'js/grid/*.js'
            ],
            dest: 'dist/grid.js'
        }, 
        
        form : {
            src: [
              'js/form/*.js'
            ],
            dest: 'dist/form.js'
        },
 
        editor : {
            src: [
              'js/editor/*.js'
            ],
            dest: 'dist/editor.js'
        },
        
        data : {
            src: [
              'js/data/*.js'
            ],
            dest: 'dist/data.js'
        },   
        
        cookie : {
            src: [
              'js/cookie/*.js'
            ],
            dest: 'dist/cookie.js'
        },
        combine: {
        	src: ['dist/*.js', 'js/all.js'],
        	dest: 'dist/bui.js'
        },
        seed: {
        	src: ['dist/loader.js', 'dist/common.js', 'dist/cookie.js', 'js/src/seed.js'],
        	dest: 'dist/seed.js'
        }
    },

    uglify : {
			options : {
				banner : '/*! <%= pkg.name %> */\n',
				beautify : {
					ascii_only : false
				}
			},
			common : {
				files : [{
						expand : true,
						src : ['dist/*.js', '!*-min.js'],
						dest : '',
						ext : '-min.js'
					}
				]
			}
		},

		 recess: {
	      options: {
	        compile: true,
	        banner: '<%= banner %>'
	      },
	      base: {
	        src: ['css/less/base/dpl.less'],
	        dest: 'dist/css/dpl.css'
	      },
	      
	      base_min: {
	        options: {
	          compress: true
	        },
	        src: ['css/less/base/dpl.less'],
	        dest: 'dist/css/dpl.min.css'
	      },
	      
	      bui: {
	        src: ['css/less/bui/controls.less'],
	        dest: 'dist/css/bui.css'
	      },
	      
	      bui_min: {
	        options: {
	          compress: true
	        },
	        src: ['css/less/bui/controls.less'],
	        dest: 'dist/css/buid.min.css'
	      },
	      
	      extend: {
	          src: ['css/less/extend/extend.less'],
	          dest: 'dist/css/extend.css'
	        },
	        
			extend_min: {
			  options: {
			    compress: true
			  },
			  src: ['css/less/extend/extend.less'],
			  dest: 'dist/css/extend.min.css'
			}
	        
	    },
    


    watch: {
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'qunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      },
      recess: {
        files: 'less/*.less',
        tasks: ['recess']
      }
    }
  });


  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-html-validation');
  grunt.loadNpmTasks('grunt-jekyll');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('browserstack-runner');

  // Docs HTML validation task
  grunt.registerTask('validate-html', ['jekyll', 'validation']);

  // Test task.
  var testSubtasks = ['dist-css', 'jshint', 'qunit', 'validate-html'];
  // Only run BrowserStack tests under Travis
  if (process.env.TRAVIS) {
    // Only run BrowserStack tests if this is a mainline commit in twbs/bootstrap, or you have your own BrowserStack key
    if ((process.env.TRAVIS_REPO_SLUG === 'twbs/bootstrap' && process.env.TRAVIS_PULL_REQUEST === 'false') || process.env.TWBS_HAVE_OWN_BROWSERSTACK_KEY) {
      testSubtasks.push('browserstack_runner');
    }
  }
  grunt.registerTask('test', testSubtasks);

  // JS distribution task.
  grunt.registerTask('dist-js', ['concat', 'uglify']);

  // CSS distribution task.
  grunt.registerTask('dist-css', ['recess']);
  grunt.registerTask('default', ['clean', 'copy', 'concat', 'uglify', 'recess']);

  // Fonts distribution task.
  grunt.registerTask('dist-fonts', ['copy']);

  // Full distribution task.
  grunt.registerTask('dist', ['clean', 'dist-css', 'dist-fonts', 'dist-js']);

  // Default task.
  grunt.registerTask('test', ['test', 'dist', 'build-customizer']);

  // task for building customizer
  grunt.registerTask('build-customizer', 'Add scripts/less files to customizer.', function () {
    var fs = require('fs')

    function getFiles(type) {
      var files = {}
      fs.readdirSync(type)
        .filter(function (path) {
          return type == 'fonts' ? true : new RegExp('\\.' + type + '$').test(path)
        })
        .forEach(function (path) {
          return files[path] = fs.readFileSync(type + '/' + path, 'utf8')
        })
      return 'var __' + type + ' = ' + JSON.stringify(files) + '\n'
    }

    var customize = fs.readFileSync('customize.html', 'utf-8')
    var files = getFiles('js') + getFiles('less') + getFiles('fonts')
    fs.writeFileSync('assets/js/raw-files.js', files)
  });
};