#!/bin/bash
rm -r build/*;
mkdir -p build/images build/css build/js &&
java -jar /Users/ilmari/Downloads/compiler-latest/compiler.jar --js src/js/matrix.js src/js/E.js src/js/gift_card.js --compilation_level=SIMPLE_OPTIMIZATIONS > build/js/built.js &&
cp src/images/*.* build/images/ &&
cp src/index.html build/index.html &&
ruby -e 'd=File.read("build/index.html"); d.sub!(/<!-- SCRIPT -->.*<!-- ENDSCRIPT -->/m, %Q(<script async src="js/built.js"></script>)); File.open("build/index.html", "w"){|f| f.write(d); }' &&
ruby -e 'd=File.read("build/index.html"); d.sub!(/<link rel="stylesheet" href="css\/style.css">/m, %Q(<style>#{File.read("src/css/style.css")}</style>) ); File.open("build/index.html", "w"){|f| f.write(d); }' &&
java -jar /Users/ilmari/Downloads/htmlcompressor-1.5.3.jar --compress-css --compress-js build/index.html -o build/index.html && 
# cp src/css/*.css build/css &&
echo "Build complete"
