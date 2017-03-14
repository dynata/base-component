'use strict';

let
    path = require('path');

module.exports = function (grunt) {
    
    // collect dependencies from node_modules
    let nm = path.resolve(__dirname, 'node_modules'),
        //dom = path.resolve(nm, 'dom/src/dom.js'),
        //on = path.resolve(nm, 'on/src/on.js'),
        //poly = path.resolve(nm, 'keyboardevent-key-polyfill/index'),
        vendorAliases = ['dom', 'keyboardevent-key-polyfill', 'on'],
        sourceMaps = true,
        watch = false,
        watchPort = 35750,
        babelTransform = [["babelify", { "presets": ["latest"] }]],
        devBabel = false;
    
    grunt.initConfig({
        
        browserify: {
            // source maps have to be inline.
            // grunt-exorcise promises to do this, but it seems overly complicated
            vendor: {
                // different convention than "dev" - this gets the external
                // modules to work properly
                // Note that vendor does not run through babel - not expecting
                // any transforms. If we were, that should either be built into
                // the app or be another vendor-type file
                src: ['.'],
                dest: 'tests/dist/vendor.js',
                options: {
                    // expose the modules
                    alias: vendorAliases.map(function (module) {
                        return module + ':';
                    }),
                    // not consuming any modules
                    external: null,
                    browserifyOptions: {
                        debug: sourceMaps
                    }
                }
            },
            dev: {
                files: {
                    'tests/dist/output.js': ['tests/src/lifecycle.js']
                },
                options: {
                    // not using browserify-watch; it did not trigger a page reload
                    watch: false,
                    keepAlive: false,
                    external: vendorAliases,
                    browserifyOptions: {
                        debug: sourceMaps
                    },
                    // transform not using babel in dev-mode.
                    // if developing in IE or using very new features,
                    // change devBabel to `true`
                    transform: devBabel ? babelTransform : [],
                    postBundleCB: function (err, src, next) {
                        console.timeEnd('build');
                        next(err, src);
                    }
                }
            },
            deploy: {
                files: {
                    'dist/BaseComponent.js': ['src/deploy.js']
                },
                options: {
                    //external: vendorAliases,
                    transform: babelTransform,
                    browserifyOptions: {
                        debug: sourceMaps
                    }
                }
            }
        },
        
        watch: {
            scripts: {
                files: ['tests/src/*.js', 'src/*.js', 'tests/*.html'],
                tasks: ['build-dev']
            },
            options: {
                livereload: watchPort
            }
        },

        'http-server': {
            main: {
                // where to serve from (root is least confusing)
                root: '.',
                // port (if you run several projects at once these should all be different)
                port: '8200',
                // host (0.0.0.0 is most versatile: it gives localhost, and it works over an Intranet)
                host: '0.0.0.0',
                cache: -1,
                showDir: true,
                autoIndex: true,
                ext: "html",
                runInBackground: false
                // route requests to another server:
                //proxy: dev.machine:80
            }
        },

        concurrent: {
            target: {
                tasks: ['watch', 'http-server'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    //
    grunt.registerTask('build-dev', function (which) {
        console.time('build');
        grunt.task.run('browserify:dev');

    });

    // task that builds vendor and dev files during development
    grunt.registerTask('build', function (which) {
        grunt.task.run('browserify:vendor');
        grunt.task.run('build-dev');
    });

    // task that builds files for production
    grunt.registerTask('deploy', function (which) {
        grunt.task.run('browserify:vendor');
        grunt.task.run('browserify:deploy');
    });


    // The general task: builds, serves and watches
    grunt.registerTask('dev', function (which) {
        grunt.task.run('build');
        grunt.task.run('concurrent:target');
    });

    // alias for server
    grunt.registerTask('serve', function (which) {
        grunt.task.run('http-server');
    });

    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-http-server');
};