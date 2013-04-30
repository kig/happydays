#!/bin/bash
rm -r build/*;
mkdir -p build/images build/css build/js &&
java -jar /Users/ilmari/Downloads/compiler-latest/compiler.jar --js src/js/matrix.js src/js/util.js src/js/color_utils.js src/js/css_3d.js src/js/gift_card.js --compilation_level=SIMPLE_OPTIMIZATIONS > build/js/built.js &&
cp src/images/*.* build/images/ &&
cp src/index.html build/index.html &&
#cp src/index.src.html build/index.html &&
# cp src/css/*.css build/css &&
echo "Build complete"
