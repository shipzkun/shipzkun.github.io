class Sukatam {
	// to unify messages
	#msg_success = function(data) {return {"success": true, "data": data}}
	#msg_error = function(errmsg) {return {"success": false, "errmsg": errmsg}}

	#converters = function(cb_success, cb_error) {
		/***** INTERNAL CONVERTER FUNCTIONS *****/

		// according to https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#supported_algorithms,
		const HASH_SHA1='SHA-1', HASH_SHA256='SHA-256', HASH_SHA384='SHA-384', HASH_SHA512='SHA-512'
		let hash_algos = [HASH_SHA1, HASH_SHA256, HASH_SHA384, HASH_SHA512]
		let HASH_COMMENT = "This requires the Web Crypto and TextEncoder APIs. Conversion will not work if your browser does not support these APIs."

		// function to process hashing requests
		// uses SubtleCrypto and TextEncoder APIs
		// Original code: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
		// returns a promise
		let hash = async function(text, algo) {
			if (hash_algos.indexOf(algo) == -1) {
				return cb_error("Unsupported hashing algo: "+algo)
			}

			const msgUint8 = new TextEncoder().encode(text);
			const hashBuffer = await crypto.subtle.digest(algo, msgUint8);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
			return cb_success(hashHex);
		}



		// NOTE: Defined like this so we can get() in O(1)
		var convs = {
			"none": {"name": "None", "function": async function(text) {
				return cb_success(text)
			}}
			,"sha1": {"group":"hashes", "name": "SHA-1", "remarks": HASH_COMMENT, "function": async function(text) {
				return hash(text, HASH_SHA1)
			}}
				,"sha256": {"group":"hashes", "name": "SHA-256", "remarks": HASH_COMMENT, "function": async function(text) {
				return hash(text, HASH_SHA256)
			}}
			,"sha384": {"group":"hashes", "name": "SHA-384", "remarks": HASH_COMMENT, "function": async function(text) {
				return hash(text, HASH_SHA384)
			}}
			,"sha512": {"group":"hashes", "name": "SHA-512", "remarks": HASH_COMMENT, "function": async function(text) {
				return hash(text, HASH_SHA512)
			}}
		}


		/***** PUBLIC FUNCTIONS *****/

		// return format:
		//   {"converter_id": "name", "converter_group":{"converter_id", "name"}}
		//   at most one level of depth
		let list = function() {
			let list = {}
			for (let i in convs) {
				if (convs[i].hasOwnProperty('group')) {
					if (!list.hasOwnProperty(convs[i]['group'])) {
						list[convs[i]['group']] = {}
					}
					list[convs[i]['group']][i] = convs[i]['name']
				} else {
					list[i] = convs[i]['name']
				}
			}
			return list
		}

		let get = function(algo) {
			if (!convs.hasOwnProperty(algo)) {
				return null
			}

			return convs[algo].function
		}

		let info = function(algo) {
			if (!convs.hasOwnProperty(algo)) {
				return null
			}

			return {
				"name": convs[algo].name,
				"remarks": convs[algo].remarks
			}
		}


		// return our interface
		return {
			"list": list,
			"get": get,
			"info": info
		}
	}(this.#msg_success, this.#msg_error)

	supported_converters() {
		return this.#converters.list()
	}

	// our main function
	async process(text, algo, opts) {
		let conv = this.#converters.get(algo)
		if (conv == null) {
			return this.#msg_error("Unrecognized converter: "+algo)
		}

		return await conv(text, algo, opts)
	}

	// get converter details
	get_converter_details(converter) {
		return this.#converters.info(converter)
	}
}

export { Sukatam };
