# Basis Transcoder Custom WASM Build

Three.js ships a version of `basis_transcoder.js` and `basis_transcoder.wasm`. These were compiled in a way that includes `new Function(string)` calls, which causes errors on sites with a restrictive Content Security Policy (CSP) that disallows `'unsafe-eval'`.

[This PR](https://github.com/BinomialLLC/basis_universal/pull/323) points out an Emscripten flag that removes the dynamic evals. It hasn't (yet) been merged, so we'll store our own custom compiled version here until it becomes official.

## Steps to compile the custom build

```shell
# Install Emscripten and CMake (use Homebrew on Mac or manual steps on their websites)
brew install emscripten
brew install cmake

# Check out the Basis repository
git clone git@github.com:BinomialLLC/basis_universal.git
cd basis_universal

# Apply the patch from the PR - patch file stored in this directory for convenience
git apply $MP_WEBGL_PATH/cwf/src/lib/basis/no-dynamic-execution.patch

# Build the transcoder
cd webgl/transcoder/build
emcmake cmake ../
make

# Assuming all went well, copy the resulting files to this directory
cp basis_transcoder.* $MP_WEBGL_PATH/cwf/src/lib/basis/
```

## License

Used according to the terms of the [Apache License 2.0](https://github.com/BinomialLLC/basis_universal/blob/master/LICENSE)
