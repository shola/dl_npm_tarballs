## Project

1. Get the 10 [most depended on packages](https://www.npmjs.com/browse/depended) from npm.
2. For each package, download the latest tarball from the npm registry.
3. Extract the tarball into `./packages/${pkg.name}`, e.g. `./packages/lodash`.

## Setup

`nvm install 7.6.0 # or greater`
`nvm use 7.6.0`
`npm i`

## Testing
To run the `index` module and tests:
`npm test <NUMBER_OF_TESTS>`