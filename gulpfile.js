var gulp = require("gulp");
var deploy = require("gulp-gh-pages");

gulp.task('deploy', function () {
  gulp.src("_book/**/*.*")
    .pipe(deploy({
      remoteUrl: "https://github.com/hokein/clang-tools-tutorial"
    }))
    .on("error", function(err){
      console.log(err);
    })
});
