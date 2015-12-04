module.exports = function (grunt) {
  grunt.initConfig({
    less: {
      development: {
        files: {
          'source/css/style.css': 'source/less/index.less'
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']
      },
      dist: {
        expand: true,
        flatten: true,
        src: ['source/css/*.css'],
        dest: 'source/css/'
      }
    },

    cssUrlEmbed: {
      dist: {
        expand: true,
        flatten: true,
        src: ['source/css/*.css'],
        dest: 'source/css/'
      }
    },

    copy: {
      dist: {
        files: [
          {
            expand: true,
            src: ['source/**', '!manifest.json'],
            dest: [
              'vendor/chrome/content',
              'vendor/firefox/content',
              'vendor/safari/content'
            ]
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-css-url-embed');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('styles', ['less', 'autoprefixer', 'cssUrlEmbed']);
  grunt.registerTask('default', ['less', 'autoprefixer', 'cssUrlEmbed', 'copy']);
};
