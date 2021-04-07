[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Actions Status](https://github.com/bender-labs/wrap-indexer/workflows/indexer-main/badge.svg)](https://github.com/bender-labs/wrap-indexer/actions)

# Wrap protocol indexer

This indexer aims to ease wraps and unwraps via dapps.

## Features

### Indexing

* Tezos quorum current state.
* Ethereum quorum current state.
* Tokens list managed by the protocol.
* Current fee rate.  
* Initial wrap transactions on Ethereum.
* Initial unwrap operations on Tezos.
* Signatures produced by signers of the protocol and published on IPFS.
* Finalized wraps on Tezos.
* Finalized unwraps on Ethereum.

### API

* Get current protocol configuration. (tokens list, contracts addresses, signatures threshold...)
* Get wraps and unwraps state by source or destination address. This includes signatures needed to finalize wraps and unwraps.

### Others

* Pin IPFS publications of all signers to local IPFS

## Local deployment

`docker-compose up`

## Versioning

`npm version`

## License

Licensed under the MIT. See the [LICENSE](https://github.com/bender-labs/wrap-indexer/blob/main/LICENSE) file for details.
