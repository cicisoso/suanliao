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
	    	src: [
	    		'js/common/component/uibase/base.js',
	    		'js/common/component/uibase/align.js',
	    		'js/common/component/uibase/autoshow.js',
	    		'js/common/component/uibase/autohide.js',
	    		'js/common/component/uibase/close.js',
	    		'js/common/component/uibase/drag.js',
	    		'js/common/component/uibase/keynav.js',
	    		'js/common/component/uibase/mask.js',
	    		'js/common/component/uibase/position.js',
	    		'js/common/component/uibase/listitem.js',
	    		'js/common/component/uibase/stdmod.js',
	    		'js/common/component/uibase/decorate.js',
	    		'js/common/component/uibase/tpl.js',
	    		'js/common/component/uibase/collapseable.js',
	    		'js/common/component/uibase/selection.js',
	    		'js/common/component/uibase/list.js',
	    		'js/common/component/uibase/childcfg.js',
	    		'js/common/component/uibase/depends.js',
	    		'js/common/component/uibase/bindable.js'
	    	],
	    	dest: 'js/common/component/uimixins.js'
	    },
	    component: {
	    	src: [
	    		'js/common/component/manage.js',
	    		'js/common/component/uibase.js',
	    		'js/common/component/uimixins.js', 
	    		'js/common/component/view.js',
	    		'js/common/component/loader.js',
	    		'js/common/component/controller.js'
	    	],
	    	dest: 'js/common/component-tmp.js'	
	    },
	    common: {
	    	src: [
	    		'js/common/common.js', 
	    		'js/common/util.js', 
	    		'js/common/array.js', 
	    		'js/common/observable.js', 
	    		'js/common/ua.js', 
	    		'js/common/json.js', 
	    		'js/common/keycode.js', 
	    		'js/common/date.js', 
	    		'js/common/base.js', 
	    		'js/common/component.js',
	    		'js/common/component-tmp.js'
	    	],
	    	dest: 'dist/common.js'
	    },
	    tree : {
          src: [
            'js/tree/base.js',
            'js/tree/treemixin.js',
            'js/tree/treelist.js'
          ],
          dest: 'dist/tree.js'
        },

        tooltip : {
            src: [
              'js/tooltip/base.js',
              'js/tooltip/tip.js',
              'js/tooltip/tips.js',
            ],
            dest: 'dist/tooltip.js'
        },
        
        tab : {
            src: [
              'js/tab/base.js',
              'js/tab/navtabitem.js',
              'js/tab/navtab.js',
              'js/tab/tabitem.js',
              'js/tab/tab.js',
              'js/tab/tabpanelitem.js',
              'js/tab/tabpanel.js',
            ],
            dest: 'dist/tab.js'
        },
        
        select : {
            src: [
              'js/select/base.js',
              'js/select/select.js',
              'js/select/combox.js',
              'js/select/suggest.js'
            ],
            dest: 'distlect.js'
        },
        
        progressbar : {
            src: [
              'js/progressbar/base.js',
              'js/progressbar/progressbar.js',
              'js/progressbar/loadprogressbar.js'
            ],
            dest: 'dist/progressbar.js'
        },
 
        picker : {
            src: [
            	'js/picker/base.js',
              	'js/picker/picker.js',
              	'js/picker/listpicker.js'
            ],
            dest: 'dist/picker.js'
        },

        overlay : {
            src: [
              'js/overlay/base.js',
              'js/overlay/overlay.js',
              'js/overlay/dialog.js',
              'js/overlay/message.js',
            ],
            dest: 'dist/overlay.js'
        },
        
        menu : {
            src: [
              'js/menu/base.js',
              'js/menu/menuitem.js',
              'js/menu/menu.js',
              'js/menu/popmenu.js',
              'js/menu/contextmenu.js',
              'js/menu/sidemenu.js'
            ],
            dest: 'dist/menu.js'
        },
        
        mask : {
            src: [
              'js/mask/base.js',
              'js/mask/mask.js',
              'js/mask/loadMask.js',
            ],
            dest: 'dist/mask.js'
        }, 
        
        
        loader : {
            src: [
              'js/loader/sea.js',
              'js/loader/seajs-cfg.js'
            ],
            dest: 'dist/loader.js'
        }, 
 
        list : {
            src: [
              'js/list/base.js',
              'js/list/domlist.js',
              'js/list/keynav.js',
              'js/list/simplelist.js',
              'js/list/listbox.js',
              'js/list/listitem.js',
              'js/list/list.js',
            ],
            dest: 'dist/list.js'
        }, 

        grid : {
            src: [
              'js/grid/base.js',
              'js/grid/simplegrid.js',
              'js/grid/column.js',
              'js/grid/header.js',
              'js/grid/grid.js',
              'js/grid/util.js',
              'js/grid/plugins/base.js',
              'js/grid/plugins/gridmenu.js',
              'js/grid/plugins/cascade.js',
              'js/grid/plugins/selection.js',
              'js/grid/plugins/summary.js',
              'js/grid/plugins/editing.js',
              'js/grid/plugins/cellediting.js',
              'js/grid/plugins/rowediting.js',
              'js/grid/plugins/dialog.js'
            ],
            dest: 'dist/grid.js'
        }, 
        
        form : {
            src: [
              'js/form/base.js',
              'js/form/tips.js',
              'js/form/field/base.js',
              'js/form/field/text.js',
              'js/form/field/number.js',
              'js/form/field/hidden.js',
              'js/form/field/readyonly.js',
              'js/form/field/select.js',
              'js/form/field/date.js',
              'js/form/field/check.js',
              'js/form/field/checkbox.js',
              'js/form/field/radio.js',
              'js/form/field/plain.js',
              'js/form/field/list.js',
              'js/form/field/checklist.js',
              'js/form/field/radiolist.js',
              'js/form/field.js',
              'js/form/valid.js',
              'js/form/groupvalid.js',
              'js/form/fieldcontainer.js',
              'js/form/group/base.js',
              'js/form/group/rnge.js',
              'js/form/group/range.js',
              'js/form/group/check.js',
              'js/form/group/select.js',
              'js/form/fieldgroup.js',
              'js/form/form.js',
              'js/form/hform.js',
              'js/form/row.js',
              'js/form/rule.js',
              'js/form/rules.js',
              'js/form/remote.js'

            ],
            dest: 'dist/form.js'
        },
 
        editor : {
            src: [
              'js/editor/base.js',
              'js/editor/mixin.js',
              'js/editor/editor.js',
              'js/editor/record.js',
              'js/editor/dialog.js',
            ],

            dest: 'dist/editor.js'
        },
        
        data : {
            src: [
              'js/data/base.js',
              'js/data/sortable.js',
              'js/data/proxy.js',
              'js/data/abstractstore.js',
              'js/data/node.js',
              'js/data/treestore.js',
              'js/data/store.js',

            ],
            dest: 'dist/data.js'
        },   
        
        cookie : {
            src: [
              'js/cookie/cookie.js'
            ],
            dest: 'dist/cookie.js'
        },
        combine: {
        	src: [
        		'dist/loader.js', 
        		'dist/common.js', 
        		'dist/cookie.js', 
        		'dist/data.js', 
        		'dist/overlay.js', 
        		'dist/list.js', 
        		'dist/picker.js', 
        		'dist/form.js', 
        		'dist/select.js', 
        		'dist/mask.js', 
        		'dist/menu.js', 
        		'dist/tab.js', 
        		'dist/toolbar.js', 
        		'dist/progressbar.js', 
        		'dist/calendar.js', 
        		'dist/editor.js', 
        		'dist/grid.js', 
        		'dist/tree.js', 
        		'dist/tooltip.js', 
        		'js/all.js'
        	],
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